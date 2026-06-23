# refactor-pixi — état (réécrit chaque run)

last: 2026-06-22 | theme worldmap-entity-styling-raf-leak | PR pending
full: `archive/refactor-pixi/2026-06-22b-full.md`

## OPEN

| ID | Sev | Where | Note |
|----|-----|-------|------|
| F5 | High | VillageView.tsx:565L | 9 responsibilities, 8+ useState, mixed concerns |
| F6 | High | ArmyScreen.tsx:681L | 10 responsibilities, 8 useState, training polling via useEffect+ref |
| F8 | High | GameHeader.tsx:404L | profileTab/villageFilter/sortAscending dup from VillageView |
| F9 | Med | resources.ts, crowns.ts | Parallel Zustand/TQ state (intentional: fast-path interpolation) |
| F11 | Med | BuildingSprite.ts | Listener leak fixed PR#146, still 0 tests |
| F18 | Med | queries.ts:1028-1069 | createReportHooks: parseList/parseDetail optional → unsafe `as` fallback |
| N1 | High | AttackDetailModal.tsx:85-112 | Local travel time + carry capacity + attack power — server-authoritative violation |
| N2 | Med | UnitCard.tsx:436L | 3 useState, training progress polling via useEffect |
| N4 | High | CaravanLaunchModal.tsx:136-146 | Local caravan travel time calculation — server-authoritative violation |
| N5 | Med | resources.ts/crowns.ts | Unbounded byVillageId maps — no TTL/eviction |
| N6 | Med | armyViewModel.ts:278,315 | Local unit power weight calculation — display-only but drifts |
| G2 | Med | queries.ts:1713L | Monolith: 50+ hooks + DTOs in 1 file, candidate for split |

## CLOSED this run

| ID | Fix |
|----|-----|
| F7 | WorldMapScene.ts: entity styling (styleFor, spriteSizeFor, aliasFor, COLOR, etc.) extracted to worldMapEntityStyle.ts (1027→930L). 14 tests. |
| F10 | WorldMapScene.ts: entity styling now covered by unit tests (14 specs) |
| BUG | WorldMapScene.ts: buildWater RAF leak fixed — handle stored in waterRaf, cancelled in exit() |
