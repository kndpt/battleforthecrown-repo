# refactor-pixi — state (rewritten each run)

last: 2026-07-03 | theme optimistic-update-correctness | branch claude/focused-galileo-6j4bzg
full: `archive/refactor-pixi/2026-07-03-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-01 | High | ArmyScreen.tsx:681L | 11 hooks, 7 useState, mixed onboarding/garrison/recruitment, NO test |
| C-03 | High | VillageView.tsx:573L | 20 hooks, 9 useState, 7 boolean flags, 40+ props drilled, NO test |
| P-01 | High | WorldMapScene.ts:1019L | Scene monolith: 11+ responsibilities, split into 7 managers feasible |
| WS-01 | High | ws-bindings.ts:827 | applyVillageConquered god function (51 lines, 5 responsibilities) |
| S-01 | High | resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache (design intentional for interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3/4 major screens have ZERO tests |
| ERR-01 | Med | MapMarkerSheet.tsx:50 | upsert mutation: no user-facing error feedback on failure |
| ERR-02 | Med | MapMarkerSheet.tsx:57 | delete mutation: no user-facing error feedback on failure |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast on string prop |
| TEST-02 | Med | MapMarkerSheet.tsx | New component without tests |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | useTickingNow(1_000) ticks even when no shield |
| TYPE-02 | Low | scoutReportView.ts:64 | toLowerCase() as keyof cast |
| TYPE-03 | Low | scoutReportView.ts:174 | strategy as VillageStrategyType cast |

## CLOSED this run

| ID | Fix |
|----|-----|
| F01 | FIX: onSuccess in useTrainUnitsMutation replaces optimistic entry with server-returned ArmyTrainingDto (real timePerUnitMs + nextUnitEta) |
| F02 | FIX: onSuccess in useUpgradeBuildingMutation replaces optimistic queue entry with server-returned UpgradeBuildingResponse (real startTime + endTime + level) |
| DEAD-01 | CLEANUP: removed unused useUpdateMapMarkerMutation (45L dead code) + UpdateMapMarkerBody import |
| CLEAN-01 | FIX: WorldMapScreen cleanup uses useMapMarkersStore.clear() instead of individual setters |
| Q-09 | RESOLVED: queries.ts monolith split into 12 domain modules by PR #233 |
| STR-02 | RECLASSIFIED LOW: toastSeq/victoryModalSeq cosmetic, never compared cross-session |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| WS-03 | TEST: 5 untested handlers now covered (applyAttackIncoming, applyRankingsChanged, applyRankingsCycleClosed, applyVillageRemoved, applyIntelUpdated) |
| SESS-01 | FIX: mapMarkersStore.clear() added + included in resetGameSessionStores() |
| S-02 | VERIFIED RESOLVED: all store consumers use granular selectors |
| C-04 | RECLASSIFIED LBAF: SpecializedBuildingDetailModal purely presentational |
| P-02 | VERIFIED RESOLVED: viewport.removeAllListeners() in exit() covers pointertap |
| P-03 | VERIFIED RESOLVED: viewport.removeAllListeners() in exit() covers background tap |
| WS-02 | RECLASSIFIED LOW: worldId null in invalidate helpers is harmless |
| Q-01 | Zod schemas for all 4 report types in shared |
| SCN-01 | VERIFIED RESOLVED: ticker handler properly removed before exit() |
| WS-06 | BUG FIX: applyCaravanArrived missing invalidatePowerQueries |
| WS-07 | BUG FIX: applyGarrisonAdded missing invalidatePowerQueries |
| WS-08 | BUG FIX: applyVillageConquered missing garrison cache invalidation |
| Q-13 | PERF: rankingsSummaryQuery refetchInterval 30s→120s |
| WS-09 | TEST: extended tests for caravan/garrison/conquest invalidation |
| Q-10 | DRY: extracted invalidateVillageEconomy (10 sites) |
| Q-11 | DRY: extracted invalidateArmyMutationQueries (3 mutations) |
| Q-12 | DRY: extracted invalidateBuildingMutationQueries (2 mutations) |
| WS-04 | BUG FIX: applyNobleKilled missing invalidatePowerQueries + invalidateCombatReports |
| WS-05 | TEST: extended applyNobleKilled test |
| Q-05 | DRY: extracted invalidateCombatDispatchQueries |
| Q-06 | DRY: extracted invalidateTroopMovementQueries |
| Q-07 | BUG FIX: useRecallReinforcementMutation missing population + villagePower + kingdomPower |
