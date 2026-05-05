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
| `World` | un monde = un serveur de jeu indépendant. `slug` unique, `config` JSON (multipliers, costs, rates) |
| `WorldMembership` | join `User × World` avec `role` (PLAYER / ADMIN), `eliminatedAt` |
| `WorldConfig` *(legacy)* | en cours de fusion dans `World.config` |

`World.config` (JSON) contient notamment : `multipliers.production`, `multipliers.construction`, `combat.travelSpeed`, plages de coûts, paramètres de seeding barbares.

### Villages joueurs

| Table | Rôle |
|-------|------|
| `Village` | village d'un user dans un monde, coordonnées `x/y`, `name`, ressources `wood/stone/iron` (`Decimal`) |
| `Building` | un bâtiment du village, `type` (CASTLE/WOOD/.../HIDEOUT), `level`, `population` consumed |
| `BuildingQueue` | upgrade en cours, `targetLevel`, `startedAt`, `completesAt` |

Un user peut avoir plusieurs villages (conquête), un seul `mainVillage` (par convention via le `Village.isMain` ou par âge).

### Villages barbares

| Table | Rôle |
|-------|------|
| `BarbarianVillage` | village neutre, `tier` (T1/T2/T3) avec `defense`, `loot` calculés à partir du tier + config monde |

Seedés procéduralement par `BarbarianSeedingService` au démarrage du monde et reseedés par `BarbarianBackfillWorker` après destruction/conquête.

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
- **JSON** : `World.config`, `EventOutbox.payload`, `CombatReport.snapshot` — schémas TypeScript décrits dans le shared ou les `dto/` du module concerné.

## Migrations

Toutes dans [`prisma/migrations/`](../../battleforthecrown-backend/prisma/migrations/). Historique linéaire — pas de squash dans une base partagée.

⚠️ **Jamais `prisma migrate reset`** sur une base utilisée (convention projet, cf. `~/.claude/CLAUDE.md`).
