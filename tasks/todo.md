# Bottom sheets design-system

## Plan

- [x] Préflight : vérifier Git clean, lire ticket, rules, `SPEC.md`, briefing Pixi et skill React HUD.
- [x] Cartographie : localiser `BottomSheet`, `KingdomActivitiesPanel`, `PowerBottomSheet`, `QueueBottomSheet`, `BuildingManagementPanel`.
- [x] Implémentation : créer `GameBottomSheetPanel` dans le design system et l'exporter.
- [x] Migration : rebrancher `KingdomActivitiesPanel`, `PowerBottomSheet`, `QueueBottomSheet`, `BuildingManagementPanel`.
- [x] Interaction : ajouter la fermeture par swipe-down dans la primitive `BottomSheet`.
- [x] Vérification : review diff, tests ciblés/type-check, inspection navigateur mobile/desktop, `yarn static-check`.
- [x] Archive : passer le ticket en DONE, archiver, mettre à jour `tasks/README.md`, commit.

## Review

- `GameBottomSheetPanel` centralise la coque visuelle : poignée, header `eyebrow/title`, bouton close, actions de header, zone scrollable et variantes `default/compact/tabbed`.
- `KingdomActivitiesPanel` consomme la nouvelle base sans changer ses listes, onglets ou view models.
- `PowerBottomSheet`, `QueueBottomSheet` et `BuildingManagementPanel` gardent leurs contenus métier mais partagent la même coque.
- `BottomSheet` ferme aussi par swipe-down depuis la zone haute du sheet, sans intercepter les boutons/onglets/inputs.
- Tests : `yarn workspace battleforthecrown-pixi type-check` et `yarn static-check` verts.
- QA visuelle : Playwright sur `/design-system` en 390x844 et 1280x900, aucune erreur console/page, pas d'overflow horizontal.
- Docs : mise à jour `battleforthecrown-pixi/src/ui/panels/README.bottomsheet.md` pour le swipe de fermeture.
