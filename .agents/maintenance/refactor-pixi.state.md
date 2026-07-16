# refactor-pixi — state (rewritten each run)

last: 2026-07-16 | theme locale-number-format | branch claude/focused-galileo-ud9lu3
full: `archive/refactor-pixi/2026-07-16-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-03 | Crit | VillageView.tsx:587L | 67 hooks, 11 useState — worst god component |
| C-04 | Crit | WorldMapScreen.tsx:523L | 57 hooks, 10 useState |
| DRY-02 | Crit→Med | 6 design-system files | Remaining: crowns icon path intentionally different |
| C-01 | High | ArmyScreen.tsx:688L | 40 hooks, 8 useState |
| C-05 | High | GameHeader.tsx:470L | 38 hooks, duplicates VillageView logic |
| C-06 | High | AttackDetailModal.tsx:558L | 30 hooks, 8 useMemo from 6 queries |
| P-01 | High | WorldMapScene.ts:1073L | Scene monolith, 7+ responsibilities |
| S-01 | High | resources.ts, crowns.ts | Dual Zustand+TQ (design intentional, interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3 major screens ZERO tests |
| T-01 | High | VillageViewSections.tsx:531L | Zero tests |
| T-02 | High | WorldMapScreen.tsx:523L | Zero tests |
| TYPE-05 | Med | BuildingDto.type, ArmyUnitDto.type | 13 `as BuildingType`/`as UnitType` casts (8+5) |
| D02 | Med | QueueBottomSheet.tsx:22 | formatTime duplicates formatRemaining |
| D24 | Med | api/queries/combat.ts:201 | useMarkReadMutation no onError |
| NEW-04 | Med | PlayerProfileSheet + meta.ts | Village style colors duplicated |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| TYPE-06 | Med | api/client.ts:168,174 | `undefined as T` returns undefined to typed callers |
| TYPE-08 | Med | pixi/assets/loader.ts:16 | Assets.loadBundle cast without validation |
| SA-01 | Med | AuthenticatedShell.tsx:82 | Crowns hydration uses Date.now() instead of server ts |
| C-07 | Med | Tooltip.tsx:476L | 21 hooks, 7 effects (positioning) |
| C-08 | Med | Select.tsx:416L | 23 hooks, popup positioning + keyboard nav |
| C-09 | Med | AuthenticatedShell.tsx:153L | 25 hooks, 8 useEffect sync chains |
| C-10 | Med | ReportDetailModal.tsx:496L | 4 near-identical report-type sections |
| P-04 | Med | useTickingNow.ts | No pause/disable; 12 call sites tick unconditionally |
| TEST-02 | Med | MapMarkerSheet.tsx | Component without tests (model tested) |
| DATE-01 | Low | 3 files | 3 inline `new Intl.DateTimeFormat('fr-FR')` |
| NEW-05 | Low | multiVillageSheet.ts:170 | 3rd time-duration formatter |
| D04 | Low | kingdomActivitiesViewModel.ts:188 | computeProgress overlaps constructionProgress core |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | Triple useTickingNow ticking simultaneously |
| STR-02 | Low | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |
| S-03 | Low | ui.ts:132L | Toasts + modals + defeats mixed |
| TYPE-03 | Low | scoutReportView.ts:132 | strategy cast (mitigated by fallback) |

## CLOSED this run

| ID | Fix |
|----|-----|
| LOCALE-01 | FIX: 24 inline `.toLocaleString()` across 12 files → shared NUMBER_FMT.format() |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| TYPE-04 | FIX: SegmentedControl generic `<T extends string>`, 6 callers lose `as` casts |
| D07 | FIX: BuildingCard inline canAfford → shared canAffordNextBuildingLevel |
| MUT-01 | RESOLVED: call-site onError exists on all 6 combat mutations (toast/setError) |
| D05 | FIX+BUG: 4 compact formatters → shared `formatCompact(n, opts?)` |
| DRY-02 (prod) | FIX: 7 production files → RESOURCE_CONFIG |
| DRY-03 | FIX: 14 `Intl.NumberFormat('fr-FR')` → shared NUMBER_FMT/INTEGER_FMT |
| DRY-04 | FIX+BUG: tierFromPower x3 → shared villageTierFromPower |
| NEW-01 | FIX: DATE_FORMATTER x3 → REPORT_DATE_FMT |
| NEW-02 | FIX: NUMBER_FORMATTER alias x7 → NUMBER_FMT direct |
| NEW-03 | FIX: fr()/formatCount() x3 → formatIntFr/NUMBER_FMT |
| NEW-06/07 | FIX: worldsViewModel + TroopDetailModal → NUMBER_FMT |
| WS-03..22 | FIX: WS invalidation gaps |
| D13..D30 | FIX: 9 silent mutations → pushToast onError |
| DRY-01 | FIX: SessionCtx extracted |
| F01/F02 | FIX: optimistic entry replacement |
| DEAD-01 | CLEANUP: unused useUpdateMapMarkerMutation |
| CLEAN-01/SESS-01 | FIX: WorldMapScreen/store cleanup |
| Q-05..13 | DRY/PERF: query split + combat dispatch + invalidation helpers |
| S-02 | VERIFIED: granular selectors |
| TYPE-02 | RESOLVED: scoutReportView refactored |
