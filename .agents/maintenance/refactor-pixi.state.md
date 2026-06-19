# refactor-pixi — état (réécrit chaque run)

last: 2026-06-19 | theme report-query-factory | PR #152 `claude/focused-galileo-abmngx`
full: `archive/refactor-pixi/2026-06-19-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F3 | Major | ws-bindings.ts:138-166 | applyUnitTrained/Completed missing resources(villageId) invalidation |
| F4 | Major | ws-bindings.ts:422-457 | applyCaravanSent/Arrived missing target village invalidations |
| F5 | High | VillageView.tsx:530L | 21 useState, mixed concerns |
| F6 | High | ArmyScreen.tsx:637L | 9 useState, tab/drag/garrison |
| F7 | High | WorldMapScene.ts:759L | closure state, no tests |
| F8 | High | GameHeader.tsx:65-69 | profileTab/villageFilter/sortAscending dup from VillageView |
| F9 | Med | resources.ts, crowns.ts | Parallel Zustand/TQ state |
| F10 | High | WorldMapScene.ts | 760L, 0 tests |
| F11 | Med | BuildingSprite.ts | 294L, 0 tests |
| F12 | Minor | resources.ts:29, crowns.ts:29 | Unused selectors |
| F14 | Minor | queries.ts:330 | Resources staleTime:0 aggressive |
| F15 | Med | GameHeader.tsx:189-207 | Inline `<style>` keyframe injection on every render |
| F16 | Med | WorldMapScene.ts:267 | fogContainer.cacheAsTexture no explicit uncache in exit() |
| F17 | Med | queries.ts:191,198 | useWorldsQuery/usePublicWorldsQuery missing staleTime + enabled |
| F18 | Med | queries.ts reject/resolve | Inconsistent queryFn error handling (reject vs resolve empty) |

## CLOSED this run

| ID | Fix |
|----|-----|
| F13 | queries.ts: deleteCaravanReport removeQueries → invalidateQueries (aligned with other 3 deletes) |
| F19 | queries.ts: 4×4 report hooks → createReportHooks factory (-106 lines) |
