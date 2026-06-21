# refactor-pixi — état (réécrit chaque run)

last: 2026-06-21 | theme ws-invalidation-completeness-2 + tq-staleTime-hygiene + inline-style-extraction | PR `claude/focused-galileo-8if3w1`
full: `archive/refactor-pixi/2026-06-21-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F5 | High | VillageView.tsx:558L | 8 useState, mixed concerns but horizontally organized |
| F6 | High | ArmyScreen.tsx:681L | 8 useState, training polling via useEffect+ref |
| F7 | High | WorldMapScene.ts:804L | closure state mutations bypass Zustand subscriber patterns |
| F8 | High | GameHeader.tsx:65-69 | profileTab/villageFilter/sortAscending dup from VillageView:136-138 |
| F9 | Med | resources.ts, crowns.ts | Parallel Zustand/TQ state, no sync mechanism |
| F10 | High | WorldMapScene.ts | 804L, 0 tests |
| F11 | Med | BuildingSprite.ts | Listener leak fixed PR#146, still 0 tests |
| F18 | Med | queries.ts:877-894 | createReportHooks: list resolves [] vs detail rejects — inconsistent |
| N1 | High | AttackDetailModal.tsx:85-112 | Local travel time + carry capacity + attack power — server-authoritative violation |
| N2 | Med | UnitCard.tsx:436L | 3 useState, training progress polling via useEffect |
| N4 | High | CaravanLaunchModal.tsx:136-146 | Local caravan travel time calculation — server-authoritative violation |
| N5 | Med | resources.ts/crowns.ts | Unbounded byVillageId maps — no TTL/eviction |
| N6 | Med | armyViewModel.ts:278,315 | Local unit power weight calculation — display-only but drifts |

## CLOSED this run

| ID | Fix |
|----|-----|
| F4 | ws-bindings.ts: applyCaravanSent now invalidates resources(targetVillageId) — aligned with REST |
| F14 | queries.ts: resourcesQueryOptions staleTime 0→5_000, removed refetchOnMount:'always' |
| F15 | GameHeader.tsx: inline `<style>` keyframes extracted to index.css as bftc-topbar-*-dock |
| F17 | queries.ts: useWorldsQuery(30s), usePublicWorldsQuery(30s), useMyMembershipsQuery(10s) staleTime added |
| F19 | ws-bindings.ts: applyVillageAttacked now invalidates resources(defenderVillageId) |
| F20 | ws-bindings.ts: applyCaravanArrived now invalidates population(targetVillageId) |
| F12 | Dead selectors removed by maint-debt PR#169 (previous run) |
| N3 | Unused ChevronLeft/ChevronRight imports removed by maint-debt PR#169 |
