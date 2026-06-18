# refactor-shared — état (réécrit chaque run)

last: 2026-06-18b | thème: logic/ — suppression casts as-number superflus + import dupliqué
full: `archive/refactor-shared/2026-06-18b-full.md`

## OPEN

PR #145 `maint(refactor-shared): remove redundant as-number casts + merge duplicate import in logic/` — en review (CodeRabbit en cours)

## Candidats prochains runs

1. **test gap `logic/`** — consumer tests backend couvrent tout, mais zéro spec dans shared pour `calculateTravelTime`, `calculateBuildingCost`. Valeur faible si backend suffit.
2. **`combat/utils.ts`** — `calculateCasualtyStats` / `isVictoryForAttacker` n'ont pas de spec shared (testé via consumer backend `combat.utils.spec.ts`).
3. **`resources/storage.ts`** — `getWarehouseStorageLimit` sans spec shared (testé via consumer backend).
