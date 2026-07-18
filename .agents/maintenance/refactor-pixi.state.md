# refactor-pixi — state (rewritten each run)

last: 2026-07-18 | theme extraction-ws-invalidation | branch maint/refactor-pixi/extraction-ws-invalidation
full: `archive/refactor-pixi/2026-07-18-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-03 | Crit | VillageView.tsx:587L | 68 hooks, 15 responsibilities — worst god component |
| C-04 | Crit | WorldMapScreen.tsx:523L | 59 hooks, 10 responsibilities |
| C-01 | High | ArmyScreen.tsx:688L | 40 hooks, 8 responsibilities |
| C-05 | High | GameHeader.tsx:446L | 39 hooks, duplicates VillageView logic |
| C-06 | High | AttackDetailModal.tsx:597L | 31 hooks, 5 responsibilities |
| P-01 | High | WorldMapScene.ts:1073L | Scene monolith, 13 responsibilities |
| S-01 | High | resources.ts, crowns.ts | Dual Zustand+TQ (design intentional, interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3 major screens ZERO tests |
| T-01 | High | VillageViewSections.tsx:515L | Zero tests |
| T-02 | High | WorldMapScreen.tsx:523L | Zero tests |
| GC-15 | High | UnitCard.tsx:450L | 18 hooks, 5 responsibilities |
| TD-01..03 | High | api/client.ts:176,201,227 | `as T` unvalidated API responses |
| TD-04 | High | AuthenticatedShell.tsx:119 | `as` status union without guard |
| C-11 | High | BuildingDetailModal.tsx:242L | 16 hooks, 4 mutations, 8 queries |
| T-03 | High | BuildingDetailModal.tsx | Zero tests for 16-hook controller |
| T-04 | High | BottomNavigationBar.tsx:330L | Zero tests, lock/unlock logic |
| D-NEW-11 | High | design-system LifecycleBar | Component duplicated wholesale (2 files) |
| TD-26 | High | BottomSheet.tsx:67 | useImperativeHandle exposes null as HTMLDivElement |
| TYPE-05 | Med | BuildingDto.type, ArmyUnitDto.type | 13 `as BuildingType`/`as UnitType` casts |
| D02 | Med | QueueBottomSheet.tsx:22 | formatTime duplicates formatRemaining |
| D24 | Med | api/queries/combat.ts:201 | useMarkReadMutation no onError (all 4 report types) |
| D-NEW-12 | Med | UnitCard.tsx:93 | computeArmyRecruitMax reimplemented |
| D-NEW-13 | Med | 3 files | toLocaleTimeString('fr-FR') inlined 3x |
| D-NEW-14 | Med | 3 design-system files | resource icon path map duplicated 3x |
| D-NEW-18 | Med | 2 building detail modals | Upgrade disabled-state derivation duplicated |
| NEW-04 | Med | PlayerProfileSheet + meta.ts | Village style colors duplicated |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| TYPE-06 | Med | api/client.ts:168,174 | `undefined as T` returns undefined |
| SA-01 | Med | AuthenticatedShell.tsx:82 | Crowns hydration uses Date.now() |
| C-07 | Med | Tooltip.tsx:476L | 19 hooks, positioning |
| C-08 | Med | Select.tsx:416L | 20 hooks, popup + keyboard nav |
| C-09 | Med | AuthenticatedShell.tsx:153L | 25 hooks, 7 sync responsibilities |
| C-10 | Med | ReportDetailModal.tsx:494L | 4 near-identical report-type sections |
| C-12 | Med | CaravanLaunchModal.tsx:359L | 13 hooks, mixed concerns |
| C-13 | Med | SelectedEntityPanel.tsx:332L | 12 hooks, 8 data queries |
| STR-03 | Med | ws-bindings.ts:1337L | 65 functions monolith (well-tested) |
| P-04 | Med | useTickingNow.ts | No pause/disable; 12 call sites |
| T-05 | Med | DefensiveFriendsSheet.tsx:320L | Zero tests, 3 mutations |
| TD-27..30 | Med | 4 files | Unvalidated PixiJS/Select/BonusSection casts |
| D-NEW-05 | Med | scoutReportView + intelView | formatRelativeTime vs formatIntelAge |
| D-NEW-06 | Med | kingdomActivitiesVM + SectionHelpers | computeProgress duplicated |
| DRY-02 | Med | design-system files | crowns icon path intentionally different |
| TD-05..06 | Med | api/ws.ts:60,62 | `as never` socket.io workaround |
| TD-07..14 | Med | 5 files | `as` callback/keyof casts without validation |
| TD-25 | Med | api/queries/ (12 sites) | `[] as T[]` pattern |

## CLOSED this run

| ID | Fix |
|----|-----|
| WS-01 | FIX: extraction.started now invalidates openExpeditions |
| WS-02 | FIX: extraction.returned now invalidates openExpeditions |
| WS-03 | FIX: extraction.attacked (interrupted) now invalidates openExpeditions + retentionSummary |
| WS-04 | FIX: extraction.returned now invalidates retentionSummary |
| QK-01 | RESOLVED: stale-forever scenario eliminated by WS-01..03 |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| D-NEW-01 | FIX: 4 duration formatters → shared `formatDuration(ms, opts?)` |
| D-NEW-08 | FIX: 3 strategy-label maps → shared `STRATEGY_LABELS` |
| WS-23 | FIX: applyVillageAttacked missing incomingAttacks invalidation |
| TYPE-03 | FIX: scoutReportStrategyLabel removes `as VillageStrategyType` cast |
| LOCALE-01 | FIX: 24 `.toLocaleString()` → NUMBER_FMT.format() |
| TYPE-04 | FIX: SegmentedControl generic, 6 callers lose `as` casts |
| D07 | FIX: inline canAfford → shared canAffordNextBuildingLevel |
| MUT-01 | RESOLVED: onError exists on all 6 combat mutations |
| D05 | FIX+BUG: 4 compact formatters → shared formatCompact |
| DRY-02 (prod) | FIX: 7 files → RESOURCE_CONFIG |
| DRY-03 | FIX: 14 Intl.NumberFormat → NUMBER_FMT/INTEGER_FMT |
| DRY-04 | FIX+BUG: tierFromPower x3 → shared villageTierFromPower |
| NEW-01..03,06/07 | FIX: formatter aliases consolidated |
| WS-03..22 | FIX: WS invalidation gaps |
| D13..D30 | FIX: 9 silent mutations → pushToast onError |
| DRY-01/CLEAN-01/SESS-01 | FIX: SessionCtx + WorldMapScreen cleanup |
| F01/F02 | FIX: optimistic entry replacement |
| Q-05..13 | DRY/PERF: query split + invalidation helpers |
| S-02 | VERIFIED: granular selectors |
| TYPE-02 | RESOLVED: scoutReportView refactored |
