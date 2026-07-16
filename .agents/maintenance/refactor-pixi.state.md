# refactor-pixi — state (rewritten each run)

last: 2026-07-15 | theme formatter-consolidation | branch claude/focused-galileo-idxelx
full: `archive/refactor-pixi/2026-07-15-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| EB-01 | Crit | App.tsx:105-160 | No React ErrorBoundary — render error = white screen |
| C-03 | Crit | VillageView.tsx:587L | 51 hooks, 10 useState — worst god component |
| C-04 | Crit | WorldMapScreen.tsx:523L | 49 hooks, 9 useState |
| SA-02 | High | ws-bindings.ts:326,433,651 | departAt: Date.now() fabricated client-side |
| SA-03 | High | ws-bindings.ts:564,599 | Reinforcement timestamps fallback → zero-duration arc |
| TQ-01 | High | query-client.ts:4-20 | No global MutationCache.onError |
| EB-02 | High | GameShellLayout.tsx:49-50 | Outlet without error boundary |
| C-01 | High | ArmyScreen.tsx:688L | 29 hooks, 7 useState |
| C-05 | High | GameHeader.tsx:461L | 31 hooks, duplicates VillageView logic |
| C-06 | High | AttackDetailModal.tsx:558L | 22 hooks, 7 useMemo from 6 queries |
| P-01 | High | WorldMapScene.ts:1073L | Scene monolith, 7+ responsibilities |
| S-01 | High | resources.ts, crowns.ts | Dual Zustand+TQ (design intentional, interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3 major screens ZERO tests |
| T-01 | High | VillageViewSections.tsx:531L | Zero tests |
| T-02 | High | WorldMapScreen.tsx:523L | Zero tests |
| TYPE-05 | Med | BuildingDto.type, ArmyUnitDto.type | 13 `as BuildingType`/`as UnitType` casts (8+5) |
| DU-03 | Med | 6 files | 6 near-duplicate duration formatters |
| LOCALE-01 | Med | 15 files | 22 inline `.toLocaleString('fr-FR')` not using NUMBER_FMT |
| LOCALE-04 | Med | 3 files | toLocaleTimeString/toLocaleDateString inline 'fr-FR' |
| TQ-02 | Med | api/queries/ | Inconsistent disabled-query guard (reject vs throw) |
| TQ-03 | Med | SelectedEntityPanel.tsx | 7+ queries, no error handling |
| TQ-04 | Med | AuthenticatedShell.tsx | Seeding ignores query failures |
| D02 | Med | QueueBottomSheet.tsx:22 | formatTime duplicates formatRemaining |
| D24 | Med | api/queries/combat.ts:201 | useMarkReadMutation no onError |
| NEW-04 | Med | PlayerProfileSheet + meta.ts | Village style colors duplicated |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| TYPE-06 | Med | api/client.ts:168,174 | `undefined as T` returns undefined to typed callers |
| TYPE-08 | Med | pixi/assets/loader.ts:16 | Assets.loadBundle cast without validation |
| SA-01 | Med | AuthenticatedShell.tsx:82 | Crowns hydration uses Date.now() |
| SA-04 | Med | ws-bindings.ts:368,459 | arrivalAt: Date.now() overwrites real arrival |
| SA-05 | Med | ws-bindings.ts:508,688 + combat.ts:429 | Recall instant uses Date.now() |
| C-07 | Med | Tooltip.tsx:477L | 16 hooks, 6 effects (positioning) |
| C-08 | Med | Select.tsx:416L | 23 hooks, popup positioning + keyboard nav |
| C-09 | Med | AuthenticatedShell.tsx:153L | 25 hooks, 8 useEffect sync chains |
| C-10 | Med | ReportDetailModal.tsx:497L | 4 near-identical report-type sections |
| P-04 | Med | useTickingNow.ts | No pause/disable; 12 call sites tick unconditionally |
| TEST-02 | Med | MapMarkerSheet.tsx | Component without tests (model tested) |
| DRY-02 | Med | 6 design-system files | Crowns icon path intentionally different |
| DATE-01 | Low | 3 files | 3 inline `new Intl.DateTimeFormat('fr-FR')` |
| LOCALE-05 | Low | ws-bindings.ts | 3x toLocaleTimeString() no locale |
| NEW-05 | Low | multiVillageSheet.ts:170 | 3rd time-duration formatter |
| D04 | Low | kingdomActivitiesViewModel.ts:188 | computeProgress overlaps constructionProgress |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | Triple useTickingNow simultaneously |
| STR-02 | Low | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |
| S-03 | Low | ui.ts:132L | Toasts + modals + defeats mixed |
| TYPE-03 | Low | scoutReportView.ts:132 | strategy cast (mitigated by fallback) |

## CLOSED this run

| ID | Fix |
|----|-----|
| DU-01 | FIX: NUMBER_FORMATTER alias removed in 8 files (20 usages → NUMBER_FMT direct) |
| DU-02 | FIX: DATE_FORMATTER alias removed in 3 files (3 usages → REPORT_DATE_FMT direct) |
| LOCALE-03 | FIX: 8 no-locale .toLocaleString() → INTEGER_FMT/NUMBER_FMT in 5 files |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| TYPE-04 | FIX: SegmentedControl generic `<T extends string>`, 6 callers lose `as` casts |
| D07 | FIX: BuildingCard inline canAfford → shared canAffordNextBuildingLevel |
| MUT-01 | RESOLVED: call-site onError exists on all 6 combat mutations |
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
