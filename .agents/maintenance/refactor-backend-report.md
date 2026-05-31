# Code Quality Report — Backend

Populated by `/bftc-refactor-backend`. Each run appends a dated entry.

New PRs use branch `maint/refactor-backend/<short-topic>` and PR title
`maint(refactor-backend): <subject>`. Older report entries may keep legacy
`claude/*` branch names.

---

## Run 2026-05-31 — branch `claude/quirky-euler-JqDcx`

**Model:** claude-opus-4-8
**Scan commit:** `a086359`

> Branch note: current runs use the `maint/refactor-backend/<topic>` branch family, but this historical session was pinned by the harness to `claude/quirky-euler-JqDcx` (with an explicit "never push to a different branch" rule). The harness directive took precedence.

---

### Prior findings status (Run 2026-05-30)

| ID | Status | Note |
|----|--------|------|
| C1 | **STILL OPEN → SELECTED** | `handleCombatResolution` still ~435 LOC (worker now 1142 LOC). This run's theme. |
| C2 | RESOLVED | `CombatReportService` extracted; `combat.service.ts` 1132 → 906 LOC. |
| C3 | **STILL OPEN → ADDRESSED** | Barbarian/PvP loot-deduction branches still duplicated (`combat.worker.ts:169-257`). Folded into this run's extraction. |
| C4 | **STILL OPEN** | `getUserIdByVillage` N+1 in outbox dispatch (now 17 call-sites, `event-outbox.service.ts:530`). Not selected — see rejected themes. |
| C5 | **STILL OPEN** | Capture-duration tables still defined in worker (`combat.worker.ts:34-48`). Low. |
| C6 | RESOLVED | `resources.service.ts` recursive call no longer present at cited line. |

---

### Module structure (mental model)

`src/` = bounded contexts under `modules/` + cross-cutting `workers/`, `infra/`, `common/`. Layering is clean: only `health.controller.ts` imports `PrismaService` (a liveness ping — legitimate); no other controller touches the DB. Zero `any`, zero `console.*`, zero swallowed `catch`. The combat module dominates (`combat.worker.ts` 1142, `combat.service.ts` 906, `conquest.service.ts` 565) and is also the highest-churn area. The `event/` module owns the Outbox→Socket.IO dispatch loop; `RetentionService`/`OnboardingService` are side-effect listeners hooked into dispatch.

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| B1 | Service design | `combat.worker.ts:109-544` | **SELECTED** — `handleCombatResolution` is a ~435 LOC god method inside a single `$transaction`: dispatches REINFORCE/SCOUT early returns, builds context, applies loot + losses (twice, see B2), creates the defender event, writes the combat report, opens the capture window, computes return loot/units, updates expedition, emits `battle.resolved`, schedules return. ~12 distinct responsibilities, no seams for testing sub-steps. | High | L |
| B2 | Duplication | `combat.worker.ts:169-257` | **ADDRESSED with B1** — BARBARIAN_VILLAGE and PLAYER_VILLAGE branches both: re-fetch `defenderVillage` with the same include, decrement looted `wood/stone/iron`, emit `resourcesChanged`, call `applyDefenderLosses`. Only real divergence: barbarian resets `lastUpdateTs` and looks up `occupationDefense`. ~50 near-identical LOC. | Medium | S |
| B3 | Performance | `event-outbox.service.ts:530` | `getUserIdByVillage` issues one `village.findUnique` per event in the dispatch loop — up to 100 sequential single-row queries per 1s batch (17 call-sites resolve villageId→userId individually). Batchable via a single `findMany(where id in […])` resolved once per batch. | Medium | M |
| B4 | Observability/perf | `event-outbox.service.ts:65-92` | Hot dispatch loop logs 2–3 verbose `logger.log` lines **per event** (`📦`/`📨`/`✅` with full payload echo) at default level on every ~1s poll. Noise + serialization cost in steady state; should be `debug`. | Low | S |
| B5 | Config | `combat.worker.ts:34-48` | `BARBARIAN_CAPTURE_DURATIONS_MS` / `PVP_CAPTURE_DURATIONS_MS` are gameplay-balance tables hardcoded in the worker rather than world config. (Carried from C5.) | Low | S |
| B6 | Type safety | `combat.worker.ts:159-166` | Inline anonymous types for `defenderVillage` / `occupationDefense` / `pendingConquest` repeated as ad-hoc `Prisma.VillageGetPayload<…>` literals; a named alias would cut repetition and let the extracted helpers share a signature. | Low | S |

