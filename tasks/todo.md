# Run tickets 36 + 37 — Barbarian runtime persistence and regeneration

## Plan

- [x] Preflight: verifier worktree clean, tickets, spec, rules, skills.
- [x] Cartographier les modeles Prisma, factory barbare, combat/scout et smokes.
- [x] Implementer la persistance runtime des troupes barbares a la creation.
- [x] Implementer la regeneration lazy-on-read des troupes et ressources barbares.
- [x] Ajouter le filet de regression adapte.
- [x] Review diff, lancer les verifications cibles puis `yarn static-check`.
- [x] Verifier impact docs, archiver les tickets, mettre a jour `tasks/README.md`.
- [ ] Commit final unique.

## Review

- Correctness : les BV crees par `BarbarianVillageFactory` ont maintenant un stock `UnitInventory` rollé a 60-100 % du blueprint max, avec `Population.used = 0`.
- Runtime : `BarbarianRuntimeService.catchUpVillage()` regenere en lazy-on-read les troupes et ressources sans depasser les caps de tier.
- Architecture : les formules pures vivent dans `packages/shared`; le `ProductionWorker` reste reserve aux villages joueurs.
- Verification : test template cible, smoke backend complet et `yarn static-check` verts.
- Docs : mises a jour `docs/architecture/{data-model,backend-modules,realtime}.md`.
