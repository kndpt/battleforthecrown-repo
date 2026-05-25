# Fix - Alignement test Watchtower Pixi

- [x] Preflight : analyser l'echec de pre-push et les commits recents.
- [x] Confirmer le contrat canonique Watchtower dans `packages/shared` et `docs/gameplay`.
- [x] Aligner le test Pixi `buildingModalContent`.
- [x] Lancer le test cible puis le test workspace Pixi.
- [x] Review finale, docs impact.

## Review

- Correctness : le helper Pixi consomme deja `WATCHTOWER_VISION_LEVELS`; seul le test etait reste sur l'ancien rayon lvl 4.
- Architecture : pas de changement runtime ; contrat partage/docs backend conserves avec lvl 1 = 10, +5/niveau, lvl 10 = 55.
- QA : test cible, test workspace Pixi et `yarn static-check` passent.
- Docs : aucun changement necessaire ; la doc canonique annonce deja les valeurs actuelles.
