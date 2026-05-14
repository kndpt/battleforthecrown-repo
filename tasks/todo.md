# Ticket 47 - Queue visuelle Noble

## Plan

- [x] Préflight : vérifier Git clean, lire ticket, rules, `SPEC.md`, briefing Pixi.
- [x] Cartographie : localiser la progression Caserne et la Salle du Trône.
- [x] Implémentation : extraire un helper de progression training et afficher la queue Noble.
- [x] Tests : couvrir le calcul de progression ciblé côté Pixi.
- [x] Vérification : review diff, tests ciblés, `yarn static-check`.
- [x] Archive : passer le ticket en DONE, archiver, mettre à jour `tasks/README.md`, commit.

## Notes d'analyse

- `UnitCard` calcule déjà progression/restant pour les trainings de Caserne.
- `BuildingDetailModal` détecte seulement `nobleInTraining` via `armyTraining`, sans rendre de progression.
- `unit.training.completed` invalide déjà `armyTraining`, `armyInventory`, `population` côté WS.

## Review

- `computeUnitTrainingProgress` centralise la progression UnitTraining et remplace le calcul inline de `UnitCard`.
- `BuildingDetailModal` affiche une carte `Noble en formation` dans la Salle du Trône avec progression, temps restant, ETA et annulation.
- `unit.training.completed` invalide déjà `armyTraining` ; la modale force aussi un refetch quand l'horloge locale dépasse la fin estimée.
- Tests : `yarn workspace battleforthecrown-pixi test` et `yarn static-check` verts.
- Docs : aucun changement nécessaire, raison : comportement UI local déjà couvert par le ticket archivé, pas de nouvelle règle gameplay/API.
