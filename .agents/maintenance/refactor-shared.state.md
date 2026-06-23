# refactor-shared — état (réécrit chaque run)

last: 2026-06-22 | thème: split rankings/index.ts par préoccupation
full: `archive/refactor-shared/2026-06-22-full.md`

## OPEN

PR #186 `maint(refactor-shared): split rankings/index.ts by concern` — en review

## Candidats prochains runs

1. **split `village/definitions.ts`** (476 L) — types + BUILDING_DEFINITIONS const + helpers mélangés. Refactor structurel, risque d'imports à mettre à jour (re-export via buildings.ts → index.ts).
2. **test gap `logic/`** — `calculateTravelTime`, `calculateBuildingCost`, `calculateProductionRate` — consumer backend seulement. Valeur moyenne (backend suffit pour l'instant).
3. **split `rankings/final-ranking-snapshot.ts`** — déjà bien isolé, faible priorité.
