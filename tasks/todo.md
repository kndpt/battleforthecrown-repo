# Run ticket 41 - Capture window data model

## Plan

- [x] Preflight: verifier worktree clean, ticket, specs, rules, briefings et skills requis.
- [x] Cartographier schema Prisma, ConquestService, pg-boss workers, Outbox/event bindings et smokes existants.
- [x] Refiner le scope exact: migration `PendingConquest`, APIs service, worker `conquest:finalize`, events et tests.
- [x] Implementer le modele DB + generation Prisma.
- [x] Implementer ouverture/interruption/finalisation de capture et events Outbox.
- [x] Ajouter le smoke backend adapte.
- [x] Review 5 axes, corriger findings, lancer preflight/smokes cibles puis `yarn static-check`.
- [x] Verifier impact docs, archiver le ticket, mettre a jour `tasks/README.md`.
- [ ] Commit final unique.

## Review

- Correctness : `PendingConquest` porte une fenetre durable, finalisee par pg-boss si `OPEN`, ignoree si `INTERRUPTED`.
- Readability : orchestration concentree dans `ConquestService`, worker fin et idempotent.
- Architecture : events Outbox typés shared + bindings Pixi ; migration non destructive ; index unique partiel pour une seule fenetre active par cible.
- Security : notifications capture routées vers l'`attackerUserId`/`newOwnerUserId` figes, pas vers le proprietaire courant d'un village mutable.
- Performance : worker charge une conquete par job, indexes `captureUntil/status`, `worldId/status`, `targetVillageId/status`.
- Verification : smoke `conquest-finalize`, smoke legacy `conquest`, `yarn static-check` verts.
- Docs : mises a jour `docs/architecture/data-model.md` et `docs/architecture/realtime.md`.
