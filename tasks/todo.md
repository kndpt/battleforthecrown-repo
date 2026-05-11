# Run ticket 39 - Combat report asymmetric defeat

## Plan

- [x] Preflight: verifier worktree clean, ticket, spec, rules et briefings.
- [x] Cartographier le flux lecture `CombatReport` backend et l'affichage Pixi.
- [x] Implementer le masquage a la lecture pour les defaites attaquant vs village barbare.
- [x] Ajouter le filet de regression adapte.
- [x] Review diff, lancer les verifications cibles puis `yarn static-check`.
- [x] Verifier impact docs, archiver le ticket, mettre a jour `tasks/README.md`.
- [x] Commit final unique.

## Review

- Correctness : `presentCombatReport` masque loot, troupes/pertes defenseur et details techniques uniquement pour une defaite attaquant contre un village barbare.
- Readability : logique de visibilite centralisee dans un presenter pur, service simplifie.
- Architecture : stockage DB exhaustif conserve ; asymetrie appliquee au DTO de lecture.
- Security : la reponse REST ne divulgue plus les ressources ou la garnison barbare apres defaite.
- Performance : projection in-memory O(1) par rapport, aucun acces DB supplementaire.
- Verification : test presenter cible et `yarn static-check` verts.
- Docs : aucun changement necessaire, raison : la spec gameplay decrit deja l'asymetrie ; le changement aligne le code sur cette source.
