# refactor-pixi — state (rewritten each run)

last: 2026-06-23 | theme cache-invalidation-hygiene | PR pending
full: `archive/refactor-pixi/2026-06-23-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F5 | High | VillageView.tsx:565L | 9 responsibilities, 8+ useState, mixed concerns |
| F6 | High | ArmyScreen.tsx:681L | 10 responsibilities, 8 useState, training polling via useEffect+ref |
| F7 | High | WorldMapScene.ts:1027L | closure state mutations bypass Zustand subscriber patterns |
| F8 | High | GameHeader.tsx:404L | profileTab/villageFilter/sortAscending dup from VillageView |
| F10 | High | WorldMapScene.ts:1027L | 0 tests (scene logic well-structured but uncovered) |
| F11 | Med | BuildingSprite.ts | Listener leak fixed PR#146, still 0 tests |
| F18 | Med | queries.ts:1028-1069 | createReportHooks: parseList/parseDetail optional → unsafe `as` fallback |
| N1 | High | AttackDetailModal.tsx:85-112 | Local travel time + carry capacity — display-only shared formula, not a violation |
| N2 | Med | UnitCard.tsx:436L | 3 useState, training progress polling via useEffect |
| N4 | High | CaravanLaunchModal.tsx:136-146 | Local caravan travel time — display-only shared formula, not a violation |
| N5 | Med | resources.ts/crowns.ts | Unbounded byVillageId maps — no TTL/eviction |
| N6 | Med | armyViewModel.ts:278,315 | Local unit power weight calc — display-only |
| G2 | Med | queries.ts:1730L+ | Monolith: 50+ hooks + DTOs in 1 file |
| AQ-23 | Med | queries.ts:762-781 | Hardcoded timePerUnitMs: 60_000 in optimistic update |

## CLOSED this run

| ID | Fix |
|----|-----|
| WS-01 | ws-bindings.ts: applyResourcesChanged now invalidates TQ resources cache |
| WS-02 | ws-bindings.ts: applyCrownsChanged now invalidates TQ crowns cache |
| AQ-14 | queries.ts: useInitiateAttackMutation adds villagePower + kingdomPower invalidation |
| AQ-15 | queries.ts: useInitiateScoutMutation adds villagePower + kingdomPower invalidation |
| AQ-16 | queries.ts: useInitiateReinforceMutation adds population + villagePower + kingdomPower |
| AQ-17 | queries.ts: useInitiateCaravanMutation adds villagePower + kingdomPower invalidation |
