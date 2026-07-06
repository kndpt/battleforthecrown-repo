# refactor-pixi — state (rewritten each run)

last: 2026-07-06 | theme extraction-ws-invalidation | branch claude/focused-galileo-i0sm4j
full: `archive/refactor-pixi/2026-07-06-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-01 | High | ArmyScreen.tsx:688L | 29 hooks, 7 useState, grew +7L |
| C-03 | High | VillageView.tsx:600L | 51 hooks, 10 useState, grew +27L — critical god component |
| P-01 | High | WorldMapScene.ts:1073L | Scene monolith grew +54L, 7 responsibilities |
| C-04 | High | WorldMapScreen.tsx:515L | 48 hooks, 9 useState, 6 useEffect — newly flagged |
| C-05 | High | GameHeader.tsx:470L | 35 hooks, duplicates VillageView profile/village-selector logic |
| S-01 | High | resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache (design intentional) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3/4 major screens have ZERO tests |
| TYPE-04 | Med | SegmentedControl.tsx:20 | onChange typed as string→void; 8 callers cast back to union |
| TYPE-05 | Med | BuildingDto.type, ArmyUnitDto.type | ~20 `as BuildingType`/`as UnitType` casts across codebase |
| DRY-02 | Med | scoutReportView, CaravanLaunchModal, naturalTraitInfo, combatReportView | Triplicated RESOURCE_LABELS + RESOURCE_ICONS maps |
| DRY-03 | Med | 8+ files | Proliferation of independent `Intl.NumberFormat('fr-FR')` instances |
| DRY-04 | Med | PowerBottomSheet:20, MultiVillageBottomSheet:163 | Duplicate tierFromPower with divergent tier-6 threshold |
| D02 | Med | QueueBottomSheet.tsx:22 | Local formatTime duplicates formatRemaining/formatTravelTime |
| D04 | Med | kingdomActivitiesViewModel.ts:188 | computeProgress duplicates constructionProgress.ts |
| D05 | Med | resourceConfig.ts:187-213 | Three overlapping number formatters in same file |
| D07 | Med | BuildingCard.tsx:81 | Inline canAfford re-implements canAffordNextBuildingLevel |
| D24 | Med | api/queries/combat.ts:201 | useMarkReadMutation no onError at def-level |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| TYPE-06 | Med | api/client.ts:168,174 | `undefined as T` silently returns undefined to typed callers |
| STR-02 | Low | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |
| S-03 | Low | ui.ts:131L | Toasts + modals + defeats mixed (functional, 131L) |
| TEST-02 | Med | MapMarkerSheet.tsx | Component without tests (model tested) |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | useTickingNow(1_000) ticks even when no shield |
| TYPE-03 | Low | scoutReportView.ts:130 | strategy as VillageStrategyType cast (mitigated by fallback) |

## CLOSED this run

| ID | Fix |
|----|-----|
| WS-10 | FIX: extraction.started was no-op → now invalidates worldEntities + activeExpeditions + army + population |
| WS-11 | FIX: extraction.returned only invalidated worldEntities → now also resources + activeExpeditions + army + population |
| WS-12 | FIX: extraction.attacked only invalidated worldEntities → now also resources + army + population when interrupted |
| D30 | FIX: UnitCard.tsx cancel training mutation → pushToast onError |
| WS-10..12-TEST | TEST: 4 new test cases covering all 3 extraction WS handlers |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| D13..D20 | FIX: 8 silent mutations → pushToast onError (run 2026-07-05) |
| DRY-01 | FIX: extracted SessionCtx + resolveSessionCtx() |
| F01 | FIX: onSuccess in useTrainUnitsMutation replaces optimistic entry |
| F02 | FIX: onSuccess in useUpgradeBuildingMutation replaces optimistic queue entry |
| DEAD-01 | CLEANUP: removed unused useUpdateMapMarkerMutation |
| CLEAN-01 | FIX: WorldMapScreen cleanup uses useMapMarkersStore.clear() |
| Q-09 | RESOLVED: queries.ts split into 12 domain modules |
| WS-03..09 | BUG FIX: caravan/garrison/conquest/noble invalidation + tests |
| Q-05..13 | DRY/PERF: combat dispatch + troop movement + invalidation helpers |
| SESS-01 | FIX: mapMarkersStore.clear() in resetGameSessionStores() |
| S-02 | VERIFIED: all store consumers use granular selectors |
| D28-29 | STALE: RESOURCE_CONFIG + canAffordNextBuildingLevel are now used (ResourceDisplay, VillageViewSections) |
| TYPE-02 | RESOLVED: scoutReportView refactored, pattern removed |
| D09 | RESOLVED: onSuccess in useTrainUnitsMutation replaced optimistic entry (F01) |
