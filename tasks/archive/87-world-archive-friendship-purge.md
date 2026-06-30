# 87 — Wipe ENDED→ARCHIVED ne purge pas la table `Friendship`

**Sévérité** : 🟡 Majeur
**Statut** : ✅ DONE (2026-06-29)
**Spec amont** : [`19-world-lifecycle.md`](../docs/gameplay/19-world-lifecycle.md) § Archive — wipe destructeur (run 065)

## Symptôme

Après archivage d'un monde (`ENDED → ARCHIVED`), les lignes `Friendship` du monde **survivent** au wipe destructeur. Données joueur world-scoped orphelines persistantes sur un monde archivé.

## Cause racine

`WorldLifecycleWorker.archiveWorld` (run 065, `world-lifecycle.worker.ts:384`) a été écrit **avant** que la table `Friendship` (run 063) existe. La purge se fait via `deleteMany` explicites par table `worldId`-dénormalisée ; `Friendship` n'y figure pas.

`Friendship` (`schema.prisma:775`) cascade uniquement sur `World`/`User` delete. Or au wipe :
- le `World` est **conservé** (status → `ARCHIVED`) → cascade World jamais déclenchée ;
- les `User` ne sont pas supprimés → cascade User jamais déclenchée.

→ les `Friendship` du monde restent en base indéfiniment.

## Comportement attendu

- À l'archivage, toutes les `Friendship` du monde sont supprimées dans la même transaction de purge, comme les autres tables `worldId`-dénormalisées (`Expedition`, `VillageIntel`, `MapMarker`, …).

## Scope recommandé

### Backend

- `battleforthecrown-backend/src/workers/world-lifecycle.worker.ts` : ajouter `await tx.friendship.deleteMany({ where: { worldId } });` dans la transaction `archiveWorld`.

### Tests

- `battleforthecrown-backend/test/world-archive.smoke.spec.ts` : seed une `Friendship` entre les 2 membres, assert pré-wipe count = 1 et post-wipe count = 0.

### Docs

- `docs/gameplay/19-world-lifecycle.md` : ajouter `Friendship` à la liste des entités purgées.

## Critères de succès

- [x] `friendship.deleteMany({ where: { worldId } })` présent dans `archiveWorld`.
- [x] Smoke `world-archive` couvre la purge `Friendship` (pré = 1, post = 0).
- [x] Doc lifecycle à jour.
- [x] `yarn static-check` vert.

## Résolution

- `archiveWorld` (`world-lifecycle.worker.ts`) : ajout `await tx.friendship.deleteMany({ where: { worldId } })` dans la tx de purge, avec commentaire sur le piège cascade (World conservé).
- Smoke `world-archive.smoke.spec.ts` : seed `Friendship` ACTIVE entre les 2 membres, assert pré-wipe = 1 / post-wipe = 0.
- Doc `19-world-lifecycle.md` : « amis défensifs » ajouté aux exemples d'entités purgées.
- Vérifié : `yarn static-check` + smoke `world-archive lifecycle` (2/2) verts.
