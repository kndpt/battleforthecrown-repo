# Modèle de données

> Source de vérité : [`battleforthecrown-backend/prisma/schema.prisma`](../../battleforthecrown-backend/prisma/schema.prisma). Ce document survole les entités et leurs relations — toujours valider contre le schéma Prisma avant d'implémenter.

## Domaines

### Auth

| Table | Rôle |
|-------|------|
| `User` | compte joueur, email/password hash, `crownsBalance` |
| `RefreshToken` | rotation des refresh tokens, lié à un `User` |

### Mondes

| Table | Rôle |
|-------|------|
| `World` | un monde = un serveur de jeu indépendant. `slug` unique, `config` JSON (gameSpeed, economy, combat, etc.) |
| `WorldMembership` | join `User × World` avec `role` (PLAYER / ADMIN), `eliminatedAt` |
| `WorldConfig` *(legacy)* | en cours de fusion dans `World.config` |

`World.config` (JSON) contient notamment : `gameSpeed.{construction,training,travel}` (diviseurs de temps — valeur > 1 ⇒ plus rapide), `economy.productionRate` (amplificateur du taux — valeur > 1 ⇒ plus de ressources/min), `combat.{attackBonus,defenseBonus,lootFactor}`, paramètres de seeding barbares.

### Villages joueurs

| Table | Rôle |
|-------|------|
| `Village` | village d'un user dans un monde, coordonnées `x/y`, `name`, ressources `wood/stone/iron` (`Decimal`) |
| `Building` | un bâtiment du village, `type` (CASTLE/WOOD/.../HIDEOUT), `level`, `population` consumed |
| `BuildingQueue` | upgrade en cours, `targetLevel`, `startedAt`, `completesAt` |

Un user peut avoir plusieurs villages (conquête), un seul `mainVillage` (par convention via le `Village.isMain` ou par âge).

### Villages barbares

Pas de table dédiée — les villages barbares sont des `Village` avec `isBarbarian=true` et `userId=null`, plus un `tier` (T1/T2/T3). Ils partagent les tables associées (`Building`, `ResourceStock`, `Population`) et les **mêmes enums** (`BUILDING_TYPES`) que les villages joueurs : la différence est purement compositionnelle (composition de bâtiments par tier dans `packages/shared/src/world/barbarian-templates.ts`).

Spécificités runtime :
- Pas de `UnitInventory` côté BV — `combat.worker.ts` (`buildBarbarianDefender`) injecte `units: {}` et `BarbarianVillageStrategy` confirme `// Barbarians have no troops`.
- Seedés procéduralement par `BarbarianSeedingService` (qui délègue à `BarbarianVillageFactory`) au join d'un joueur dans le monde ; reseedés par `BarbarianBackfillWorker` après destruction/conquête.

### Armée

| Table | Rôle |
|-------|------|
| `ArmyUnit` | inventaire `{villageId, unitType, quantity}` |
| `TrainingQueue` | entraînement en cours, `unitType`, `quantity`, `completesAt` |

`unitType` ∈ `{ MILITIA, ARCHER, SQUIRE, TEMPLAR, SAVAGE, CAVALRY, CATAPULT, SPY, NOBLE }` — la liste exacte est dans `@battleforthecrown/shared/army`.

### Combat

| Table | Rôle |
|-------|------|
| `Combat` | une expédition, `originVillageId`, `targetVillageId` ou `targetBarbarianVillageId`, `arrivalAt`, `returnAt`, `isVictory`, `isResolved` |
| `Army` | armée embarquée dans un combat (snapshot au départ, mutée pour les pertes) |
| `Loot` | butin transporté au retour |
| `CombatReport` | rapport persistant lu par les joueurs (`reader`/`opponent`) |

Un combat passe par les phases `EN_ROUTE → RESOLVED → RETURNING → RETURNED` côté frontend. Backend : un job pg-boss à `arrivalAt` (résolution), puis un autre à `returnAt` (retour).

