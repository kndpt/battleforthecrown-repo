# Ticket 63 - Foreign players invisible on world map

## Plan

- [x] Preflight : Git clean, ticket 63 lu, rules/SPEC/specs chargees.
- [x] Cartographie : verifier backend world entities, frontend mapping et invalidations WS.
- [x] Implementation : lire les villages joueurs depuis `Village` dans `WorldEntitiesQueryService`.
- [x] Tests : ajouter un smoke backend reel sur `GET /world/:worldId/entities`.
- [x] Review : verifier diff, shape API, fog et absence de changement frontend inutile.
- [x] Verification : lancer preflight smoke, smoke cible/backend requis et `yarn static-check`.
- [x] Documentation : verifier impact docs et justifier.
- [x] Archive : passer ticket en DONE, archiver, mettre a jour `tasks/README.md`, commit.

## Choix de scope

- Inclus : `PLAYER_VILLAGE` dans le feed monde depuis la table `Village`, fog inclus.
- Inclus : commentaire Prisma `WorldEntity` deprecated pour eviter de retablir l'ecriture miroir.
- Exclu : suppression de la table `WorldEntity` et migration associee.
- Exclu : changement frontend, deja compatible avec le shape `PLAYER_VILLAGE`.

## Review

- `WorldEntitiesQueryService` garde `Village` comme source canonique pour les villages joueurs et respecte le filtre `kinds` + bounds.
- `PLAYER_VILLAGE` expose seulement `userId`, `name`, `villageId`; pas de fuite `label` / `isCapital`.
- Le smoke `vision.smoke.spec.ts` prouve visible vs fogged pour deux villages joueurs.
- `WorldEntity` reste en place mais marquee deprecated ; suppression suivie par le ticket 64.
- Tests : preflight smoke, smoke cible, smokes backend complets et `yarn static-check` verts.
- Docs : mise a jour `docs/architecture/worktree-dev.md` pour le probleme recurrent `packages/shared/dist` absent + `.tsbuildinfo` stale. Le contrat gameplay/API etait deja documente ; le changement restaure ce contrat. Un follow-up task couvre la dette schema.
