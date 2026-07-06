# refactor-shared — état (réécrit chaque run)

last: 2026-07-05 | thème: split village/definitions.ts par préoccupation
full: `archive/refactor-shared/2026-07-05-full.md`

## OPEN

PR à créer : `maint(refactor-shared): split village/definitions.ts by concern` (branche `claude/practical-hypatia-cgshzr`, imposée par le harness cloud pour ce run).

## Candidats prochains runs

1. **test gap `logic/`** — `calculateTravelTime`, `calculateBuildingCost`, `calculateProductionRate` — consumer backend seulement. Valeur moyenne (backend suffit pour l'instant).
2. **split `rankings/final-ranking-snapshot.ts`** — déjà bien isolé, faible priorité.
3. **`events/types.ts` (515 L) / `events/schemas.ts` (414 L)** — plus gros fichiers du package désormais ; à auditer si un thème de découpe clair émerge (actuellement schémas/types déjà groupés par domaine d'event, risque de sur-découpe).
