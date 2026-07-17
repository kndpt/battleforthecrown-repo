# refactor-pixi — state (rewritten each run)

last: 2026-07-17 | theme duration-formatters-strategy-labels | branch claude/focused-galileo-pec76o
full: `archive/refactor-pixi/2026-07-17-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-03 | Crit | VillageView.tsx:587L | 68 hooks, 15 responsibilities — worst god component |
| C-04 | Crit | WorldMapScreen.tsx:523L | 59 hooks, 10 responsibilities |
| C-01 | High | ArmyScreen.tsx:688L | 40 hooks, 8 responsibilities |
| C-05 | High | GameHeader.tsx:446L | 39 hooks, duplicates VillageView logic |
| C-06 | High | AttackDetailModal.tsx:597L | 31 hooks, 5 responsibilities (+39L) |
| P-01 | High | WorldMapScene.ts:1073L | Scene monolith, 13 responsibilities |
| S-01 | High | resources.ts, crowns.ts | Dual Zustand+TQ (design intentional, interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3 major screens ZERO tests |
| T-01 | High | VillageViewSections.tsx:515L | Zero tests |
| T-02 | High | WorldMapScreen.tsx:523L | Zero tests |
| GC-15 | High | UnitCard.tsx:450L | 18 hooks, 5 responsibilities — NEW god component |
| TD-01..03 | High | api/client.ts:176,201,227 | `as T` unvalidated API responses |
| TD-04 | High | AuthenticatedShell.tsx:119 | `as` status union without guard |
| TYPE-05 | Med | BuildingDto.type, ArmyUnitDto.type | 13 `as BuildingType`/`as UnitType` casts |
| D02 | Med | QueueBottomSheet.tsx:22 | formatTime duplicates formatRemaining |
| D24 | Med | api/queries/combat.ts:201 | useMarkReadMutation no onError |
| NEW-04 | Med | PlayerProfileSheet + meta.ts | Village style colors duplicated |
| TYPE-01 | Med | VillageHero.tsx:271 | unvalidated label as VillageLabel cast |
| TYPE-06 | Med | api/client.ts:168,174 | `undefined as T` returns undefined to typed callers |
| SA-01 | Med | AuthenticatedShell.tsx:82 | Crowns hydration uses Date.now() |
| C-07 | Med | Tooltip.tsx:476L | 19 hooks, positioning |
| C-08 | Med | Select.tsx:416L | 20 hooks, popup + keyboard nav |
| C-09 | Med | AuthenticatedShell.tsx:153L | 25 hooks, 7 sync responsibilities |
| C-10 | Med | ReportDetailModal.tsx:494L | 4 near-identical report-type sections |
| P-04 | Med | useTickingNow.ts | No pause/disable; 12 call sites tick unconditionally |
| D-NEW-05 | Med | scoutReportView.ts:62 + intelView.ts:29 | formatRelativeTime vs formatIntelAge — same "il y a X" |
| D-NEW-06 | Med | kingdomActivitiesVM:251 + SectionHelpers:18 | computeProgress duplicated |
| DRY-02 | Med | design-system files | Remaining: crowns icon path intentionally different |
| TD-05..06 | Med | api/ws.ts:60,62 | `as never` socket.io workaround |
| TD-07..14 | Med | 5 files | `as` callback/keyof casts without validation |
| TD-23 | Med | BottomNavigationBar.tsx:156 | `as string` on potentially undefined boxShadow |
| DATE-01 | Low | 3 files | 3 inline `new Intl.DateTimeFormat('fr-FR')` |
| D-NEW-02 | Low | 4 duration formatters | formatProgressTime eliminated; D02 remains |
| D-NEW-04 | Low | ws-bindings.ts:530,723,970 | 3 toLocaleTimeString() without locale |
| D-NEW-07 | Low | 3 files | 3x sumUnitRecord pattern |
| D-NEW-09 | Low | 4 files | Crown balance formatting 4x |
| D-NEW-10 | Low | 3 files | 3x sumResources pattern |
| D04 | Low | kingdomActivitiesViewModel.ts:188 | computeProgress overlaps constructionProgress |
| PERF-01 | Low | PublicPlayerProfileSheet.tsx:31 | Triple useTickingNow |
| STR-02 | Low | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable |
| TD-25 | Low | api/queries/ (12 sites) | `[] as T[]` pattern, typed helper would remove all |

## CLOSED this run

| ID | Fix |
|----|-----|
| D-NEW-01 | FIX: 4 duration formatters → shared `formatDuration(ms, opts?)` in lib/formatters.ts |
| D-NEW-08 | FIX: 3 strategy-label maps → shared `STRATEGY_LABELS` in lib/strategyLabels.ts |
| WS-23 | FIX: applyVillageAttacked missing incomingAttacks invalidation |
| TYPE-03 | FIX: scoutReportStrategyLabel uses STRATEGY_LABELS, removes `as VillageStrategyType` cast |

## CLOSED prior runs

| ID | Fix |
|----|-----|
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