### Crowns

| Table | Rôle |
|-------|------|
| `Crown` | balance par user (`User.crownsBalance` parfois redondant — voir le schéma) |
| `CrownTransaction` | historique gain/dépense, `delta`, `reason` |

### Population

Pas de table dédiée — la population est dérivée de la somme des `Building.population` des bâtiments du village vs `getFarmPopulationLimit(farmLevel)`.

### Pouvoir (power)

Calcul à la volée côté `power.service.ts` :
- Power bâtiments : somme des `BUILDING_POWER[type][level]` du shared package.
- Power armée : somme des `unit.power × quantity`.
- Power royaume : somme des powers de tous les villages du user.

### Outbox (temps réel)

| Table | Rôle |
|-------|------|
| `EventOutbox` | événements en attente de diffusion WebSocket (`type`, `payload` JSON, `worldId`/`userId`, `createdAt`, `processedAt`) |

L'`OutboxWorker` poll la table toutes les ~1 s. Détail dans [`realtime.md`](./realtime.md).

## Relations clés

```
User ──< WorldMembership >── World
 │                              │
 │                              ├── WorldConfig (legacy → fusion en cours)
 │                              │
 │                              └── BarbarianVillage
 │
 └── Village ──< Building
      │
      ├── BuildingQueue (0..1 par bâtiment ou agrégé)
      │
      ├── ArmyUnit ──< TrainingQueue
      │
      ├── Combat (origin)  ─→ Village ou BarbarianVillage (target)
      │     │
      │     ├── Army (snapshot embarqué)
      │     ├── Loot (au retour)
      │     └── CombatReport (×2, attaquant + défenseur)
      │
      └── Crown ──< CrownTransaction
```

## Conventions

- **`Decimal`** Prisma pour les ressources (wood/stone/iron) — précision sur la production fractionnée. Convertir en `Number` côté Node pour les calculs simples, garder `Decimal` pour les agrégats critiques.
- **Coordonnées** : `x` / `y` en entiers, plage typique `0..500` (taille monde par défaut).
- **Timestamps** : tous en `DateTime` UTC. Aucune ambiguïté de fuseau côté DB.
- **JSON** : 8 colonnes typées via Zod, source de vérité dans `packages/shared/src/`.
  - `World.config` → `WorldConfigSchema` (shared `world/schemas.ts`), parsé dans `WorldConfigService`.
  - `EventOutbox.payload` → registre `EVENT_PAYLOAD_SCHEMAS` par `EventKind` (shared `events/schemas.ts`), parsé runtime par `parseEventPayload` côté backend (`event/codecs/payload.codec.ts`) au moment du dispatch.
  - `Expedition.units`, `CombatReport.{lossesAttacker, lossesDefender, totalUnitsAttacker, totalUnitsDefender}` → `UnitMapSchema` (shared `army/unit-map.ts`), parsés via `parseUnitMap` (backend `combat/codecs/unit-map.codec.ts`).
  - `CombatReport.loot` → `LootResultSchema` / `CombatLootSchema` (shared `combat/schemas.ts`), parsé via `parseLootResult` ou `parseCombatLoot` (backend `combat/codecs/loot.codec.ts`).
  - `WorldEntity.data` → schema discriminé par `kind` (actuellement BarbarianVillage), typé localement dans `world/world-entities-query.service.ts`.
  - **Règle** : toute lecture/écriture d'une colonne JSON Prisma passe par un codec ; le seul cast frontière `as unknown as Prisma.InputJsonValue` est isolé dans les codecs eux-mêmes.

## Migrations

Toutes dans [`prisma/migrations/`](../../battleforthecrown-backend/prisma/migrations/). Historique linéaire — pas de squash dans une base partagée.

⚠️ **Jamais `prisma migrate reset`** sur une base utilisée (convention projet, cf. `~/.claude/CLAUDE.md`).
