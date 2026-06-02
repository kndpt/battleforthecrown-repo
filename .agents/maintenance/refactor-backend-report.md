# Code Quality Report — Backend

Populated by `/bftc-refactor-backend`. Each run appends a dated entry.

New PRs use branch `maint/refactor-backend/<short-topic>` and PR title
`maint(refactor-backend): <subject>`. Older report entries may keep legacy
`claude/*` branch names.

---

## Run 2026-06-02 — branch `claude/stoic-mayer-OEflV`

**Model:** claude-opus-4-8
**Scan commit:** `34b14a7`

> Branch note: skill prescribes `maint/refactor-backend/<topic>`, but the harness
> pinned this session to `claude/stoic-mayer-OEflV` with an explicit "never push
> to a different branch" rule. Harness directive takes precedence — same call as
> Run 2026-05-31.

---

### Prior findings status (Run 2026-05-31)

| ID | Status | Note |
|----|--------|------|
| B1 | **RESOLVED** | `handleCombatResolution` decomposed into 6 named steps (`combat.worker.ts:123-288`); the tx body is now a readable orchestration. |
| B2 | **RESOLVED** | Loot/loss branches unified in `applyLootToDefender` (`combat.worker.ts:296-354`); the only barbarian/PvP divergence is an explicit conditional. |
| B3 | **STILL OPEN** | `getUserIdByVillage` N+1 in outbox dispatch persists (`event-outbox.service.ts:534`, ~20 call-sites resolve villageId→userId one row at a time). Not selected — see rejected themes. |
| B4 | **STILL OPEN** | Verbose per-event `logger.log` (📦/📨/✅/🔔/⚔️/🛡️) in the hot dispatch loop still at default level (`event-outbox.service.ts:65-92` + 8 per-notify sites). Low. |
| B5 | **STILL OPEN** | Capture-duration tables still hardcoded in the worker (`combat.worker.ts:35-49`). Low. |
| B6 | **PARTIAL** | Named `DefenderVillage`/`OccupationDefense` types + `EMPTY_LOOT` added; `applyDefenderLosses`/`getCaptureDurationMs` still re-spell the inline `Prisma.VillageGetPayload<…>` literal (`combat.worker.ts:949-951,1064-1066`). Low. |

---

### Module structure (mental model)

`src/` = bounded contexts under `modules/` + cross-cutting `workers/`, `infra/`, `common/`. Layering is clean: only `health.controller.ts` touches Prisma (a liveness ping — the canonical exception); no other controller or gateway hits the DB. Zero `as any` / `: any` in production code, zero `console.*` outside `scripts/`, zero `@ts-ignore`. The combat module dominates by size **and** churn (`combat.worker.ts` 1389, `combat.service.ts` 907, `conquest.service.ts` 565) and is well sub-divided (`strategies/`, `loot/providers/`, `codecs/`, `*.presenter.ts`, `*-report.service.ts`). The `event/` module owns the Outbox→Socket.IO dispatch loop; `RetentionService`/`OnboardingService` are side-effect listeners hooked into dispatch. The two prior runs hollowed out `combat.worker.ts` (B1) and split `CombatReportService` out of `combat.service.ts` (C2), but `combat.service.ts` has since regrown 683 → 907 LOC as the four expedition-creation paths were added/extended, re-accumulating structural duplication.

---

### Findings

