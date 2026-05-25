# 034 fix world-scoped player data

- [x] Preflight: git clean, fiche run, rules, SPEC, docs source.
- [x] Cartographier les surfaces user-scoped visibles joueur backend et Pixi.
- [x] Raffiner les corrections world-scoped power/reports/cache.
- [x] Implémenter backend: power + combat/scout reports scoppés au monde courant.
- [x] Implémenter Pixi: query keys et invalidations scoppées au monde courant.
- [x] Ajouter/adapter le filet de regression backend/Pixi.
- [x] Review lead 5 axes + review indépendante obligatoire.
- [x] Retest: smokes backend, tests ciblés, static-check.
- [x] Vérifier impact docs/SPEC, archiver la fiche, mettre à jour tasks/README.

## Review

- Power kingdom, leaderboard public et kingdom public sont scoppés par monde.
- Combat/scout reports listes, détails, read et delete refusent le cross-world.
- Query keys Pixi reports/power incluent `worldId`; les invalidations WS ciblent le monde courant.
- Smoke ciblé et smoke backend complet verts; static-check vert.
- Docs architecture + SPEC V3 mis à jour.
