# refactor-pixi — state (rewritten each run)

last: 2026-07-05 | theme silent-mutation-error-feedback | branch claude/focused-galileo-bwxuw2
full: `archive/refactor-pixi/2026-07-05-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-01 | High | ArmyScreen.tsx:681L | 11 hooks, 7 useState, mixed onboarding/garrison/recruitment, NO test |
| C-03 | High | VillageView.tsx:573L | 20 hooks, 9 useState, 7 boolean flags, 40+ props drilled, NO test |
| P-01 | High | WorldMapScene.ts:1019L | Scene monolith: 11+ responsibilities, split into 7 managers feasible |
| S-01 | High | resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache (design intentional for interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3/4 major screens have ZERO tests |
| D02 | Med | QueueBottomSheet.tsx:20 | Local formatTime duplicates formatRemaining/formatTravelTime |
| D04 | Med | kingdomActivitiesViewModel.ts:186 | computeProgress duplicates constructionProgress.ts |
| D05 | Med | resourceConfig.ts:187-209 | Three overlapping number formatters in same file |
| D07 | Med | BuildingCard.tsx:76 | Inline canAfford re-implements dead canAffordNextBuildingLevel |
| D09 | Med | api/queries/army.ts:95 | Hardcoded 60s optimistic training placeholder |
| D24 | Med | api/queries/combat.ts:201 | useMarkReadMutation no onError at def-level |
| D28-29 | Med | resourceConfig.ts:38, VillageViewSectionHelpers.ts:41 | Dead exports (RESOURCE_CONFIG, canAffordNextBuildingLevel) |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| STR-02 | Med | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |
| S-03 | Med | ui.ts:131L | Toasts + modals + defeats mixed (functional but unmaintainable) |
| TEST-02 | Med | MapMarkerSheet.tsx | Component without tests |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | useTickingNow(1_000) ticks even when no shield |
| TYPE-02 | Low | scoutReportView.ts:64 | toLowerCase() as keyof cast |
| TYPE-03 | Low | scoutReportView.ts:174 | strategy as VillageStrategyType cast |

## CLOSED this run

| ID | Fix |
|----|-----|
| D13 | FIX: BuildingCard cancel construction → pushToast onError |
| D14 | FIX: QueueBottomSheet cancel construction → pushToast onError |
| D15 | FIX: VillageView cancelConstruction → pushToast onError |
| D16 | FIX: GameHeader claimDailyCard → pushToast onError |
| D16b | FIX: VillageView claimDailyCard → pushToast onError |
| D17 | FIX: ArmyScreen recallReinforcement → pushToast onError |
| D18 | FIX: KingdomActivitiesBottomSheet recallExpedition → pushToast onError |
| D20 | FIX: MapMarkerSheet upsert + delete → pushToast onError |
| ERR-01 | RESOLVED by D20 |
| ERR-02 | RESOLVED by D20 |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| DRY-01 | FIX: extracted SessionCtx + resolveSessionCtx() |
| F01 | FIX: onSuccess in useTrainUnitsMutation replaces optimistic entry |
| F02 | FIX: onSuccess in useUpgradeBuildingMutation replaces optimistic queue entry |
| DEAD-01 | CLEANUP: removed unused useUpdateMapMarkerMutation |
| CLEAN-01 | FIX: WorldMapScreen cleanup uses useMapMarkersStore.clear() |
| Q-09 | RESOLVED: queries.ts split into 12 domain modules |
| WS-03 | TEST: 5 untested WS handlers now covered |
| SESS-01 | FIX: mapMarkersStore.clear() in resetGameSessionStores() |
| S-02 | VERIFIED: all store consumers use granular selectors |
| WS-06..09 | BUG FIX: caravan/garrison/conquest invalidation + tests |
| Q-10..13 | DRY/PERF: invalidation helpers extracted |
| WS-04..05 | BUG FIX: applyNobleKilled missing invalidations + test |
| Q-05..07 | DRY/BUG FIX: combat dispatch + troop movement helpers + recall fix |