| ID | Category | Location | Description | Severity | Effort |
|----|----------|----------|-------------|----------|--------|
| D1 | Duplication | `combat.service.ts:60,176,261` | **SELECTED** — owned-village lookup `tx.village.findFirst({ where: { id, userId } })` + `if (!village) throw NotFoundException` repeated verbatim across `initiateAttack`/`initiateScout`/`initiateReinforce` (and a 4th non-owning variant in `initiateRecall`). | Medium | S |
| D2 | Duplication | `combat.service.ts:100-108, 189-197` | **SELECTED** — fog-of-war gate (load config → if `fogOfWar.enabled` → `getVisionDisks` → `isInVision` → `ForbiddenException`) duplicated verbatim in `initiateAttack` and `initiateScout`; only the action verb in the message differs. ~10 LOC × 2. | Medium | S |
| D3 | Duplication | `combat.service.ts:155,239,331,462` | **SELECTED** — `boss.send('combat:resolve', { expeditionId }, { startAfter, singletonKey: \`combat:${id}\` })` block copied identically across all four EN_ROUTE expedition creators. | Medium | S |
| D4 | Duplication | `combat.service.ts:127,213,304,434` | `tx.expedition.create` data block (`worldId`/`attackerVillageId`/`units: encodeUnitMap`/`status: 'EN_ROUTE'`/`departAt`/`arrivalAt`/`outboundTravelMs`) repeated 4× — varies only by `kind`/`targetKind`/`targetRefId`/`targetX/Y` + optional reinforcement fields. | Medium | M |
| B3 | Performance | `event-outbox.service.ts:534` | `getUserIdByVillage` issues one `village.findUnique` per event in the ~1s dispatch loop — up to 100 sequential single-row queries per batch (~20 call-sites resolve villageId→userId individually). Batchable via one `findMany(where id in […])` per batch. Carried from B3/C4. | Medium | M |
| B4 | Observability | `event-outbox.service.ts:65-92` + per-notify | Hot dispatch loop logs 2–3 verbose `logger.log` lines **per event** at default level on every poll, plus 8 emoji per-notify sites — noise + serialization cost in steady state; should be `debug`. Carried. | Low | S |
| B5 | Config | `combat.worker.ts:35-49` | `BARBARIAN_CAPTURE_DURATIONS_MS` / `PVP_CAPTURE_DURATIONS_MS` are gameplay-balance tables hardcoded in the worker rather than world config. Carried. | Low | S |
| B6 | Type debt | `combat.worker.ts:949-951, 1064-1066` | `applyDefenderLosses` / `getCaptureDurationMs` re-spell the inline `Prisma.VillageGetPayload<{ include: { resourceStock; buildings } }>` literal instead of reusing the named `DefenderVillage` alias defined at line 58. Trivial. | Low | S |
| D5 | Duplication | `combat.worker.ts:842-866, 911-930` | `buildBarbarianDefender` and `buildPlayerDefender` share a near-identical garrison→participants aggregation loop (~25 LOC each); only the seed participant + resource source differ. Extractable to a shared `aggregateGarrisonParticipants` helper. | Low | M |
| D6 | Observability | `combat.service.ts:56,173,257,349,480` + worker | Every public combat method opens with a `logger.log` echoing the full `dto` at default level — leaks unit composition / coordinates into steady-state logs; belongs at `debug`. | Low | S |

---

### Looks bad but is actually fine

- **`combat.controller.ts` is 273 LOC** — over the 200-LOC controller threshold, but it's pure delegation: every handler is a one-liner forwarding to a service, the only logic is the `requireWorldId` guard (a routing-level 400). Length is a function of endpoint count, not misplaced logic. Not a finding.
- **`as Payload` casts in `event-outbox.service.ts` switch** — each `case` narrows a value already validated by `parseEventPayload` against `EVENT_PAYLOAD_SCHEMAS` (line 104). Typing bridge over a Zod-checked value with an exhaustive `never` default. Fine.
- **Outbox dispatch `catch` that only logs** (`event-outbox.service.ts:93-95`) — intentional: a failed dispatch leaves `dispatchedAt: null` so the next poll retries. Not swallowed.
- **`boss.send` outside the `$transaction`** (`combat.service.ts:559-569` `recallEnRoute`, `combat.worker.ts:704`) — deliberate, documented inline: avoids scheduling a job a rolled-back tx would orphan. The N+1 scheduleResolution sites (D3) are *inside* their tx by design (same reasoning inverted: they must not fire if the create rolls back) — the dedup keeps them in-tx.
- **`recallEnRoute` relies on the worker status guard instead of cancelling the pg-boss job** (`combat.service.ts:534-538`) — documented fallback; jobId isn't stored, worker no-ops on non-`EN_ROUTE`.
- **`process.env` reads** — confined to `main.ts`/`app.module.ts` bootstrap, `outbox.worker.ts` poll interval, and `join-world.use-case.ts:176` (`startingResourceAmount`, validated + defaulted). No unvalidated secret reads.
- **`resolveTargetVillage` double `worldId` check** (`combat.service.ts:646-656`) — redundant but harmless guard; not worth touching in a dedup PR.

---

### Selected theme: D1 + D2 + D3 — collapse the duplicated expedition-creation skeleton in `CombatService`

