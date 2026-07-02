# refactor-pixi — state (rewritten each run)

last: 2026-07-01 | theme split-queries-monolith | branch claude/focused-galileo-hd3gxu
full: `archive/refactor-pixi/2026-07-01-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F01 | Critical | queries/army.ts:97 | useTrainUnitsMutation: hardcoded timePerUnitMs=60_000 in optimistic update |
| C-01 | High | ArmyScreen.tsx:681L | 23 hooks, 5 state vars, mixed tabs/recruitment/garrison |
| C-03 | High | VillageView.tsx:573L | 30 hooks, 8 state vars, god component |
| P-01 | High | WorldMapScene.ts:1019L | 8 responsibilities, ~250L extractable |
| S-01 | High | stores/resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache |
| WS-01 | Med | ws-bindings.ts:applyVillageConquered | 51L well-structured; downgraded from High |
| WS-02 | Med | ws-bindings.ts | worldId null assumption across handlers |
| WS-03 | Med | ws-bindings.test.ts | 5 untested handlers (low risk) |
| S-02 | Med | Multiple | Missing store selectors |
| S-03 | Med | stores/ui.ts:131L | Toasts + modals + defeats mixed |
| STR-02 | Med | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |

## CLOSED this run

| ID | Fix |
|----|-----|
| Q-09 | Split queries.ts monolith (2035L) → 12 domain modules under api/queries/ |
| P-02 | VERIFIED RESOLVED: no listener leaks detected in WorldMapScene audit |
| P-03 | VERIFIED RESOLVED: viewport removeAllListeners on exit covers all |
| C-04 | RECLASSIFIED: pure presentational (22 props, 0 hooks) — looks bad but fine |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| Q-01 | Zod schemas for all 4 report types in shared + required parsers in createReportHooks |
| SCN-01 | VERIFIED RESOLVED: ticker handler properly removed before exit() |
| WS-06 | BUG FIX: applyCaravanArrived missing invalidatePowerQueries for target village |
| WS-07 | BUG FIX: applyGarrisonAdded missing invalidatePowerQueries for host village |
| WS-08 | BUG FIX: applyVillageConquered missing garrison cache invalidation |
| Q-13 | PERF: rankingsSummaryQuery refetchInterval 30s→120s (WS covers normal path) |
| WS-09 | TEST: extended tests for caravan/garrison/conquest invalidation coverage |
| Q-10 | DRY: extracted invalidateVillageEconomy in ws-bindings.ts (10 sites) |
| Q-11 | DRY: extracted invalidateArmyMutationQueries in queries.ts (3 mutations) |
| Q-12 | DRY: extracted invalidateBuildingMutationQueries in queries.ts (2 mutations) |
| WS-04 | BUG FIX: applyNobleKilled missing invalidatePowerQueries + invalidateCombatReports |
| WS-05 | TEST: extended applyNobleKilled test for power + reports |
| Q-05 | DRY: extracted invalidateCombatDispatchQueries helper (attack + scout) |
| Q-06 | DRY: extracted invalidateTroopMovementQueries helper (reinforce + recall) |
| Q-07 | BUG FIX: useRecallReinforcementMutation missing population + villagePower + kingdomPower |
