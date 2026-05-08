# Temps réel — Outbox + WebSocket

## Vue d'ensemble

Le backend est **server-authoritative** : ressources, files, expéditions, soldes, tout est calculé côté serveur. Le frontend Pixi observe via deux canaux :

1. **REST** (TanStack Query) — fetch initial + invalidations sur événement.
2. **Socket.IO** — événements temps réel poussés par le backend via le pattern Outbox.

```
[Service métier]  ──tx──▶  [DB: row + EventOutbox]
                                    │
                                    │ poll ~1s
                                    ▼
                           [OutboxWorker]
                                    │
                                    ▼
                          [GameGateway WS]
                                    │
                                    ▼
                          Frontend Pixi
                          (ws-bindings.ts)
                                    │
                                    ▼
                  TanStack Query invalidate + Zustand update
```

Détail du pattern et garanties dans [`battleforthecrown-backend/.claude/rules/workers.md`](../../battleforthecrown-backend/.claude/rules/workers.md).

## Latence typique

- Mutation commit → event dans `EventOutbox` : 0 ms (même transaction).
- Event dans Outbox → diffusion WS : **0 à ~1 s** (poll worker).
- Diffusion WS → handler frontend : ~10 ms réseau local, ~50–200 ms réseau réel.

**Total : ~1 s en moyenne** entre l'action serveur et la mise à jour visible côté joueur. Pour les valeurs continues (ressources/heure), le frontend interpole entre deux events pour un rendu fluide à 60 fps.

## Authentification WebSocket

JWT passé via `socket.handshake.auth.token` :

```typescript
// frontend
const socket = io(WS_URL, { auth: { token: jwtToken } });
```

```typescript
// backend — game.gateway.ts
@SubscribeMessage(...)
handleConnection(client: Socket) {
  const payload = this.jwtService.verify(client.handshake.auth.token);
  client.data.userId = payload.sub;
  // ...
}
```

Sur 401 (token expiré), le frontend rafraîchit via REST puis se reconnecte avec le nouveau JWT.

## Cycle de vie côté frontend — `AuthenticatedShell`

La WebSocket vit dans `battleforthecrown-pixi/src/features/layout/AuthenticatedShell.tsx`, monté **une seule fois** au-dessus de toutes les routes protégées via `<Outlet />` (cf. `App.tsx`, ADR-13). Le shell est l'unique owner de :

- `gameSocket.connect(accessToken)` / `disconnect()` (lifecycle WS).
- `gameSocket.joinWorld(worldId)` au passage `connecting → connected`.
- `bindServerEvents({ queryClient })` — wire des events serveur vers stores + invalidations TanStack.
- Seeding initial des stores Zustand (`resources`, `crowns`, `worldMap`, `expeditions`) depuis les queries REST.

**Règle pour ajouter un écran protégé** : le placer sous `<Route element={<AuthenticatedShell />}>` dans `App.tsx`. Ne **jamais** re-wrapper l'écran lui-même avec un composant qui (re)connecte la WS — cela démonterait le shell à chaque navigation et ferait cycler la connexion (régression historique du défunt `GameSession`, cf. ticket d'audit 13).

## Routing par scope

Chaque event a un scope :

- **`worldId`** — broadcast à tous les joueurs du monde (ex : `village.conquered` qui change la carte du monde pour tout le monde).
- **`userId`** — push au seul joueur concerné (ex : `crowns.changed`, `building.completed`).

Côté gateway, ça se traduit par des rooms Socket.IO :

```typescript
client.join(`world:${worldId}`);
client.join(`user:${userId}`);

// puis
this.server.to(`user:${userId}`).emit('crowns.changed', payload);
```

## Catalogue d'événements

Source de vérité runtime : `EVENT_PAYLOAD_SCHEMAS` dans [`packages/shared/src/events/schemas.ts`](../../packages/shared/src/events/schemas.ts) (Zod, 1 schema par `kind`). Types TypeScript : [`packages/shared/src/events/types.ts`](../../packages/shared/src/events/types.ts). Bindings frontend : `battleforthecrown-pixi/src/api/ws-bindings.ts`.

Chaque payload est validé runtime par `parseEventPayload(kind, raw)` (backend `event/codecs/payload.codec.ts`) au moment du dispatch — un payload mal formé en DB est détecté et loggé au lieu d'être propagé silencieusement.

| Event | Scope | Champs principaux du payload | Déclencheur backend |
|-------|-------|------------------------------|---------------------|
| `resources.changed` | `userId` | `villageId, wood, stone, iron, maxPerType, lastUpdateTs, productionRates` | `ProductionWorker` tick + `OutboxPublisher.resourcesChanged` |
| `building.completed` | `userId` | `buildingId, villageId, buildingType, level` | `ConstructionWorker` |
| `unit.training.completed` | `userId` | `trainingId, villageId, unitType, completedQty, totalQty` | `TrainingWorker` |
| `crowns.changed` | `userId` | `userId, worldId, balance, productionRate, lastUpdateTs` | `CrownProductionWorker` + transactions |
| `battle.sent` | `userId` (attaquant) | `expeditionId, villageId, targetX, targetY, targetKind, arrivalAt` | `CombatService.initiateAttack` |
| `battle.resolved` | `userId` (les 2 camps) | `expeditionId, reportId, villageId, isVictory, loot, lossesAttacker (UnitMap), survivingUnits (UnitMap), casualtyRate, returnAt, …` | `CombatWorker` |
| `battle.returned` | `userId` (attaquant) | `expeditionId, reportId, villageId, survivingUnits (UnitMap), loot` | `ReturnWorker` |
| `village.attacked` | `userId` (défenseur) | `defenderVillageId, attackerVillageId, attackerVillageName, isDefenseSuccessful, losses (UnitMap), casualtyRate, resourcesLost, …` | `CombatWorker` (notification) |
| `village.conquered` | `worldId` | `villageId, newOwnerId, previousTier, x, y, buildingsKept` | `ConquestService` |

## Patterns côté frontend

Pour chaque event, deux opérations typiques :

```typescript
// ws-bindings.ts (extrait conceptuel)
socket.on('crowns.changed', (payload) => {
  // 1. Mise à jour immédiate du store Zustand pour le rendu
  useCrownsStore.getState().setBalance(payload.balance);

  // 2. Invalidation TanStack pour que les composants qui lisent par REST
  //    refetch quand ils réapparaîtront
  queryClient.invalidateQueries({ queryKey: ['crowns', userId] });
});
```

⚠️ Ne **jamais** calculer une valeur "autoritative" côté front. Sur action user → mutation REST → invalidate → laisser REST + WS resynchroniser.

## Idempotence et rejouabilité

L'`OutboxWorker` peut rejouer un event si le marquage `processedAt` échoue après l'émission (très rare mais possible). Côté frontend :

- Update de store : write idempotent (par ID).
- Toast / notification : potentiellement duppliqué — accepté pour l'instant. Si critique, dédupliquer par event ID côté front.

## Reconnection

`socket.io` gère la reconnection automatique. Au reconnect :

1. Le frontend refetch les queries critiques (`village/buildings`, `army/inventory`, `crowns`, `expeditions`) via TanStack `refetchOnReconnect: true`.
2. Les events manqués ne sont pas rejoués — la resync REST couvre le delta.

Le store `gameSocket` (FSM) expose `subscribeStatus()` consommé par `useGameSocketStatus()` côté HUD pour la pastille de connexion.
