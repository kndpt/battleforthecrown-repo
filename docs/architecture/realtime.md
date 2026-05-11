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

Détail opérationnel du pattern et des pièges worker dans le skill [`bftc-workers-outbox`](../../.agents/skills/bftc-workers-outbox/SKILL.md).

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
| `resources.changed` | `userId` | `villageId, wood, stone, iron, maxPerType, lastUpdateTs, productionRates` | `OutboxPublisher.resourcesChanged` (upgrade-building, recruit-troops, cancel-construction, cancel-recruitment, construction worker quand un producer/warehouse complète, `combat.worker.ts` quand le défenseur est pillé, `return.worker.ts` quand l'attaquant récupère son butin). **Pas le `ProductionWorker` tick** — cf. § Exceptions au pattern Outbox. |
| `building.completed` | `userId` | `buildingId, villageId, buildingType, level` | `ConstructionWorker` |
| `unit.training.completed` | `userId` | `trainingId, villageId, unitType, completedQty, totalQty` | `TrainingWorker` |
| `crowns.changed` | `userId` | `userId, worldId, balance, productionRate, lastUpdateTs` | `CrownProductionWorker` (chaque tick, par membership active) + `CrownsService.updateProduction` quand transaction crowns |
| `battle.sent` | `userId` (attaquant) | `expeditionId, villageId, targetX, targetY, targetKind, arrivalAt` | `CombatService.initiateAttack` |
| `battle.resolved` | `userId` (les 2 camps) | `expeditionId, reportId, villageId, isVictory, loot, lossesAttacker (UnitMap), survivingUnits (UnitMap), casualtyRate, returnAt, …` | `CombatWorker` |
| `battle.returned` | `userId` (attaquant) | `expeditionId, reportId` (nullable si le rapport a été supprimé), `villageId, survivingUnits (UnitMap), loot` | `ReturnWorker` |
| `reinforcement.sent` | `userId` (village d'origine) | `expeditionId, villageId, targetVillageId, arrivalAt` | `CombatService.initiateReinforce` |
| `reinforcement.recalled` | `userId` (village hôte ou d'origine) | `expeditionId, villageId, originVillageId, arrivalAt` | `CombatService.initiateRecall` |
| `reinforcement.returned` | `userId` (village hôte ou d'origine) | `expeditionId, villageId, originVillageId, units` | `CombatWorker` quand un renfort repart vers son village d'origine |
| `garrison.added` | `userId` (village hôte) | `villageId, originVillageId, units` | `CombatWorker` quand un renfort arrive et se stationne en garnison |
| `village.attacked` | `userId` (défenseur) | `defenderVillageId, attackerVillageId, attackerVillageName, isDefenseSuccessful, losses (UnitMap), casualtyRate, resourcesLost, …` | `CombatWorker` (notification) |
| `village.capture-window-opened` | `userId` (attaquant) | `pendingConquestId, targetVillageId, attackerVillageId, captureUntil` | `ConquestService.openCaptureWindow` |
| `village.capture-window-completed` | `userId` (nouveau propriétaire) | `pendingConquestId, targetVillageId, newOwnerUserId` | `ConquestFinalizeWorker` via `ConquestService.finalizeCaptureWindow` |
| `village.capture-window-interrupted` | `userId` (attaquant) | `pendingConquestId, targetVillageId, reason` | `ConquestService.interruptCaptureWindow` |
| `village.conquered` | `userId` (nouveau propriétaire) | `villageId, newOwnerId, previousTier, x, y, buildingsKept` | `ConquestService` |

Pour les renforts, la forme exacte des payloads reste dérivée des schémas partagés (`packages/shared/src/events/{schemas,types}.ts`). Cette table ne liste que les champs discriminants utiles pour lire le flux fonctionnel.

## Exceptions au pattern Outbox

Deux workers font des mutations DB **sans** écrire dans `EventOutbox`. C'est intentionnel — les documenter ici évite que le prochain dev les prenne pour des oublis et "corrige" au mauvais endroit.

### `ProductionWorker` (`src/workers/production.worker.ts`)

Tick horaire qui appelle `resourcesService.updateProduction(villageId)` pour chaque village joueur (`isBarbarian=false`). Cette méthode rafraîchit `ResourceStock` (wood/stone/iron/`lastUpdateTs`) **sans émettre `resources.changed`**.

**Pourquoi** : le frontend interpole les ressources entre deux events via `projectResources` (`battleforthecrown-pixi/src/lib/interpolation.ts`). Tant que `productionRates` et `maxPerType` ne changent pas, l'interpolation est mathématiquement identique au calcul backend. Tout changement de rate déclenche déjà un event (`building.completed` invalide la query, `construction.worker.ts` émet `resources.changed` quand un producer ou un WAREHOUSE complète). Émettre N events × N villages × 1 tick/h ajouterait du noise WS sans valeur user-visible.

Le tick joue donc deux rôles découplés du WS pour les villages joueurs :
1. **Catchup DB périodique** pour que `lastUpdateTs` ne dérive pas trop quand un joueur reste connecté sans muter.
2. **Backstop** pour le combat : `calculateCurrentResources` lit `lastUpdateTs` et calcule le pull à partir de là — la valeur est correcte même sans tick récent (cf. aussi le catchup automatique de `getResources` quand `elapsedMs > PRODUCTION_CATCHUP_THRESHOLD_MS`).

Les villages barbares sont exclus de ce worker : leur stock ressources et leurs troupes sont régénérés par `BarbarianRuntimeService.catchUpVillage()` en lazy-on-read, avec `ResourceStock.lastUpdateTs` pour les ressources et `Village.barbarianTroopsLastRegenTs` pour les troupes. Cela évite du travail périodique sur les BV jamais consultés et garde les deux rythmes de régénération indépendants.

### `BarbarianSeedingCatchupWorker` (`src/modules/world/barbarian-seeding-catchup.worker.ts`)

Cron quotidien (minuit UTC) — catchup d'arrivée différée. Quand un joueur rejoint un monde, `/world/:worldId/join` seed les 4 chunks les plus proches en sync (MAX_SYNC_CHUNKS=4). Ce worker rattrape les chunks restants en appelant `seedAroundVillage()` autour des villages joueurs créés dans la dernière heure. Crée des `Village { isBarbarian: true }` + buildings/stocks via la factory, **sans event Outbox**.

**Pourquoi** : le frontend fait `useWorldEntitiesQuery` avec `refetchInterval: 30_000` + `staleTime: 30_000` (`battleforthecrown-pixi/src/api/queries.ts`). Donc une nouvelle BV apparaît dans la map en ≤ 30 s sans qu'on ait besoin d'event. Ajouter un event `world.barbarians.seeded` coûterait un nouveau `kind`, un binding pixi et un handler — pour économiser 0 à 30 s d'attente sur un event qui se déclenche 1×/jour à minuit UTC quand la quasi-totalité des joueurs ne regardent pas la map. Pas le bon ratio.

### Asymétrie volontaire avec `CrownProductionWorker`

Contrairement aux deux exceptions ci-dessus, `CrownProductionWorker` **émet** `crowns.changed` à chaque tick — mais **uniquement quand `production > 0`** (cf. `crowns.service.ts` § `updateProduction`). Justification :
- Granularité 5 min vs 60 min → besoin de feedback plus précis pour le solde affiché en HUD.
- Scope par membership active (≪ #villages totaux) → noise WS borné par #joueurs connectés récemment, pas par la taille du monde.
- Skip quand `production = 0` (rate = 0, ou `Math.floor(rate × elapsedHours)` = 0) → pas de noise WS quand rien n'a changé. L'interpolation `projectCrowns` côté front (`battleforthecrown-pixi/src/lib/interpolation.ts`) suffit à maintenir le HUD à jour entre deux events.

**Invariant à respecter ailleurs** : `recalculateOnBuildingChange` et **toute autre source qui mute `CrownBalance.balance`** (changement de stratégie, achats, récompenses futures) doivent émettre leur propre `crowns.changed` — sinon le HUD reste stale jusqu'au prochain tick avec `production > 0`. Aujourd'hui : `recalculateOnBuildingChange` (toujours) et `VillageStrategyService.changeStrategy` (déduction du coût). Toute nouvelle source de mutation doit ajouter son `createCrownsChangedEvent` dans la même transaction Prisma.

Si un jour le `ProductionWorker` doit émettre (parce que l'interpolation devient insuffisante, ex : variation de rate côté serveur sans mutation client), revoir cette section et le commentaire dans `production.worker.ts`.

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
