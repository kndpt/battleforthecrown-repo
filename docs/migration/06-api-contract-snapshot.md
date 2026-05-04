# 06 — Contrat API figé (snapshot)

> Snapshot de la surface API du backend NestJS au moment du démarrage de la migration.
> **Source de vérité pour la nouvelle app PixiJS pendant toute la migration.**
> En cas de drift backend détecté : update ce fichier dans le même PR que l'adaptation client.

## Auth — `/auth`

| Méthode | Path | Body | Réponse | Notes |
|---------|------|------|---------|-------|
| POST | `/auth/register` | `RegisterDto` (email, password) | `{ accessToken, refreshToken, user }` | Public |
| POST | `/auth/login` | `LoginDto` (email, password) | `{ accessToken, refreshToken, user }` | Public |
| POST | `/auth/refresh` | `RefreshDto` (refreshToken) | `{ accessToken, refreshToken }` | Auto-call sur 401 |

Validation : `ZodValidationPipe`. JWT à mettre en `Authorization: Bearer <token>` sur toutes les routes protégées et en `auth: { token }` sur le handshake Socket.IO.

## World — `/world`

| Méthode | Path | Query / Body | Notes |
|---------|------|--------------|-------|
| GET | `/world` | — | Liste tous les mondes |
| GET | `/world/:worldId/details` | — | Détails d'un monde |
| GET | `/world/:worldId/config` | — | `WorldConfig` (speed multipliers, etc.) |
| POST | `/world/seed-if-needed` | `SeedWorldDto` | Init barbares/entités |
| GET | `/world/:worldId/entities` | `?centerX&centerY&radius&kinds` | Entités (par rayon ou tout) |
| GET | `/world/entities` | (legacy, même comportement) | Backward compat |
| POST | `/world/:worldId/join` | `JoinWorldDto` | Rejoindre un monde |
| GET | `/world/users/:userId/memberships` | — | Liste des mondes du user |
| GET | `/world/:worldId/villages` | `?centerX&centerY&radius` | Villages dans une zone |

## Village — `/village`

### Queries (RTK-style query string, à privilégier)

| Méthode | Path | Query |
|---------|------|-------|
| GET | `/village` | `?worldId=&userId=` |
| GET | `/village/buildings` | `?villageId=` |
| GET | `/village/queue` | `?villageId=` |

### Mutations

| Méthode | Path | Body |
|---------|------|------|
| POST | `/village/:villageId/upgrade` | `UpgradeBuildingDto` |
| DELETE | `/village/:villageId/buildings/:buildingId/cancel` | — |

### Stratégie

| Méthode | Path | Body / Query |
|---------|------|--------------|
| GET | `/village/strategy` | `?villageId=` |
| POST | `/village/:villageId/strategy` | `ChangeStrategyDto` |
| GET | `/village/strategy/recommendations` | `?villageId=` |

## Resources — `/resources`

| Méthode | Path | Notes |
|---------|------|-------|
| GET | `/resources/:villageId` | Stock + productionRates + lastUpdate |
| POST | `/resources/:villageId/produce` | Force le recalcul |

Réponse type :
```ts
type ResourcesPayload = {
  villageId: string;
  wood: number;
  stone: number;
  iron: number;
  maxPerType: number;
  productionRates: { wood: number; stone: number; iron: number }; // par heure
  lastUpdateTs: number; // timestamp ms
};
```

## Army — `/army`

| Méthode | Path | Body |
|---------|------|------|
| GET | `/army/:villageId/inventory` | — |
| GET | `/army/:villageId/training` | — |
| POST | `/army/:villageId/train` | `TrainUnitsDto` (unitType, quantity) |
| DELETE | `/army/:villageId/training/:trainingId/cancel` | — |

Unités possibles : `MILITIA`, `SQUIRE`, `ARCHER`, `CAVALRY`, `TEMPLAR`, `CATAPULT`, `SPY`, `NOBLE`.

## Combat — `/combat`

| Méthode | Path | Body / Query | Notes |
|---------|------|--------------|-------|
| POST | `/combat/attack?userId=` | `AttackCommandDto` | Lance une attaque |
| GET | `/combat/:villageId/active?userId=` | — | Expéditions en cours |
| GET | `/combat/reports?userId=` | — | Tous les rapports |
| GET | `/combat/report/:reportId?userId=` | — | Détail d'un rapport |
| PATCH | `/combat/report/:reportId/read?userId=` | — | Marquer lu |
| DELETE | `/combat/report/:reportId?userId=` | — | Supprimer rapport |

