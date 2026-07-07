# refactor-pixi — state (rewritten each run)

last: 2026-07-07 | theme number-formatter-consolidation | branch claude/focused-galileo-d11ic9
full: `archive/refactor-pixi/2026-07-07-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-03 | Crit | VillageView.tsx:600L | 67 hooks, 11 useState — worst god component |
| C-04 | Crit | WorldMapScreen.tsx:515L | 57 hooks, 10 useState, 7 useEffect |
| C-01 | High | ArmyScreen.tsx:688L | 40 hooks, 8 useState |
| C-05 | High | GameHeader.tsx:470L | 38 hooks, duplicates VillageView logic |
| C-06 | High | AttackDetailModal.tsx:558L | 30 hooks, 8 useMemo from 6 queries |
| P-01 | High | WorldMapScene.ts:1073L | Scene monolith, 7+ responsibilities |
| S-01 | High | resources.ts, crowns.ts | Dual Zustand+TQ (design intentional, interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3 major screens ZERO tests |
| T-01 | High | VillageViewSections.tsx:531L | Zero tests |
| T-02 | High | WorldMapScreen.tsx:515L | Zero tests |
| TYPE-04 | Med | SegmentedControl.tsx:20 | onChange string→void; 8 callers cast to union |
| TYPE-05 | Med | BuildingDto.type, ArmyUnitDto.type | ~13 `as BuildingType`/`as UnitType` casts |
| DRY-02 | Med | scoutReportView, CaravanLaunchModal, naturalTraitInfo, combatReportView | Triplicated RESOURCE_LABELS + RESOURCE_ICONS |
| DRY-04 | Med | PowerBottomSheet:20, MultiVillageBottomSheet:163 | Divergent tierFromPower thresholds |
| D02 | Med | QueueBottomSheet.tsx:22 | formatTime duplicates formatRemaining |
| D04 | Med | kingdomActivitiesViewModel.ts:188 | computeProgress duplicates constructionProgress |
| D05 | Med | resourceConfig.ts:187-213 | 3 overlapping compact formatters + meta.ts:28 4th |
| D07 | Med | BuildingCard.tsx:81 | Inline canAfford reimplements canAffordNextBuildingLevel |
| D24 | Med | api/queries/combat.ts:201 | useMarkReadMutation no onError |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| TYPE-06 | Med | api/client.ts:168,174 | `undefined as T` returns undefined to typed callers |
| TYPE-08 | Med | pixi/assets/loader.ts:16 | Assets.loadBundle cast without validation |
| SA-01 | Med | AuthenticatedShell.tsx:82 | Crowns hydration uses Date.now() instead of server ts |
| C-07 | Med | Tooltip.tsx:476L | 21 hooks, 7 effects (positioning) |
| C-08 | Med | Select.tsx:416L | 23 hooks, popup positioning + keyboard nav |
| C-09 | Med | AuthenticatedShell.tsx:153L | 25 hooks, 8 useEffect sync chains |
| P-04 | Med | useTickingNow.ts | No pause/disable; 12 call sites tick unconditionally |
| WS-14 | Low | ws-bindings.ts:474-489 | scout.returned missing population invalidation |
| WS-15 | Low | ws-bindings.ts:399-418 | battle.returned missing population invalidation |
| WS-16 | Low | ws-bindings.ts:523-541 | expedition.returned missing population invalidation |
| TEST-02 | Med | MapMarkerSheet.tsx | Component without tests (model tested) |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | Triple useTickingNow ticking simultaneously |
| STR-02 | Low | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |
| S-03 | Low | ui.ts:132L | Toasts + modals + defeats mixed |
| TYPE-03 | Low | scoutReportView.ts:132 | strategy cast (mitigated by fallback) |

## CLOSED this run

| ID | Fix |
|----|-----|
| DRY-03 | FIX: 14 independent `Intl.NumberFormat('fr-FR')` → shared `NUMBER_FMT`/`INTEGER_FMT` in lib/formatters.ts |
| WS-13 | FIX: caravan.recalled now invalidates activeExpeditions(villageId) + test assertion |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| WS-10..12 | FIX: extraction WS invalidation (run 2026-07-06) |
| D30 | FIX: UnitCard.tsx cancel training → pushToast onError |
| D13..D20 | FIX: 8 silent mutations → pushToast onError (run 2026-07-05) |
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
