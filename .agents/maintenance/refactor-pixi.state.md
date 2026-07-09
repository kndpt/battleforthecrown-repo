# refactor-pixi — state (rewritten each run)

last: 2026-07-09 | theme DRY-02-resource-constants | branch claude/focused-galileo-3gly37
full: `archive/refactor-pixi/2026-07-09-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-03 | Crit | VillageView.tsx:587L | 67 hooks, 11 useState — worst god component |
| C-04 | Crit | WorldMapScreen.tsx:523L | 57 hooks, 10 useState |
| C-01 | High | ArmyScreen.tsx:688L | 40 hooks, 8 useState |
| C-05 | High | GameHeader.tsx:470L | 38 hooks, duplicates VillageView logic |
| C-06 | High | AttackDetailModal.tsx:558L | 30 hooks, 8 useMemo from 6 queries |
| P-01 | High | WorldMapScene.ts:1073L | Scene monolith, 7+ responsibilities |
| S-01 | High | resources.ts, crowns.ts | Dual Zustand+TQ (design intentional, interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3 major screens ZERO tests |
| T-01 | High | VillageViewSections.tsx:531L | Zero tests |
| T-02 | High | WorldMapScreen.tsx:515L | Zero tests |
| DRY-04 | High | 2 files | tierFromPower x2 divergent thresholds (tier 5 vs 6) |
| D05 | High | resourceConfig.ts + meta.ts | 3+1 overlapping compact number formatters |
| MUT-01 | High | combat.ts, army.ts, worlds.ts | 20/25 useMutation hooks missing onError |
| TYPE-04 | Med | SegmentedControl.tsx:20 | onChange string→void; 8 callers cast to union |
| TYPE-05 | Med | BuildingDto.type, ArmyUnitDto.type | ~13 `as BuildingType`/`as UnitType` casts |
| TYPE-06 | Med | api/client.ts:168,174 | `undefined as T` returns undefined to typed callers |
| D02 | Med | QueueBottomSheet.tsx:22 | formatTime duplicates formatRemaining |
| D07 | Med | BuildingCard.tsx:81 | Inline canAfford reimplements canAffordNextBuildingLevel |
| NEW-01 | Med | 3 combat report views | DATE_FORMATTER triplicated |
| NEW-02 | Med | 5 files | time-duration formatters x5 near-duplicates |
| NEW-04 | Med | PlayerProfileSheet + meta.ts | Village style colors duplicated |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| TYPE-08 | Med | pixi/assets/loader.ts:16 | Assets.loadBundle cast without validation |
| SA-01 | Med | AuthenticatedShell.tsx:82 | Crowns hydration uses Date.now() instead of server ts |
| C-07 | Med | Tooltip.tsx:476L | 21 hooks, 7 effects (positioning) |
| C-08 | Med | Select.tsx:416L | 23 hooks, popup positioning + keyboard nav |
| C-09 | Med | AuthenticatedShell.tsx:153L | 25 hooks, 8 useEffect sync chains |
| P-04 | Med | useTickingNow.ts | No pause/disable; 12 call sites tick unconditionally |
| TEST-02 | Med | MapMarkerSheet.tsx | Component without tests (model tested) |
| D04 | Low | kingdomActivitiesViewModel.ts:188 | computeProgress overlaps constructionProgress core |
| NEW-03 | Low | 3 design-system files | fr()/formatCount() one-liner x3 |
| NEW-05 | Low | multiVillageSheet.ts:170 | 3rd time-duration formatter |
| NEW-06 | Low | worldsViewModel.ts:155 | Local NumberFormat duplicates NUMBER_FMT |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | Triple useTickingNow ticking simultaneously |
| STR-02 | Low | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |
| S-03 | Low | ui.ts:132L | Toasts + modals + defeats mixed |
| TYPE-03 | Low | scoutReportView.ts:132 | strategy cast (mitigated by fallback) |

## CLOSED this run

| ID | Fix |
|----|-----|
| DRY-02 | FIX: 10 production files → 6 canonical exports in resourceConfig.ts (RESOURCE_ICON_PATHS, RESOURCE_DISPLAY_LABELS, RESOURCE_META, RESOURCE_BAR_FILL, PRIMARY_RESOURCE_KEYS, PrimaryResourceKey) |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| WS-14..22 | FIX: 9 WS invalidation gaps (population + activeExpeditions) |
| DRY-03 | FIX: 14 independent Intl.NumberFormat → shared NUMBER_FMT/INTEGER_FMT |
| WS-13 | FIX: caravan.recalled invalidation |
| WS-10..12 | FIX: extraction WS invalidation |
| D30 | FIX: UnitCard.tsx cancel training → pushToast onError |
| D13..D20 | FIX: 8 silent mutations → pushToast onError |
| DRY-01 | FIX: extracted SessionCtx + resolveSessionCtx() |
| F01/F02 | FIX: optimistic entry replacement in train/upgrade mutations |
| DEAD-01 | CLEANUP: removed unused useUpdateMapMarkerMutation |
| CLEAN-01 | FIX: WorldMapScreen cleanup uses useMapMarkersStore.clear() |
| Q-09 | RESOLVED: queries.ts split into 12 domain modules |
| WS-03..09 | BUG FIX: caravan/garrison/conquest/noble invalidation + tests |
| Q-05..13 | DRY/PERF: combat dispatch + troop movement + invalidation helpers |
| SESS-01 | FIX: mapMarkersStore.clear() in resetGameSessionStores() |
| S-02 | VERIFIED: all store consumers use granular selectors |
| TYPE-02 | RESOLVED: scoutReportView refactored |
