# Run 025 - origin-anchored army power

- [x] Préflight `$bftc-plan` : git clean, conventions tasks/runs lues.
- [x] Scan tickets/runs liés : 067, 029, 010/033, 011, 054/018.
- [x] Draft validé par user : artefact run, ID 025.
- [x] Fiche créée : `tasks/runs/025-fix-origin-anchored-army-power.md`.
- [x] Index mis à jour : `tasks/README.md`.
- [x] Commit worktree créé : `87284ff docs(tasks): plan origin-anchored army power run`.

## Notes

- Décision gameplay : la puissance armée est rattachée au village d'origine, pas à la position physique.
- Merge sur `main` en cours depuis `87284ff`.
## Run 025 — fix origin-anchored army power

- [x] Préflight : worktree clean, fiche `PLANNED`, règles/specs lues.
- [x] Cartographie : `PowerService` ne comptait que `UnitInventory`; renforts et expéditions actifs absents du calcul.
- [x] Implémenter calcul de puissance armée par village d'origine.
- [x] Ajouter la réactivité front pour pertes de renforts d'origine distante.
- [x] Ajouter smokes backend ciblés.
- [x] Mettre à jour docs/run, archiver, vérifier et commit.

### Review

- Correctness : calcul origin-anchored couvert par smokes attaque/scout/renfort.
- Readability : helpers locaux dans `PowerService`, pas de changement de modèle.
- Architecture : backend server-authoritative ; event Outbox enrichi sans publication directe.
- Security : aucun nouveau secret ni endpoint public élargi.
- Performance : agrégation batchée par liste de villages pour kingdom/leaderboard.
