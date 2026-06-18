# refactor-shared — état (réécrit chaque run)

last: 2026-06-17 | thème: combat/index.ts — redundant export type block + CombatConfig alias
full: `archive/refactor-shared/2026-06-17-full.md`

## OPEN

PR `maint(refactor-shared): remove redundant combat index exports` en review

## Candidats prochains runs

1. **`village/buildings.ts` split** — 524L monolithique → definitions.ts + speed-bonuses.ts + vision.ts. Scope : 4 fichiers, consommateurs à vérifier.
2. **`auth/schemas.ts`** — mismatch `displayName` optional input / required type output. Scope : 1-2 fichiers. Pas de bug réel mais schema confus.
3. **test gap `logic/`** — `calculateTravelTime`, `calculateBuildingCost`, `calculateProductionRate`, `calculateTrainingTime` (zéro spec dans shared, backend couvre buildings via consumer).
4. **`events/schemas.ts`** — ✅ satisfies guard déjà en place — **retirer de ce backlog**.