**Why this over alternatives:**
- **`combat.service.ts` is the #2 file by size and regrew 683 → 907 LOC** since the last run's split — the clearest "debt re-accumulated" signal in the backend, and it sits in the highest-churn module.
- **D1/D2/D3 are three facets of one root cause**: the four EN_ROUTE expedition creators (`initiateAttack`/`Scout`/`Reinforce`/`Recall`) were written by copy-paste, so ownership lookup, the fog-of-war gate, and the `combat:resolve` scheduling are each duplicated 2–4×. Folding them into named private helpers is one coherent theme, not three.
- **Pure behavior-preserving extraction** → fully covered by the existing smoke suite (`combat-attack`, `scouting`, `reinforcements`, `recall-en-route`, `combat-conquest-hook`) + `static-check`. No public-method signature change, no event/payload change, no Prisma migration, no gameplay rule change.
- **Measurable**: collapses 6 owned-village lookups → 1 helper, 2 fog-of-war gates → 1, and 4 `combat:resolve` scheduling blocks → 1. Net LOC is ~flat (the three helpers cost roughly what the inline duplication did) — the win is single-source-of-truth, not line count: a change to ownership semantics, the fog gate, or the resolution-queue contract now touches one site instead of 2–4.

**Rejected:**
- **B3 (outbox N+1):** real and now ~20 call-sites, but Medium effort on the realtime hot path — higher blast radius, and it deserves its own focused PR with a perf assertion rather than riding on a dedup change. Deferred (3rd run running).
- **D4 (`expedition.create` block):** tempting, but the four creates diverge on enough fields (`kind`, optional `reinforcementOriginVillageId`, `reinforcementRecallActorUserId`) that a single builder risks obscuring intent; left out to keep the diff a crisp, obviously-equivalent extraction. Candidate for a follow-up.
- **D5 (defender-builder dedup):** Medium effort, touches combat-resolution input construction — better isolated so a reviewer can reason about garrison aggregation alone.
- **B4/B5/B6/D6:** Low severity; bundling log-level or config-table changes into a structural dedup would muddy the diff and the review.

**Plan:** add three private helpers to `CombatService`, behavior-preserving:
1. `loadOwnedVillage(tx, villageId, userId, notFoundMessage?)` — owned-village lookup (D1), used in attack/scout/reinforce.
2. `assertTargetInVision(userId, worldId, point, action)` — fog-of-war gate (D2), used in attack/scout; `action` feeds the existing error verb.
3. `scheduleResolution(expeditionId, startAfter)` — wraps the `combat:resolve` `boss.send` (D3), used in all four creators.

### Result

- `combat.service.ts`: 3 new private helpers (`loadOwnedVillage`, `assertTargetInVision`, `scheduleResolution`) replace the duplicated skeleton in `initiateAttack`/`initiateScout`/`initiateReinforce`/`initiateRecall`.
- Owned-village lookup: 3 inline `findFirst`+throw blocks → `loadOwnedVillage` (custom not-found message preserved for the reinforce path).
- Fog-of-war gate: the two verbatim `getConfig`→`getVisionDisks`→`isInVision`→`ForbiddenException` blocks → `assertTargetInVision`, with the action verb (`attack`/`scout`) parameterised so the error messages are unchanged.
- `combat:resolve` scheduling: 4 identical `boss.send` blocks → `scheduleResolution`. The single `combat:return` send in `recallEnRoute` is genuinely single-use and left inline.
- No public-method signature, REST contract, WS event, payload, or Prisma change. Behavior-preserving. File LOC ~flat (907 → 911); the value is DRY, not line count.

### Verification

```shell
yarn static-check                                   → ✅ tsc (backend+pixi) + eslint --quiet, 0 errors
yarn test:backend (unit)                            → ✅ 236 passed, 22 suites
yarn test:smoke:run (combat-attack, scouting,       → ✅ 14 passed, 5 suites
  reinforcements, recall-en-route, conquest-hook)
```

Baseline (commit `34b14a7`): same suites green pre-refactor → green post-refactor. Behavior preserved.

### Docs impact

Aucun changement nécessaire — refactor interne d'un service (extraction de helpers privés), pas de changement d'API REST, d'event WS, de modèle Prisma ni de règle gameplay. Findings B3/B4/B5/B6/D4/D5/D6 restent ouverts (hors scope, documentés ci-dessus).



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
