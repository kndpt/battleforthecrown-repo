# Ticket 32 — unlockCastleLevel source unique

## Plan

- [x] Préflight : repo clean, ticket ouvert, spec/rules relues.
- [x] Cartographier les exports `BUILDING_DEFINITIONS`, `BUILDING_UNLOCK_REQUIREMENTS` et les tests existants.
- [x] Dériver `BUILDING_UNLOCK_REQUIREMENTS` depuis `BUILDING_DEFINITIONS` en conservant l'API publique.
- [x] Vérifier typage/tests, review 5 axes et impact docs.
- [x] Archiver le ticket, mettre à jour `tasks/README.md` et commit.

## Review

- Correctness : aucun finding bloquant ou majeur. `BUILDING_UNLOCK_REQUIREMENTS` conserve son export public et se dérive de `BUILDING_DEFINITIONS`.
- Readability : typage explicite des entrées de catalogue, test de contrat ciblé.
- Architecture : source unique pour `unlockCastleLevel`; le record public devient une vue dérivée.
- Security : aucun impact.
- Performance : coût négligeable à l'import uniquement.
- Vérifications : build shared vert, tests backend verts.
- Docs : aucun changement nécessaire, raison : refacto interne d'un helper shared sans changement de mécanique ni API documentée.
