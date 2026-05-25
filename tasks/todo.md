# 071 starting resources + population display

- [x] Confirmer le sens population: `used` consomme, `available = max - used`.
- [x] Corriger le stock initial quand `.env` ne définit pas `*_STARTING_AMOUNT`.
- [x] Afficher la population disponible dans le header et les listes village.
- [x] Ajouter le filet de regression cible.
- [x] Verifier tests/static-check et impact docs.

## Review

- Stock initial sans env: 1000 bois/pierre/fer par defaut.
- Overrides env conserves; env invalide refuse.
- Header/listes villages affichent population disponible: `available = max - used`.
- Fiche 71 ecrite puis archivee dans `tasks/archive/71-fix-starting-resources-defaults.md`.
- DB locale `battleforthecrown_9244_worlds`: village `fresh-open` existant repare de `13/13/13` a `1000/1000/1000`.
- QA API: nouveau join `fresh-open` cree directement `1000/1000/1000`, population `17/250`.
- Tests cibles backend + Pixi OK.
- `yarn static-check`: OK.
- Smokes backend: 24 suites / 48 tests OK.
- Docs: fiche task archivee; docs gameplay inchanges car deja conformes.