## Crowns — `/crowns`

| Méthode | Path | Notes |
|---------|------|-------|
| GET | `/crowns/:userId/:worldId` | Balance courante |
| POST | `/crowns/:userId/:worldId/produce` | Force le recalcul |

## Population — `/population`

| Méthode | Path | Query |
|---------|------|-------|
| GET | `/population` | `?villageId=` |

## Power — `/power`

| Méthode | Path | Query |
|---------|------|-------|
| GET | `/power` | `?villageId=` |
| GET | `/power/leaderboard` | `?type=total\|kingdom\|army&limit=20` |
| GET | `/power/kingdom/:userId` | — |

---

## WebSocket (Socket.IO)

### Connexion

```ts
io(BASE_URL, {
  auth: { token: accessToken },
  transports: ['websocket'],
  reconnection: true,
});
```

JWT validé côté backend dans `client.handshake.auth?.token` ou `Authorization` header.

### Rooms

- `user:{userId}` — events personnels (auto-join à la connexion)
- `world:{worldId}` — events broadcast monde (rejoindre via `socket.emit('join:world', { worldId })`)

### Events client → serveur

| Event | Payload | Effet |
|-------|---------|-------|
| `join:world` | `{ worldId }` | Joint la room `world:{worldId}` |

### Events serveur → client

| Event | Payload (résumé) | Room |
|-------|-----------------|------|
| `building.completed` | `{ buildingId, villageId, buildingType, level }` | `user:{userId}` |
| `unit.training.started` | `{ trainingId, villageId, unitType, totalQty, completedQty, timePerUnitMs, nextUnitEta }` | `user:{userId}` |
| `unit.training.completed` | `{ trainingId, villageId, unitType, completedQty, totalQty }` | `user:{userId}` |
| `battle.sent` | `{ expeditionId, villageId, targetX, targetY, targetKind, arrivalAt }` | `user:{userId}` |
| `battle.resolved` | `{ expeditionId, reportId, villageId, villageName, targetKind, targetName, targetX, targetY, isVictory, loot, lossesAttacker, casualtyRate, survivingUnits, returnAt }` | `user:{userId}` |
| `battle.returned` | `{ expeditionId, reportId, villageId, survivingUnits, loot }` | `user:{userId}` |
| `village.attacked` | `{ defenderVillageId, attackerVillageId, attackerVillageName, attackerX, attackerY, defenderVillageName, isDefenseSuccessful, losses, casualtyRate, resourcesLost, timestamp }` | `user:{defenderId}` |
| `village.conquered` | `{ villageId, newOwnerId, previousTier, x, y, buildingsKept }` | `user:{newOwnerId}` |
| `resources.changed` | `{ villageId, wood, stone, iron, maxPerType, lastUpdateTs, productionRates }` | `user:{userId}` |
| `crowns.changed` | `{ userId, worldId, balance, productionRate, lastUpdateTs }` | `user:{userId}` |
| `village.strategy.changed` | `{ villageId, userId, oldStrategy, newStrategy, crownsCost, worldId }` | `user:{userId}` |

### Délivrance (Outbox pattern)

- Le backend écrit dans `EventOutbox` dans la même transaction que la mutation DB.
- Un worker `OutboxWorker` boucle (~1s) et émet via Socket.IO.
- **Délai attendu** : 0 à ~1s entre la mutation et la réception client.
- **Garantie** : at-least-once. Le client doit être idempotent (utiliser des `expeditionId`, `buildingId` pour dédupliquer).

---

## Patterns d'usage côté client (à reproduire dans la nouvelle app)

### Auto-reauth sur 401

```ts
// pseudo
async function fetchWithAuth(url, options) {
  let res = await fetch(url, withAuth(options));
  if (res.status === 401) {
    const newTokens = await refresh();
    useAuthStore.setState({ ...newTokens });
    res = await fetch(url, withAuth(options));
  }
  return res;
}
```

### Interpolation locale ressources

