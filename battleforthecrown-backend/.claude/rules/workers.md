# Workers (pg-boss) + Pattern Outbox

## Stack

- **pg-boss** : queue de jobs PostgreSQL-backed, branchée sur la même DB que Prisma.
- Module global : `infra/pg-boss/pg-boss.module.ts` expose `'PG_BOSS'` injectable.
- Workers dans `src/workers/` + workers spécifiques aux modules (ex : `combat.worker.ts`, `return.worker.ts`, `barbarian-backfill.worker.ts`).

## Workers actifs

| Worker | Module | Rôle |
|--------|--------|------|
| `ProductionWorker` | `workers/` | Tick périodique → produit ressources (bois/pierre/fer) selon `getBuildingProduction` × multiplicateurs monde |
| `ConstructionWorker` | `workers/` | Finalise un upgrade quand `BuildingQueue.completesAt` est atteint |
| `TrainingWorker` | `workers/` | Finalise un entraînement de troupes (`TrainingQueue`) |
| `CrownProductionWorker` | `workers/` | Production passive de couronnes |
| `OutboxWorker` | `workers/` | Lit `EventOutbox` non traités → diffuse via `event/game.gateway.ts` |
| `CombatWorker` | `combat/` | Résout un combat après le temps de trajet, calcule butin |
| `ReturnWorker` | `combat/` | Retourne l'armée au village d'origine après combat |
| `BarbarianBackfillWorker` | `world/` | Reseed les villages barbares détruits/conquis |

## Convention worker

- ✅ Un worker = un fichier dédié (`<nom>.worker.ts`).
- ✅ Implémenter `OnModuleInit` pour s'abonner à pg-boss au démarrage du module.
- ✅ Injection : `@Inject('PG_BOSS') private readonly boss: PgBoss`.
- ✅ Pattern d'écoute :

```typescript
async onModuleInit() {
  await this.boss.work<MyJobPayload>('my-job', async (job) => {
    try {
      await this.handle(job.data);
    } catch (err) {
      this.logger.error({ err, job: job.id }, 'job failed');
      throw err; // pg-boss gère le retry
    }
  });
}
```

- ✅ **Erreurs isolées** : un job qui échoue ne doit jamais tuer le worker, encore moins le process. Try/catch ou laisser pg-boss retry selon la config du job.
- ✅ Tests unitaires (`*.worker.spec.ts`) : mocker pg-boss et Prisma, valider le handler isolé.

## Pattern Outbox (critique)

### Pourquoi

Garantir la cohérence entre **mise à jour DB** et **notification temps réel**. Sans Outbox, deux risques :
- WS émis avant que la transaction commit → frontend voit un état qui n'existe pas en DB.
- Transaction commit puis crash avant émission WS → frontend ne sait pas que la mutation a réussi.

### Comment

Le service métier qui modifie la DB **insère aussi un `EventOutbox`** dans la même transaction Prisma :

```typescript
await this.prisma.$transaction(async (tx) => {
  const updated = await tx.village.update({
    where: { id: villageId },
    data: { /* ... */ },
  });

  await tx.eventOutbox.create({
    data: {
      type: 'building.completed',
      worldId,
      payload: { villageId, buildingId, level },
    },
  });

  return updated;
});
```

L'`OutboxWorker` poll `EventOutbox` toutes les ~1s, prend les rangs `processedAt = null`, demande à `GameGateway` de diffuser via Socket.IO, puis marque `processedAt = now`.

### Garanties

- **Atomique** : si la mutation échoue, l'event n'est pas créé → frontend ne reçoit rien (cohérent).
- **Découplé** : le service métier ne dépend pas de Socket.IO ; il écrit en DB et c'est tout.
- **Rejouable** : si le worker crash après lecture mais avant `processedAt`, l'event sera relu à la prochaine itération (idempotent côté frontend recommandé).
- **Latence** : 0–1 s entre la mutation et la réception WS.

### Types d'événements

Définis dans `event/event-types.ts`. Quelques exemples :

- `building.completed` — fin d'upgrade
- `training.completed` — fin d'entraînement de troupes
- `resources.changed` — tick production
- `crowns.changed` — production passive crowns
- `battle.sent` / `battle.resolved` / `battle.returned` — flow combat
- `village.attacked` / `village.conquered` — notifications combat side
- `player.died` — élimination

Tout nouveau type d'event WS = ajout dans `event-types.ts` + type côté frontend (`battleforthecrown-pixi/src/api/ws-bindings.ts` notamment).

### Composants

- **`EventOutboxService`** (`event/event-outbox.service.ts`) : helper pour créer un event dans une transaction.
- **`GameGateway`** (`event/game.gateway.ts`) : gateway WebSocket, vérifie le JWT au handshake, route les events par `worldId` / `userId`.
- **`OutboxWorker`** (`workers/outbox.worker.ts`) : poll + diffuse + marque traité.

## Tick de production

`ProductionWorker` tourne en boucle (job récurrent pg-boss). Chaque tick :

1. Lit tous les `Village` actifs.
2. Pour chaque : calcule `produced = productionRate × deltaSeconds × worldMultiplier` capé à `warehouseCapacity`.
3. Update atomique des ressources + écrit `resources.changed` dans Outbox.
4. **Toutes les mutations passent par une seule `$transaction` par tranche de villages** (batching).

⚠️ Le tick ne calcule **pas** la valeur affichée au joueur en temps réel — le frontend interpole entre deux ticks. La valeur DB est rafraîchie périodiquement (~1 min de plage typique).

## Pièges connus

- **Job qui s'auto-replanifie** : si le handler ne termine pas avant l'expiration pg-boss, le job est rejoué. Bien dimensionner `expireInSeconds` selon la durée réelle du traitement.
- **Worker bloqué sur Prisma** : un `findMany` lourd peut faire dépasser le `expireInSeconds`. Préférer batches paginés.
- **Drift entre tick production et résolution combat** : le combat lit les ressources DB, le tick met à jour les ressources DB. Si les deux tournent en parallèle sur le même village, prendre un lock ou utiliser une transaction `Serializable` selon le scénario.
