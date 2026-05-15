# 63 — Les autres joueurs n'apparaissent jamais sur la carte

**Sévérité** : 🟡 Majeure
**Statut** : 🆕 Ouvert
**Spec amont** : `archive/58-multi-village-vision-disks-missing.md` (contrat `{ entities, visionDisks, fogOfWarEnabled }`) · `archive/09-fog-of-war-coordinate-leak.md` (payload `fogged`) · `docs/gameplay/01-overview.md` § Exploration & brouillard de guerre

## Symptôme

Deux joueurs joints au même monde, villages proches, ne se voient pas sur la carte. Chaque joueur ne voit que son propre village (et les barbares). Aucun autre village joueur n'apparaît, même lorsque les positions sont à portée de Watchtower.

Corollaire observable : un village barbare conquis disparaît instantanément de la carte des autres joueurs (régression visible juste après le bascule `isBarbarian: false`).

## Cause racine

`battleforthecrown-backend/src/modules/world/world-entities-query.service.ts` lit deux sources et les fusionne :

- `prisma.worldEntity.findMany({ worldId })` — table `WorldEntity`.
- `fetchBarbarianVillages` → `prisma.village.findMany({ worldId, isBarbarian: true })`.

Or `prisma.worldEntity.(create|upsert|update)` n'apparaît **nulle part** dans `src/` (grep exhaustif). La table `WorldEntity` est lue mais jamais écrite — fonctionnalité retirée du `world.service.ts` à un moment passé sans nettoyer ni la query ni le schéma.

`JoinWorldUseCase.createInitialVillage` (`join-world.use-case.ts:104`) crée bien une `Village` joueur, mais aucune ligne miroir `WorldEntity`. Conséquence :

- `/world/:worldId/entities` ne renvoie en pratique que les barbares (table `WorldEntity` toujours vide).
- Le joueur courant voit son propre village uniquement via le canal séparé `/village?worldId&userId` (cf. `buildMapEntities.ts` qui re-merge `entities` + `myVillages` avec préséance `isMine`).
- Les villages joueur **étrangers** ne ressortent d'aucun canal → invisibles.
- Un village conquis bascule `isBarbarian: false` (`conquest.service.ts:387-395`) → sort immédiatement du filtre `fetchBarbarianVillages` → disparaît côté autres joueurs.

Le contrat frontend est cohérent : `buildMapEntities.ts:11` commente explicitement « *barbarians + foreign players* » pour le feed `/world/:worldId/entities`. Le bug est strictement backend.

`VisionService.getVisionDisks` lit directement `Village` et n'est pas impacté.

## Comportement attendu

- `GET /world/:worldId/entities` retourne, en plus des villages barbares, une entrée `kind: 'PLAYER_VILLAGE'` par village joueur (`isBarbarian: false`, `userId != null`) du monde, y compris ceux dont `userId` ≠ user appelant.
- Le `data` d'un `PLAYER_VILLAGE` expose au minimum `{ userId, name }`, et optionnellement `{ label, isCapital }` si pertinent (cf. piste à trancher).
- Pour un autre joueur **hors vision** : passage standard par `VisionService.applyFogOfWar` → `{ kind: 'fogged', id, x, y }`.
- Pour un autre joueur **dans la vision** : payload complet `PLAYER_VILLAGE`.
- Un village conquis (barbare → joueur, ou PvP) reste visible pour les autres joueurs ayant le village dans leur vision.

## Pistes

### A — Restaurer l'écriture `WorldEntity` aux points de lifecycle

Ajouter `prisma.worldEntity.create / upsert / delete` dans `JoinWorldUseCase` (création), `ConquestService` (bascule barbare → joueur, transfert PvP), `ResetWorldUseCase` (suppression), et tout futur chemin lifecycle.

- ❌ Invariant fragile : chaque nouveau chemin de création/mutation/suppression de village doit y penser.
- ❌ Historique défavorable : le `createMany` initial a déjà disparu une fois sans alerte.
- ❌ Risque de désync transactionnelle entre `Village` et `WorldEntity`.

