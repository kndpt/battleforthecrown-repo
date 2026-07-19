# refactor-shared — état (réécrit chaque run)

last: 2026-07-19 | thème: test gap `world/barbarian-geometry.ts` (seeding barbare)
full: `archive/refactor-shared/2026-07-19-full.md`

## OPEN

PR à créer ce run (branche `claude/practical-hypatia-agrghp`, imposée par le harness cloud).

## Candidats prochains runs

1. **`events/types.ts` (529 L) / `events/schemas.ts` (419 L)** — plus gros fichiers du package ; toujours pas de thème de découpe clair (schémas/types groupés par domaine d'event), à ré-checker si le fichier continue de grossir.
2. **`combat/dtos.ts` (338 L)** — pas encore audité en détail niveau structure/cohésion.
3. **`village/building-costs.ts` (392 L)** — pure data (`BUILDING_DEFINITIONS`), pas de logique ; split éventuel par catégorie de bâtiment si le fichier continue de grossir, faible priorité.
4. `rankings/final-ranking-snapshot.ts` — retiré des candidats, déjà bien isolé (checké runs précédents).
