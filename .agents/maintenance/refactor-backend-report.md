# Code Quality Report — Backend

Populated by `/bftc-refactor-backend`. Each run appends a dated entry.

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
