# refactor-pixi — état (réécrit chaque run)

last: 2026-06-20 | theme ws-invalidation-completeness + fog-texture-leak | PR pending `claude/focused-galileo-8xkrkd`
full: `archive/refactor-pixi/2026-06-20-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F4 | Major | ws-bindings.ts:422-457 | applyCaravanSent missing resources(targetVillageId) — REST mutation does both origin+target |
| F5 | High | VillageView.tsx:530L | 8 useState (not 21 — downgraded), mixed concerns but horizontally organized |
| F6 | High | ArmyScreen.tsx:637L | 5 useState (not 9), training polling via useEffect+ref |
| F7 | High | WorldMapScene.ts:759L | closure state mutations bypass Zustand subscriber patterns |
| F8 | High | GameHeader.tsx:65-69 | profileTab/villageFilter/sortAscending dup from VillageView:132-134 |
| F9 | Med | resources.ts, crowns.ts | Parallel Zustand/TQ state, no sync mechanism |
| F10 | High | WorldMapScene.ts | 759L, 0 tests |
| F11 | Med | BuildingSprite.ts | Listener leak fixed PR#146, still 0 tests |
| F12 | Minor | resources.ts:29, crowns.ts:29 | Unused selectors selectVillageResources/selectCrowns |
| F14 | High | queries.ts:338 | Resources staleTime:0 + refetchOnMount:'always' — aggressive |
| F15 | Med | GameHeader.tsx:189-207 | Inline `<style>` keyframe injection on every render |
| F17 | Med | queries.ts:191-207 | useWorldsQuery/usePublicWorldsQuery missing staleTime |
| F18 | Med | queries.ts:877-894 | createReportHooks: list resolves [] vs detail rejects — inconsistent |
| N1 | High | AttackDetailModal.tsx:84-105 | Local travel time + carry capacity calculation — server-authoritative violation |
| N2 | Med | UnitCard.tsx:436L | 6 state sources, 3 useEffect, manual cache polling on training completion |
| N3 | Minor | GameHeader.tsx imports | ChevronLeft/ChevronRight imported but unused |
| N5 | Med | resources.ts/crowns.ts | Unbounded byVillageId maps — no TTL/eviction |

## CLOSED this run

| ID | Fix |
|----|-----|
| F3 | ws-bindings.ts: applyUnitTrained/Completed now invalidate resources(villageId) — aligned with REST useTrainUnitsMutation |
| F16 | WorldMapScene.ts: fogContainer.cacheAsTexture(false) in exit() — GPU texture leak fixed |
