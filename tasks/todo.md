# Ticket 57 - Player village building lifecycle roster

## Plan

- [x] Préflight : vérifier Git clean, lire ticket, rules, `SPEC.md`, briefing backend, policy tests.
- [x] Cartographie : localiser catalogue bâtiments, join, conquête, tests existants, doc architecture.
- [x] Implémentation : créer roster lifecycle canonique et le consommer dans join + conquête.
- [x] Tests : couvrir absence de policy lifecycle et alignement join/conquête.
- [x] Documentation : documenter la règle durable et le backfill historique explicite.
- [x] Vérification : review diff, tests ciblés, smokes backend si requis, `yarn static-check`.
- [x] Archive : passer le ticket en DONE, archiver, mettre à jour `tasks/README.md`, commit.

## Notes d'analyse

- Duplication trouvée entre `JoinWorldUseCase.INITIAL_BUILDINGS` et les constantes de matérialisation barbare dans `ConquestService`.
- `docs/architecture/data-model.md` contenait déjà l'invariant, mais pointait vers `INITIAL_BUILDINGS` au lieu d'une source lifecycle complète.

## Review

- `PLAYER_VILLAGE_BUILDING_LIFECYCLE` devient la source canonique : chaque bâtiment activé a une politique join + conquête explicite.
- `JoinWorldUseCase` consomme le roster pour les villages initiaux ; `ConquestService` le consomme pour matérialiser les villages barbares conquis.
- Tests : `buildings.spec.ts` couvre le garde-fou de policy manquante et l'alignement roster ; `conquest-service.smoke.spec.ts` vérifie les rows DB après conquête.
- Vérifications : test ciblé, smoke preflight, smokes backend complets, `yarn static-check` verts.
- Docs : mises à jour dans `docs/architecture/data-model.md`.
