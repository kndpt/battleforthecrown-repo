# refactor-pixi — state (rewritten each run)

last: 2026-06-27 | theme DRY-invalidation-helpers-round-2 | PR #210
full: `archive/refactor-pixi/2026-06-27-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| Q-01 | Critical | queries.ts:1149,1165,1179 | createReportHooks: unsafe `as` fallback bypasses Zod |
| C-01 | High | ArmyScreen.tsx:681L | 50+ state vars, mixed onboarding/garrison/recruitment |
| C-02 | High | SpecializedBuildingDetailModal.tsx:636L | 30+ props, 8 nested building types |
| C-03 | High | VillageView.tsx:573L | 7 useState, 12+ queries, modal orchestration |
| P-01 | High | WorldMapScene.ts:930L | Scene monolith: viewport/entities/fog/expeditions/camera |
| WS-01 | High | ws-bindings.ts:831-878 | applyVillageConquered god function |
| S-01 | High | resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache |
| C-04 | High | BuildingDetailModal.tsx | 50+ props drilled to specialized modals |
| Q-09 | Med | queries.ts:~1790L | Monolith: 50+ hooks + DTOs in single file |
| WS-02 | Med | ws-bindings.ts | worldId null assumption across handlers |
| WS-03 | Med | ws-bindings.test.ts | 4 handlers untested |
| P-02 | Med | WorldMapScene.ts:610-612 | Entity pointertap listener leak |
| P-03 | Med | WorldMapScene.ts:645-650 | Viewport background tap listener leak |
| P-04 | Med | WorldMapScene.ts + others | Scattered magic numbers |
| S-02 | Med | Multiple | Missing store selectors |
| S-03 | Med | ui.ts:131L | Toasts + modals + defeats mixed |

## CLOSED this run

| ID | Fix |
|----|-----|
| Q-10 | DRY: extracted `invalidateVillageEconomy` in ws-bindings.ts (10 sites) |
| Q-11 | DRY: extracted `invalidateArmyMutationQueries` in queries.ts (3 mutations) |
| Q-12 | DRY: extracted `invalidateBuildingMutationQueries` in queries.ts (2 mutations) |
| WS-04 | BUG FIX: applyNobleKilled missing invalidatePowerQueries + invalidateCombatReports |
| WS-05 | TEST: extended applyNobleKilled test to cover power + reports invalidation |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| Q-05 | DRY: extracted `invalidateCombatDispatchQueries` helper (attack + scout) |
| Q-06 | DRY: extracted `invalidateTroopMovementQueries` helper (reinforce + recall) |
| Q-07 | BUG FIX: useRecallReinforcementMutation now invalidates population + villagePower + kingdomPower |
