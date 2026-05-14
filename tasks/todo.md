# Tickets 60 + 61 - WorldMap active village UX

## Plan

- [x] Préflight : Git clean, tickets 60/61 lus, rules/SPEC chargés.
- [x] Cartographie : inspecter panel d'entité, écran WorldMap, canvas Pixi et tests existants.
- [x] Implémentation : bouton "Aller à ce village" + halo du village actif.
- [x] Tests : étendre les tests utiles du panel et vérifier la policy Pixi.
- [x] Vérification : review diff, tests ciblés, `yarn static-check`, QA front adaptée.
- [x] Documentation : vérifier impact doc et justifier.
- [x] Archive : passer tickets en DONE, archiver, mettre à jour `tasks/README.md`, commit.

## Choix de scope

- Inclus : `60-own-village-popup-goto-button.md` et `61-active-village-map-indicator.md`.
- Exclu : `62-interactive-minimap-sync.md`, plus large car il introduit une souscription caméra bidirectionnelle.

## Review

- `SelectedEntityPanel` affiche "Aller à ce village" seulement sur village possédé inactif et appelle un callback dédié.
- `WorldMapScreen` bascule le village actif, navigue vers `/game`, puis ferme le popup.
- `WorldMapScene` remplace le crosshair discret par un halo doré pulsé sous le sprite du village actif.
- Tests : `SelectedEntityPanel.test.tsx` couvre présence/clic du bouton et absence sur village actif/non possédé.
- Vérifications : test ciblé, suite Pixi complète, `yarn static-check`, health backend et Vite worktree.
- Docs : aucun changement nécessaire, UX pure sans invariant gameplay/architecture durable.
