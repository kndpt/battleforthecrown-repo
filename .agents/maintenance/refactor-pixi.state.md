# refactor-pixi — state (rewritten each run)

last: 2026-07-04 | theme session-ctx-dry-invalidation-helpers | branch claude/focused-galileo-3ao4ay
full: `archive/refactor-pixi/2026-07-04-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| C-01 | High | ArmyScreen.tsx:681L | 11 hooks, 7 useState, mixed onboarding/garrison/recruitment, NO test |
| C-03 | High | VillageView.tsx:573L | 20 hooks, 9 useState, 7 boolean flags, 40+ props drilled, NO test |
| P-01 | High | WorldMapScene.ts:1019L | Scene monolith: 11+ responsibilities, split into 7 managers feasible |
| S-01 | High | resources.ts, crowns.ts | Dual source of truth: Zustand + TQ cache (design intentional for interpolation) |
| TEST-01 | High | ArmyScreen, VillageView, AttackDetailModal | 3/4 major screens have ZERO tests |
| STR-02 | Med | stores/ui.ts:62-63 | toastSeq/victoryModalSeq module-level mutable, not reset on logout |
| S-03 | Med | ui.ts:131L | Toasts + modals + defeats mixed (functional but unmaintainable) |
| TEST-02 | Med | MapMarkerSheet.tsx | New component without tests |

## CLOSED this run

| ID | Fix |
|----|-----|
| DRY-01 | FIX: extracted SessionCtx + resolveSessionCtx() — 12 redundant useAuthStore reads and 6 useGameStore reads eliminated; invalidation helpers now accept explicit session context |
| WS-01 | RECLASSIFIED: applyVillageConquered (51L) is sequential/clear; session reads consolidated via SessionCtx; not a god function |
| F01 | ADDRESSED BY PR #244 (pending merge): useTrainUnitsMutation hardcoded timePerUnitMs |
| F02 | ADDRESSED BY PR #244 (pending merge): useUpgradeBuildingMutation hardcoded endTime |
| Q-09 | RESOLVED: queries.ts split into 12 domain modules (PR #233, merged) |

## CLOSED prior runs

| ID | Fix |
|----|-----|
| WS-03 | TEST: 5 untested handlers now covered |
| SESS-01 | FIX: mapMarkersStore.clear() added + included in resetGameSessionStores() |
| S-02 | VERIFIED RESOLVED: all store consumers use granular selectors |
| C-04 | RECLASSIFIED LBAF: SpecializedBuildingDetailModal purely presentational |
| P-02 | VERIFIED RESOLVED: viewport.removeAllListeners() in exit() covers pointertap |
| P-03 | VERIFIED RESOLVED: viewport.removeAllListeners() in exit() covers background tap |
| WS-02 | RECLASSIFIED LOW: worldId null in invalidate helpers harmless |
| Q-01 | Zod schemas for all 4 report types in shared |
| SCN-01 | VERIFIED RESOLVED: ticker handler properly removed before exit() |
| WS-06..09 | BUG FIX: caravan/garrison/conquest invalidation + tests |
| Q-10..13 | DRY/PERF: invalidation helpers extracted, rankingsSummary interval tuned |
| WS-04..05 | BUG FIX: applyNobleKilled missing invalidations + test |
| Q-05..07 | DRY/BUG FIX: combat dispatch + troop movement helpers + recall fix |
