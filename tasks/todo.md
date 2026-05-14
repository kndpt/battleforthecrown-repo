# Ticket 51 - Bottom sheets design-system

## Plan

- [x] Préflight : vérifier Git clean, lire ticket, rules, `SPEC.md`, briefing Pixi et skill React HUD.
- [x] Cartographie : localiser `BottomSheet`, `KingdomActivitiesPanel`, `PowerBottomSheet`, `QueueBottomSheet`, `BuildingManagementPanel`.
- [x] Implémentation : créer `GameBottomSheetPanel` dans le design system et l'exporter.
- [x] Migration : rebrancher `KingdomActivitiesPanel`, `PowerBottomSheet`, `QueueBottomSheet`, `BuildingManagementPanel`.
- [x] Vérification : review diff, tests ciblés/type-check, inspection navigateur mobile/desktop, `yarn static-check`.
- [x] Archive : passer le ticket en DONE, archiver, mettre à jour `tasks/README.md`, commit.

## Notes d'analyse

- `BottomSheet` reste la primitive overlay/animation.
- `KingdomActivitiesPanel` porte déjà la coque visuelle cible : poignée, header `Panneau`, surface parchemin, header sticky implicite via layout.
- `Power`, `Queue` et `BuildingManagementPanel` recodent encore leur coque avec `Panel`, `PanelHeader`, `PanelBody` et leur propre bouton close.

## Review

- `GameBottomSheetPanel` centralise la coque visuelle : poignée, header `eyebrow/title`, bouton close, actions de header, zone scrollable et variantes `default/compact/tabbed`.
- `KingdomActivitiesPanel` consomme la nouvelle base sans changer ses listes, onglets ou view models.
- `PowerBottomSheet`, `QueueBottomSheet` et `BuildingManagementPanel` gardent leurs contenus métier mais partagent la même coque.
- Preview `/design-system` ajouté pour inspecter directement la base.
- Tests : `yarn workspace battleforthecrown-pixi type-check` et `yarn static-check` verts.
- QA visuelle : Playwright sur `/design-system` en 390x844 et 1280x900, aucune erreur console/page, pas d'overflow horizontal.
- Docs : aucun changement nécessaire, raison : convention documentée par composant design-system exporté + usages dans le code.
