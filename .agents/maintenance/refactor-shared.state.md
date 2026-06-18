# refactor-shared — état (réécrit chaque run)

last: 2026-06-18 | thème: village/buildings.ts split → definitions + speed-bonuses + vision
full: `archive/refactor-shared/2026-06-18-full.md`

## OPEN

PR `maint(refactor-shared): split village/buildings.ts` en review

## Candidats prochains runs

1. **`auth/schemas.ts`** — mismatch `displayName` optional input / required type output. Scope : 1-2 fichiers. Pas de bug réel mais schema confus.
2. **test gap `logic/`** — `calculateTravelTime`, `calculateBuildingCost`, `calculateProductionRate`, `calculateTrainingTime` (zéro spec dans shared, backend couvre buildings via consumer).
