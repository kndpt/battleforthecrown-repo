# refactor-shared — état (réécrit chaque run)

last: 2026-06-21 | thème: shared specs pour formules pures sans couverture dans shared
full: `archive/refactor-shared/2026-06-21-full.md`

## OPEN

PR #174 `maint(refactor-shared): add shared specs for pure formula modules` — en review

## Candidats prochains runs

1. **test gap `logic/`** — `calculateTravelTime`, `calculateBuildingCost`, `calculateProductionRate` — consumer backend seulement. Valeur moyenne (backend suffit pour l'instant).
2. **split `village/definitions.ts`** (476 L) — types + BUILDING_DEFINITIONS const + helpers mélangés. Refactor structurel, risque d'imports à mettre à jour.
3. **split `rankings/index.ts`** (163 L) — types + consts + Zod schemas + formules. Already has index.spec.ts. Splitting would improve navigability.
