# 72 — Stats joueur sur les cartes royaumes

- [x] Préflight : git clean, ticket, rules, SPEC, briefing Pixi et specs amont lus.
- [x] Cartographier `WorldSelector`, `WorldCardViewModel`, design card, hooks/API power et memberships.
- [x] Ajouter une stat personnelle optionnelle par `worldId` sans dépendre du `worldId` courant du store.
- [x] Afficher villages + puissance avec l'asset canonique uniquement pour les mondes rejoints avec données chargées.
- [x] Adapter les tests ciblés view-model et rendu design.
- [x] Review 5 axes, tests ciblés, `yarn static-check`, impact docs.
- [ ] Archiver le ticket, mettre à jour `tasks/README.md`, commit final.

## Review

- Cartes `/worlds` enrichies avec des stats personnelles optionnelles uniquement pour les mondes rejoints.
- Puissance chargée via endpoint public world-scoped par membership, sans dépendre du `worldId` courant.
- Cache public `publicKingdomPower` séparé du cache complet `kingdomPower` après finding bloquant reviewer.
- Tests Pixi ciblés et `yarn static-check` verts.
- Docs : aucun changement nécessaire, raison : fonctionnalité conforme aux specs gameplay existantes et aucun nouveau contrat backend/shared.