---

### Looks bad but is actually fine

- **`as Payload` casts in `event-outbox.service.ts` switch** (lines 108-195): each `case` narrows on a validated `EventKind` and the payload was already `parseEventPayload`-validated against `EVENT_PAYLOAD_SCHEMAS` at line 104. The cast is a typing bridge over a Zod-validated value, not unsafe coercion. Exhaustive `never` default present.
- **Outbox error swallowing** (`event-outbox.service.ts:93-95`): intentional — a failed dispatch leaves `dispatchedAt: null`, so the next poll retries. Logged, not silenced.
- **pg-boss `.send` outside the `$transaction`** (`combat.worker.ts:534`, `combat.service.ts:558`): deliberate — avoids scheduling a job that a rolled-back tx would orphan. Documented inline.
- **`recallEnRoute` relies on the worker status guard instead of cancelling the pg-boss job** (`combat.service.ts:533-537`): documented fallback — the resolution worker no-ops on non-`EN_ROUTE` status. Correct given jobId isn't stored.
- **Empty `catch {}`-looking blocks**: none are actually empty — every catch logs and/or rethrows (verified all 18 sites).
- **`health.controller.ts` importing Prisma**: the one controller with DB access; it's a liveness probe, the canonical exception to the no-DB-in-controller rule.

---

### Selected theme: B1 + B2 — decompose `handleCombatResolution`

**Why this over alternatives:**
- **B1 is the single highest-severity structural finding** and sits in the largest + highest-churn file — every combat change pays the comprehension tax of a 435-LOC method.
- **B2 lives inside B1's body**, so folding the duplicated loot/loss branches into one helper is a natural by-product, not separate churn → one coherent theme.
- Fully verifiable with the **existing combat smoke suite** (15 tests exercising barbarian + PvP attack, conquest hook, reinforce, scout, recall, finalize) — all green at baseline. No gameplay rule change, no Prisma migration.

**Rejected:**
- **B3 (outbox N+1):** real, but Medium effort and touches the realtime hot path — higher blast radius, and at current scale (≤100 events/batch on a single node) it's not yet a felt bottleneck. Better as its own focused PR with a perf assertion. Deferred.
- **B4/B5/B6:** Low severity; would be padding bundled with a structural refactor and muddy the diff/review. B4 in particular changes log output and deserves isolated review.

**Plan:** extract cohesive private helpers from `handleCombatResolution` — `handleReinforcementArrival`/`handleScoutArrival` already exist; add `applyLootToDefender` (unifying the B2 branches), `emitVillageAttackedEvent`, `writeCombatReport`, `handleConquestOutcome` (capture window vs. noble-killed), `computeReturn` (return units/loot/at), `finalizeExpedition` (persist + `battle.resolved` + schedule return). The top-level method becomes a readable orchestration of named steps inside the same transaction — **behavior-preserving**, no signature changes to public methods or events.

### Result

- `handleCombatResolution` transaction body: **~435 LOC → ~166 LOC** orchestration of 6 named steps (`combat.worker.ts:123-289`).
- B2 duplication eliminated: the two ~50-LOC barbarian/PvP loot branches collapse into one `applyLootToDefender` (the only divergence — barbarian `lastUpdateTs` reset + occupation lookup — is now an explicit conditional).
- New named types `DefenderVillage` / `OccupationDefense` + `EMPTY_LOOT` constant remove repeated inline `Prisma.VillageGetPayload<…>` literals and `{ wood: 0, stone: 0, iron: 0 }` duplication (partially addresses B6).
- File total grew 1142 → 1313 LOC: the extraction trades inline tangle for explicit helper signatures + JSDoc. Net readability/testability win; no public surface change.

### Verification

