# Run 009 — fix UI bâtiments verrouillés / non construits

## Plan

- [x] Préflight : repo clean, fiche `PLANNED`, spec et rules relues.
- [x] Cartographier les fichiers frontend ciblés.
- [x] Ajouter le helper pur `getBuildingLockState` et ses tests Vitest.
- [x] Brancher le helper dans le panel, la modale et la scène Pixi.
- [x] Supprimer les labels production `Niv. 0`.
- [x] Vérifier review, tests, build, docs, archive et commit.

## Review

- Review correctness/readability/architecture/security/performance : aucun finding bloquant ou majeur.
- Vérifications : `yarn workspace battleforthecrown-pixi test` vert, `yarn workspace battleforthecrown-pixi build` vert.
- Docs : aucun changement nécessaire, la spec gameplay existante était déjà la source de vérité ; le changement aligne seulement le frontend.
