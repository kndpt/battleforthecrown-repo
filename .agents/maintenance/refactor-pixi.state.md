# refactor-pixi — state (rewritten each run)

last: 2026-06-30 | theme report-trust-boundary-zod | branch claude/focused-galileo-2u4in4
full: `archive/refactor-pixi/2026-06-30-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F01 | Critical | queries.ts:870-889 | useTrainUnitsMutation: hardcoded timePerUnitMs=60_000 in optimistic update |
| C-01 | High | ArmyScreen.tsx:681L | 50+ state vars, mixed onboarding/garrison/recruitment |
| C-03 | High | VillageView.tsx:573L | 26 hooks, 8 useState, 40+ props drilled |
| P-01 | High | WorldMapScene.ts:930L | Scene monolith: viewport/entities/fog/expeditions/camera |
| WS-01 | High | ws-bindings.ts applyVillageConquered | god function (conquest + map + UI + reports) |
| S-01 | High | resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache |
| C-04 | High | BuildingDetailModal.tsx | 25+ props drilled to specialized modals |
| Q-09 | Med | queries.ts:~1850L | Monolith: 50+ hooks + DTOs in single file |
| WS-02 | Med | ws-bindings.ts | worldId null assumption across handlers |
| WS-03 | Med | ws-bindings.test.ts | some handlers untested |
| P-02 | Med | WorldMapScene.ts:610-612 | Entity pointertap listener leak |
| P-03 | Med | WorldMapScene.ts:645-650 | Viewport background tap listener leak |
| S-02 | Med | Multiple | Missing store selectors |
| S-03 | Med | ui.ts:131L | Toasts + modals + defeats mixed |
| STR-02 | Med | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |

## CLOSED this run

| ID | Fix |
|----|-----|
| Q-01 | Zod schemas for all 4 report types in shared + required parsers in createReportHooks |
| SCN-01 | VERIFIED RESOLVED: ticker handler properly removed before exit() |

## CLOSED prior runs

| ID | Fix |
|----|-----|
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
