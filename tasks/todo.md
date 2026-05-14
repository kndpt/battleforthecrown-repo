# Ticket 62 - Interactive minimap sync

## Plan

- [x] Préflight : Git clean, ticket 62 lu, rules/SPEC chargés.
- [x] Cartographie : inspecter WorldMapScene, WorldMapCanvas, WorldMapScreen, WorldMiniMap.
- [x] Implémentation : exposer camera subscription, relayer au controller, brancher minimap tap/drag.
- [x] Tests : vérifier selon policy Pixi/front et lancer les commandes adaptées.
- [x] Review : contrôler diff, performance rAF, cleanup listeners et absence de boucle.
- [x] Documentation : vérifier impact doc et justifier.
- [x] Archive : passer ticket en DONE, archiver, mettre à jour tasks/README.md, commit.

## Choix de scope

- Inclus : sync bidirectionnelle mini-carte <-> caméra principale.
- Exclu : tests unitaires Pixi/canvas, peu utiles ici selon `bftc-tests-policy`.

## Review

- `WorldMapScene` expose `onCameraChange` avec snapshot centre/taille visible, écoute `moved` + `zoomed` + resize, et coalesce les émissions en `requestAnimationFrame`.
- `WorldMapCanvas` relaie le hook via controller et prop, avec cleanup explicite au destroy.
- `WorldMapScreen` garde la dernière caméra en ref et ne re-render pour le viewbox que lorsque la mini-carte est visible.
- `WorldMiniMap` supporte tap + drag pointer capturé, avec conversion canvas -> tile clampée et curseur grab/grabbing.
- Tests : Pixi type-check, Pixi lint, Pixi Vitest avec env Vite, `yarn static-check` racine.
- Docs : aucun changement nécessaire, UX pure sans invariant gameplay/architecture durable.
