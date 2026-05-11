# Front recall attack action

## Plan

- [x] Lire les tickets/runs cites et confirmer le scope deja traite.
- [x] Cartographier le flux API/front des expeditions et du rappel.
- [x] Ajouter l'action de rappel dans le HUD au bon endroit.
- [x] Verifier par tests/build cibles et impact documentation.

## Review

- Correctness : le backend exposait deja `POST /combat/recall/:expeditionId` et l'event `expedition.recalled`; le front avait seulement le rappel de garnison. Le HUD affiche maintenant `Rappeler` sur les attaques `EN_ROUTE`.
- UI state : le seed REST conserve `kind` dans le store pour ne pas confondre attaque et renfort apres refresh.
- Animation : `expedition.recalled` transforme le trajet en retour depuis la position courante afin de garder le marqueur cheval visible jusqu'au village d'origine.
- Verification : type-check Pixi, lint Pixi, tests Pixi, test cible `ws-bindings` et `yarn static-check` verts.
- Docs : mise a jour de `docs/architecture/backend-modules.md` pour documenter l'endpoint de rappel d'expedition en route.
