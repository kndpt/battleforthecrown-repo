# Run ticket 42 - Combat conquest hook

## Plan

- [x] Preflight: verifier worktree clean, ticket, specs, rules, briefings et skills requis.
- [x] Cartographier CombatWorker, ConquestService, events shared/outbox, schema Prisma et smokes existants.
- [x] Implementer le hook post-combat: ouverture PendingConquest, Seigneur immobilise, event noble.killed, interruption fenetre.
- [x] Ajouter/adapter smoke backend pour les scenarios du ticket.
- [x] Review 5 axes, corriger findings, lancer tests cibles puis `yarn static-check`.
- [x] Verifier impact docs, archiver le ticket, mettre a jour `tasks/README.md`.
- [ ] Commit final unique.

## Review

- Correctness : `CombatWorker` ouvre `PendingConquest` seulement si victoire + Seigneur survivant, retire le NOBLE du retour et le stationne en garnison cible.
- Correctness : une attaque hostile qui tue le NOBLE de garnison interrompt la fenetre; `conquest:finalize` reste no-op si statut `INTERRUPTED`.
- Correctness : branche `noble.killed` cablee, mais scenario "armee gagne + Seigneur unique mort" reste non atteignable avec l'algo actuel `floor(1 * lossRatio)` en victoire.
- Readability : pertes defenseur mutualisees via helper, durees capture explicites par tier/niveau Chateau.
- Architecture : event `noble.killed` ajoute au contrat shared + outbox + binding Pixi; docs realtime/data-model mises a jour.
- Security : notifications routees par `attackerUserId`, pas via ownership mutable du village cible.
- Performance : lectures bornees aux participants/garnisons de la cible; pas de scan global.
- Verification : smokes `combat-conquest-hook` + `conquest-finalize`, `yarn static-check` verts.
