# refactor-pixi — state (rewritten each run)

last: 2026-07-02 | theme ws-test-coverage-session-hardening | branch claude/focused-galileo-h6er6f
full: `archive/refactor-pixi/2026-07-02-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F01 | Critical | queries.ts:886 | useTrainUnitsMutation: hardcoded timePerUnitMs=60_000 in optimistic update |
| F02 | Critical | queries.ts:1538 | useUpgradeBuildingMutation: hardcoded endTime 60_000 in optimistic update |
| C-01 | High | ArmyScreen.tsx:681L | 11 hooks, 7 useState, mixed onboarding/garrison/recruitment, NO test |
| C-03 | High | VillageView.tsx:573L | 20 hooks, 9 useState, 7 boolean flags, 40+ props drilled, NO test |
| P-01 | High | WorldMapScene.ts:1019L | Scene monolith: 11+ responsibilities, split into 7 managers feasible |
| WS-01 | High | ws-bindings.ts:827 | applyVillageConquered god function (51 lines, 5 responsibilities) |
| S-01 | High | resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache (design intentional for interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3/4 major screens have ZERO tests |
| Q-09 | Med | queries.ts:~2035L | Monolith 50+ hooks (addressed by PR #233, pending merge) |
| STR-02 | Med | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable, not reset on logout |
| S-03 | Med | ui.ts:131L | Toasts + modals + defeats mixed (functional but unmaintainable) |
| TEST-02 | Med | MapMarkerSheet.tsx | New component without tests |

## CLOSED this run

| ID | Fix |
|----|-----|
| WS-03 | TEST: 5 untested handlers now covered (applyAttackIncoming, applyRankingsChanged, applyRankingsCycleClosed, applyVillageRemoved, applyIntelUpdated) |
| SESS-01 | FIX: mapMarkersStore.clear() added + included in resetGameSessionStores() — markers no longer leak across sessions |
| S-02 | VERIFIED RESOLVED: all store consumers use granular selectors, no full-state subscriptions |
| C-04 | RECLASSIFIED LBAF: SpecializedBuildingDetailModal is purely presentational, well-structured despite 636L |
| P-02 | VERIFIED RESOLVED: viewport.removeAllListeners() in exit() covers pointertap |
| P-03 | VERIFIED RESOLVED: viewport.removeAllListeners() in exit() covers background tap |
| WS-02 | RECLASSIFIED LOW: worldId null in invalidate helpers is harmless (invalidates non-matching key), auth flow guarantees worldId exists |

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