```ts
// 1s/1s, recalcul depuis lastUpdateTs et productionRates
function tick() {
  const elapsed = (Date.now() - lastUpdateTs) / 1000 / 3600; // heures
  const wood = baseWood + productionRates.wood * elapsed;
  // …idem stone/iron
  setResourcesDisplay({ wood: Math.min(wood, maxPerType), … });
}
setInterval(tick, 1000);
```

### Optimistic mutation upgrade

```ts
// pseudo TanStack Query
useMutation({
  mutationFn: upgradeBuilding,
  onMutate: async ({ villageId, buildingId, cost }) => {
    useResourcesStore.getState().consume(villageId, cost);
    return { rollback: cost };
  },
  onError: (_err, _vars, ctx) => {
    useResourcesStore.getState().refund(ctx.rollback);
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['village', 'queue']);
  },
});
```

### Reconcile expedition (idempotent)

```ts
// dans ws-bindings.ts
ws.on('battle.sent', (e) => {
  useExpeditionsStore.getState().upsert(e.expeditionId, {
    status: 'EN_ROUTE',
    arrivalAt: e.arrivalAt,
    targetX: e.targetX,
    targetY: e.targetY,
  });
});
ws.on('battle.resolved', (e) => {
  useExpeditionsStore.getState().upsert(e.expeditionId, { status: 'RETURNING', returnAt: e.returnAt });
  toast.success(e.isVictory ? 'Victoire !' : 'Défaite');
});
ws.on('battle.returned', (e) => {
  useExpeditionsStore.getState().remove(e.expeditionId);
  queryClient.invalidateQueries(['army', 'inventory', e.villageId]);
});
```

---

## Types partagés à importer depuis `@battleforthecrown/shared`

Tout est dans `packages/shared/src/` :

```ts
// village
import { BuildingType, BUILDING_DEFINITIONS, BUILDING_UNLOCK_REQUIREMENTS, WATCHTOWER_VISION_LEVELS } from '@battleforthecrown/shared/village/buildings';
import { VillageStrategyType, StrategyBonus, DEFAULT_VILLAGE_STRATEGY } from '@battleforthecrown/shared/village/strategy';

// army
import { UNIT_TYPES, UnitCost, UnitStats } from '@battleforthecrown/shared/army/types';

// resources
import { ResourceType, StorageLimits, ResourcesConfig } from '@battleforthecrown/shared/resources/types';

// world
import { WorldConfig, SpeedMultipliers, BarbarianSeedingPlan } from '@battleforthecrown/shared/world/types';

// logic (formules pures, server-authoritative côté client)
import { calculateTravelTime } from '@battleforthecrown/shared/logic/travel-time';
import { calculateBuildingCost } from '@battleforthecrown/shared/logic/building-cost';
import { calculateProduction } from '@battleforthecrown/shared/logic/production';

// power
import { POWER_WEIGHTS } from '@battleforthecrown/shared/power/weights';
```

> ⚠️ **Ne pas dupliquer ces constantes côté client.** Si une formule manque, l'ajouter dans `packages/shared/`, pas dans le frontend.

---

## Holes / risques connus du contrat actuel

### Pas de Guards REST sur la plupart des routes

Plusieurs endpoints prennent `userId` en query string et **font confiance** au client (pas de vérification que `req.user.id === query.userId`). À sécuriser côté backend (hors scope de cette migration). Le frontend ne doit pas se baser sur cette permissivité pour des raccourcis — passer toujours le vrai userId du JWT.

### Endpoints "legacy" en double

`/world/entities` (sans `:worldId`) coexiste avec `/world/:worldId/entities`. Utiliser **toujours** la version avec `:worldId` dans la nouvelle app.

### Population endpoint sans `:villageId` propre

`/population` prend `?villageId=` en query au lieu de `/population/:villageId`. Cohérent avec d'autres endpoints, mais à uniformiser un jour. Pas de blocker.

### Cron de production à 60min par défaut

Côté frontend, on ne dépend pas de cette valeur — on interpole avec `productionRates`. Mais si le backend force un `produce` manuel (ex : sur upgrade WAREHOUSE), un event `resources.changed` arrivera et resync.

---

## Date du snapshot

- Pris le **2026-05-04**.
- Si le backend introduit de nouveaux endpoints ou events, **mettre à jour ce fichier** dans le même PR que l'adaptation côté client. Ne pas laisser ce snapshot dériver silencieusement.
