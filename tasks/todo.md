# Ticket 55 - Bâtiments avancés après conquête barbare

## Plan

- [x] Préflight : vérifier Git clean, lire ticket, rules, `SPEC.md`, briefing backend.
- [x] Cartographie : localiser `ConquestService`, `INITIAL_BUILDINGS`, smoke de finalisation et doc data-model.
- [x] Implémentation : créer les rows level 0 des bâtiments activés non matérialisés après conquête barbare.
- [x] Backfill : ajouter une migration SQL non destructive pour les villages déjà conquis.
- [x] Tests : adapter le smoke `conquest-finalize` aux 10 buildings attendus.
- [x] Vérification : smokes backend, `yarn static-check`.
- [x] Archive : passer le ticket en DONE, archiver, mettre à jour `tasks/README.md`, commit.

## Notes d'analyse

- `ConquestService` remplace les bâtiments barbares par 7 rows de base au `materializedLevel`.
- `JoinWorldUseCase.INITIAL_BUILDINGS` crée 10 rows joueur, dont `WATCHTOWER`, `COUNCIL_HALL`, `THRONE_HALL` level 0.
- `docs/architecture/data-model.md` indique que `GET /village/buildings` expose les rows DB réelles sans synthèse.
- `HIDEOUT` et `WALL` existent dans `BUILDING_TYPES` mais sont désactivés ; ne pas les créer.
- Backend `src/` touché : smokes obligatoires (`test:smoke:preflight` + `test:smoke`).

## Review

- `ConquestService` crée désormais les bâtiments activés restants en `level: 0` après conquête barbare.
- Migration non destructive `20260514171000_backfill_conquered_village_unbuilt_buildings` appliquée à la DB smoke et à la DB locale.
- Village local `cmorq0wfr002zvdkyu1r4vn7s` vérifié : 10 rows, avancés en level 0.
- Smoke `conquest-finalize` couvre les bâtiments matérialisés au niveau de tier et les bâtiments avancés en level 0.
- Tests : `test:smoke:preflight`, `test:smoke`, `static-check` verts.
- Docs : mise à jour `docs/architecture/data-model.md` avec l'invariant de conquête barbare.
