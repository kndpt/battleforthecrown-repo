# refactor-pixi — état (réécrit chaque run)

last: 2026-06-18 | theme report-modal-dry+building-listener-leak | PR pending `claude/focused-galileo-ltqzq8`
full: `archive/refactor-pixi/2026-06-18-full.md`

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
| F13 | Major | queries.ts:1088 | deleteCaravanReport removeQueries vs invalidateQueries |
| F14 | Minor | queries.ts:330 | Resources staleTime:0 aggressive |

## CLOSED this run

| ID | Fix |
|----|-----|
| F1 | BuildingSprite: added removeAllListeners() before destroy() |
| F2 | ReportDetailModal: extracted useReportLifecycle hook (mark-read + delete + error toast) |