```shell
yarn static-check                                   → ✅ tsc (backend+pixi) + eslint --quiet, 0 errors
yarn test (backend unit)                            → ✅ 232 passed, 21 suites
yarn test:smoke:run (combat-attack, conquest-hook,  → ✅ 20 passed, 8 suites
  reinforcements, scouting, recall-en-route,
  conquest-finalize, combat-reports-inbox, barbarians)
```

Baseline (pre-refactor, commit `a086359`): 232 unit + 15 combat smokes green → same green post-refactor (smoke set widened to 20 for coverage). Behavior preserved.

### Docs impact

Aucun changement nécessaire — refactor interne d'un worker, pas de changement d'API REST, d'event WS, de modèle Prisma ni de règle gameplay. Les durées de capture (B5) restent hardcodées (hors scope).

---

## Run 2026-05-30 — branch `claude/bftc-refactor-backend-combat-report-split`

**Model:** claude-sonnet-4-6

---

### Module structure (mental model)

`battleforthecrown-backend/src/` organized in bounded contexts under `modules/`. Combat is the largest: `CombatService` (initiation + queries + reports), `CombatWorker` (resolution), `ConquestService`, `ReturnWorker`. The `event/` module owns the Outbox dispatch loop. `RetentionService` and `OnboardingService` are side-effect listeners hooked into Outbox dispatch.

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| C1 | Service design | `combat.worker.ts:109` | God method: `handleCombatResolution` 420+ LOC, dispatches 3 expedition kinds (ATTACK/REINFORCE/SCOUT) with early returns at lines 132 and 136 | High | L |
| C2 | Service design | `combat.service.ts` | **SELECTED** — 14 public methods across 4 unrelated domains in 1132 LOC | High | M |
| C3 | Duplication | `combat.worker.ts:169-257` | BARBARIAN_VILLAGE and PLAYER_VILLAGE branches duplicate loot deduction + `resourcesChanged` + `applyDefenderLosses`; single difference is barbarian resets `lastUpdateTs` | Medium | S |
| C4 | Performance | `event-outbox.service.ts:530-536` | `getUserIdByVillage` fires one `findUnique` per event in dispatch loop — up to 100 sequential DB queries per batch | Medium | S |
| C5 | Config | `combat.worker.ts:34-48` | Capture duration tables defined in worker — gameplay rules that belong in world config | Low | S |
| C6 | Readability | `resources.service.ts:50` | Recursive `this.getResources` tail call after production catchup — surprising pattern | Low | S |

---

### Looks bad but is actually fine

- **pg-boss outside transaction** (`combat.worker.ts:534-536`): intentional — avoids scheduling jobs when tx rolls back.
- **Outbox error swallowing** (`event-outbox.service.ts:93-95`): by design — poller retries on next cycle.
- **Retention/onboarding catches**: all check for Prisma P2002 and rethrow otherwise — correct idempotency.
- **Zero `any` types** across all production code.

---

### Selected theme: C2 — extract report management → `CombatReportService`

**Evidence:** `combat.service.ts` lines 909-1131 (report CRUD, 222 LOC) + 3 private helpers exclusively serving report methods. Entirely orthogonal to expedition initiation.

**Why over alternatives:**
- C1 (god method): requires gameplay understanding to split safely, higher risk.
- C3 (loot dedup): minimal LOC gain.
- C4 (N+1 outbox): low urgency at current game scale.

**Result:** `CombatService` 1132 → 683 LOC (−449). New `CombatReportService` (183 LOC) owns all combat + scout report read/write/delete. Controller delegates to the appropriate service.

---

### Files changed

- `src/modules/combat/combat-report.service.ts` — NEW
- `src/modules/combat/combat.service.ts` — removed 12 methods
- `src/modules/combat/combat.controller.ts` — injected `CombatReportService`
- `src/modules/combat/combat.module.ts` — registered `CombatReportService`

---

### Verification

```
yarn static-check              → ✅ 0 errors
jest --testPathPatterns=combat → ✅ 71 passed, 6 suites
```

---

### Docs impact

Aucun impact — pas de changement d'API, pas de nouveau contrat, pas de règle gameplay modifiée.
