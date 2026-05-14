# Ticket 56 - Popup village possede : troupes presentes

## Plan

- [x] Préflight : vérifier Git clean, lire ticket, rules, `SPEC.md`, briefing Pixi.
- [x] Cartographie : localiser `SelectedEntityPanel`, `MapEntityCallout`, hooks armée/garnison, meta unités.
- [x] Implémentation : agréger natives + renforts `INCOMING` et afficher une section compacte dans le callout.
- [x] Tests : couvrir l’agrégat, le village vide et le format compact.
- [x] Vérification : review diff, tests ciblés, `yarn static-check`.
- [x] Archive : passer le ticket en DONE, archiver, mettre à jour `tasks/README.md`, commit.

## Notes d'analyse

- `SelectedEntityPanel` est le point de composition des sections du popup.
- `useArmyInventoryQuery` et `useGarrisonQuery` existent déjà et sont invalidés par les flux armée/renfort.
- `MapEntityCallout` rend seulement des lignes label/value aujourd’hui ; on peut l’étendre sans casser la section `Capture`.

## Review

- `SelectedEntityPanel` fetch uniquement pour les villages possédés et compose natives + renforts `INCOMING`.
- `MapEntityCallout` accepte maintenant une icône optionnelle par ligne de section ; la section `Capture` reste sur le même contrat label/value.
- Tests : `SelectedEntityPanel` couvre village possédé non-actif, actif, vide, et village non possédé sans fetch ; helper pur couvre l’agrégat et le format compact.
- `yarn workspace battleforthecrown-pixi test` et `yarn static-check` verts.
- Docs : aucun changement nécessaire, raison : aucune doc UI existante ne référence `MapEntityCallout`, comportement local couvert par le ticket archivé.