### B — Lire directement `Village` dans `WorldEntitiesQueryService` (recommandée)

Ajouter `fetchPlayerVillages(worldId, kinds, bounds?)` calqué sur `fetchBarbarianVillages`, filtre `{ worldId, isBarbarian: false, userId: { not: null }, ...bounds }`, projette en `kind: 'PLAYER_VILLAGE'`. Brancher dans `getAllEntities` et `getEntitiesInRadius`.

- ✅ Source unique de vérité = `Village`.
- ✅ Aucun invariant transactionnel à maintenir.
- ✅ Couvre automatiquement Join, Conquest (barbare → joueur), transfert PvP, Reset, et tout futur lifecycle.
- ⚠️ Aligner précisément le shape `data` avec ce qu'attend `entityFromWorldDto` (front).
- ⚠️ Note : `WorldEntity` devient confirmée morte → ticket follow-up de suppression (hors scope).

## Scope recommandé

### Backend

1. `world-entities-query.service.ts` : nouvelle méthode privée `fetchPlayerVillages(worldId, kinds, bounds?)` calquée sur `fetchBarbarianVillages`. Filtre `{ isBarbarian: false, userId: { not: null } }`. Projette `{ id, worldId, kind: 'PLAYER_VILLAGE', x, y, data: { userId, name, label?, isCapital? } }`.
2. Brancher dans `getAllEntities` et `getEntitiesInRadius`. Tri final `byCoord` préservé.
3. Vérifier que `WorldEntity` morte ne casse pas le smoke / les seeds — la garder en place (commentaire deprecated dans `schema.prisma`).
4. Trancher exposition `label` / `isCapital` aux autres joueurs : payload complet + filtrage front (`entityFromWorldDto` filtre déjà via `ownerId === myUserId`) **ou** filtrage backend conditionnel sur `userId === appelant`.

### Frontend

- Aucun changement code attendu. `buildMapEntities` + `entityFromWorldDto` consomment déjà ce shape.
- Vérifier `ws-bindings.ts` : `village.conquered` doit invalider `queryKeys.worldEntities` chez les autres joueurs pour rafraîchir la carte.

### Shared

- Vérifier que `WorldEntityKind` dans `packages/shared/src/world/entities.ts` déclare bien `'PLAYER_VILLAGE'` (probablement déjà fait).

### Tests

- Unit `world-entities-query.service.spec.ts` : couverture du nouveau path joueurs (2 users, A appelle, voit le village de B en `PLAYER_VILLAGE`).
- Smoke régression conquête : user A conquiert village barbare → user C (dans vision) voit le village en `PLAYER_VILLAGE` après bascule.

### Docs

- Si `entityFromWorldDto` filtre côté backend `label`/`isCapital`, documenter la convention (privé propriétaire) dans `docs/architecture/realtime.md` ou ADR.
- Ouvrir un follow-up note pour suppression future de la table `WorldEntity` (migration + retrait du model + retrait du `worldEntities: WorldEntity[]` côté `World`).

## Critères de succès

- 2 comptes A et B joints au même monde, villages proches : B voit le village de A sur la carte (et inversement), en `PLAYER_VILLAGE` dans la vision, `fogged` hors vision.
- Un village barbare conquis reste visible pour les autres joueurs ayant le village dans leur vision.
- `GET /world/:worldId/entities` renvoie une entrée par village joueur du monde (sous réserve du fog).
- Aucune nouvelle migration Prisma.
- `yarn static-check` vert.
- Tests unit ajoutés sur `world-entities-query.service.spec.ts`.
- QA IG 2 comptes validée (checklist actions in-game).

## Points d'attention

- Coût query : `getAllEntities` fait maintenant 2 queries `Village` (barbares + joueurs). Possibilité d'unifier en une seule `findMany` + split en mémoire si perf devient un sujet (pas un blocker MVP).
- Exposition `label` / `isCapital` aux autres joueurs : trancher avec user au moment du run.
- Le `WorldEntity` deprecated mérite un commentaire dans `schema.prisma` pour éviter qu'un futur agent ne tente de l'écrire à nouveau.
