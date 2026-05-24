# Header HUD resources

- [x] Cartographier `GameHeader` et `HeaderBar` pour identifier le format des stats.
- [x] Ajuster le layout de la rangée ressources pour garder les progressbars visibles.
- [x] Afficher la population sans le max.
- [x] Vérifier le rendu par tests/checks ciblés.
- [x] Review finale et impact docs.

## Review

- Correctness: le header affiche la population utilisée seule, sans capacité max.
- UX: les ressources gardent une jauge de stock visible en bas de pilule sans recouvrir tout le fond.
- Tests: `GameHeader.test.tsx`, `yarn workspace battleforthecrown-pixi type-check`, preview `/design-system`.
- Docs: aucun changement nécessaire.
