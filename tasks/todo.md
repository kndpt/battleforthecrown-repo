# Run ticket 38 — Barbarian combat real resolution

## Plan

- [x] Preflight: verifier worktree clean, ticket, spec, rules, skills.
- [x] Cartographier `BarbarianVillageStrategy`, `PlayerVillageStrategy`, le worker combat et le runtime troupes barbares.
- [x] Implementer la resolution combat barbare via la mecanique commune, avec raid pur si garnison vide.
- [x] Ajouter ou adapter le filet de regression adapte.
- [x] Review diff, lancer les verifications cibles puis `yarn static-check`.
- [x] Verifier impact docs, archiver le ticket, mettre a jour `tasks/README.md`.
- [x] Commit final unique.

## Review

- Correctness : `BarbarianVillageStrategy` utilise maintenant la resolution combat commune ; une garnison vide reste un raid sans pertes attaquant.
- Runtime : `CombatWorker` decompte les pertes barbares dans `UnitInventory`, en plus du loot via `LootManager`.
- Architecture : la formule commune vit dans `combat-resolution.ts` et reste partagee par PvP et barbares.
- Verification : test strategie cible, smoke backend orchestration et `yarn static-check` verts.
- Docs : aucun changement necessaire, raison : les docs gameplay decrivent deja les barbares comme mini-joueurs IA et la resolution generique du combat.
