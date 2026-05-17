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
| `World` | un monde = un serveur de jeu indépendant. `slug` unique, `config` JSON (`tempo`, combat, seeding barbares, etc.) |
| `WorldMembership` | join `User × World` avec `role` (PLAYER / ADMIN), `eliminatedAt` |
| `WorldConfig` *(legacy)* | en cours de fusion dans `World.config` |

`World.config` (JSON) contient notamment : `tempo.{global, overrides?}` (multiplier unifié « < 1 = jeu plus rapide » — cf. [`docs/gameplay/23-world-tempo-and-multipliers.md`](../gameplay/23-world-tempo-and-multipliers.md)), `combat.{attackBonus,defenseBonus,lootFactor}`, paramètres de seeding barbares.

> ⚠️ **Migration en cours** : les anciens champs `gameSpeed.{construction,training,travel,capture}` (sémantique inverse : « > 1 = plus rapide ») et `economy.productionRate` sont **supprimés clean cut** au profit de `tempo`. Voir [`decisions.md` § ADR-12](./decisions.md#adr-12--pivot-compressed-async--tempo-world-scoped-via-worldconfigtempo).

**Cycle de vie player ↔ monde** : `JoinWorldUseCase` crée le tuple `(WorldMembership, Village, Building rows, ResourceStock, Population, CrownBalance, UnitInventory skeleton, VillageStrategyConfig)`. `ResetWorldUseCase` (`DELETE /world/:worldId/me`) effectue l'opération inverse — full wipe par `(userId, worldId)`, suppression des `ScoutReport` du joueur et anonymisation des `CombatReport` côté défenseur. Aucun event Outbox émis. Le joueur peut re-join immédiatement comme un nouveau joueur. Code : `src/modules/world/{join,reset}-world.use-case.ts`.

**Invariant ajout bâtiment joueur** : tout nouveau `BUILDING_TYPES.*` activé pour les villages joueurs doit recevoir une entrée explicite dans `PLAYER_VILLAGE_BUILDING_LIFECYCLE` (`battleforthecrown-backend/src/modules/village/player-village-building-lifecycle.ts`). Cette source canonique fixe le niveau initial d'un nouveau village joueur et la politique après conquête d'un village barbare (`tier-level` ou `unbuilt`). `JoinWorldUseCase` et `ConquestService` doivent consommer ce roster plutôt que maintenir des listes séparées. `GET /village/buildings` expose les rows DB réelles et ne synthétise pas de bâtiments manquants pour masquer une donnée ancienne. Si des villages existants doivent recevoir le nouveau bâtiment, choisir explicitement entre reset utilisateur, migration/backfill non destructif, ou laisser l'ancien état inchangé.

**Invariant conquête barbare** : la finalisation de conquête matérialise selon `PLAYER_VILLAGE_BUILDING_LIFECYCLE` les bâtiments `tier-level` au niveau du tier capturé, puis crée les bâtiments `unbuilt` en `level: 0` pour conserver les mêmes unlocks frontend qu'un village joueur initial. Les bâtiments désactivés restent absents du roster.

### Villages joueurs

| Table | Rôle |
|-------|------|
| `Village` | village d'un user dans un monde, coordonnées `x/y`, `name`, ressources `wood/stone/iron` (`Decimal`) |
| `Building` | un bâtiment du village, `type` (CASTLE/WOOD/.../HIDEOUT), `level`, `population` consumed |
| `BuildingQueue` | upgrade en cours, `targetLevel`, `startedAt`, `completesAt` |

Un user peut avoir plusieurs villages (conquête), un seul `mainVillage` (par convention via le `Village.isMain` ou par âge).

### Villages barbares

Pas de table dédiée — les villages barbares sont des `Village` avec `isBarbarian=true` et `userId=null`, plus un `tier` (T1→T5). Ils partagent les tables associées (`Building`, `ResourceStock`, `Population`, `UnitInventory`) et les **mêmes enums** (`BUILDING_TYPES`, `UNIT_TYPES`) que les villages joueurs : la différence est purement compositionnelle (composition de bâtiments et blueprint d'armée par tier dans `packages/shared/src/world/barbarian-templates.ts`).

Spécificités runtime :
- `UnitInventory` côté BV stocke les troupes runtime rollées à la création (60–100 % du blueprint max), plafonnées par `getUnits(tier)`.
- `Village.barbarianTroopsLastRegenTs` sert de curseur lazy pour la régénération des troupes ; `ResourceStock.lastUpdateTs` sert de curseur ressources.
- `BarbarianRuntimeService.catchUpVillage()` applique la régénération lazy avant les lectures runtime actuelles (combat et scout).
- `Population.used` reste à 0 tant que le village est barbare : les troupes barbares ne donnent pas de puissance joueur avant conquête.
- Seedés procéduralement par `BarbarianSeedingService` (qui délègue à `BarbarianVillageFactory`) au join d'un joueur dans le monde ; le `BarbarianSeedingCatchupWorker` (cron quotidien) rattrape les chunks que le seeding sync n'a pas eu le temps de couvrir pour les joueurs créés < 1 h (cf. [`docs/gameplay/07-barbarian-spawning.md` § Catchup d'arrivée différée](../gameplay/07-barbarian-spawning.md)).
- Le feed carte `/world/:worldId/entities` projette les villages joueurs et barbares depuis `Village`; l'ancienne table miroir `world_entity` n'est plus un modèle Prisma ni une source runtime.

### Armée

| Table | Rôle |
|-------|------|
| `UnitInventory` | inventaire `{villageId, unitType, quantity}` |
| `UnitTraining` | entraînement en cours, `building` (`BARRACKS` ou `THRONE_HALL`), `unitType`, `quantity`, `nextUnitEta` |
| `Garrison` | troupes stationnées en renfort : `villageId` (hôte), `originVillageId` (source), `unitType`, `quantity`. |

`unitType` : énumération source de vérité dans `@battleforthecrown/shared/army` (`UNIT_TYPES`). Catalogue complet (stats, coûts, passifs) : [`docs/gameplay/08-units.md`](../gameplay/08-units.md).

`UnitTraining.building` matérialise une file par bâtiment : Caserne (`BARRACKS`) et Salle du Trône (`THRONE_HALL`) peuvent entraîner en parallèle, mais un village ne peut avoir qu'une file active par bâtiment.

### Combat

| Table | Rôle |
|-------|------|
| `Expedition` | un trajet d'armée (ou `Combat` dans la doc gameplay). Champs : `attackerVillageId`, `targetRefId`, `arrivalAt`, `outboundTravelMs`, `returnAt`, `status`, plus snapshot de retour `survivingUnits`/`loot` après résolution. |
| `Expedition.kind` | `ATTACK`, `REINFORCE` ou `SCOUT`. Détermine le comportement à l'arrivée. |
| `Expedition.recalled` | boolean — vrai si l'armée a fait demi-tour pendant l'aller (Recall). |
| `Expedition.reinforcementOriginVillageId` | utilisé pour identifier le village d'origine lors d'un rappel (Recall) de renforts. |
| `CombatReport` | rapport persistant d'un combat. L'accès est porté par `attackerUserId` / `defenderUserId`; l'état inbox est par participant (`readByAttacker` / `readByDefender`, `hiddenByAttacker` / `hiddenByDefender`). Sur un village barbare sous capture, `defenderUserId` peut représenter le joueur occupant la garnison de capture. |
| `ScoutReport` | rapport persistant d'une mission scout. L'accès est porté par `scoutUserId`; snapshot de `units`, `resources` et `strategy` nullable au moment d'arrivée. L'état inbox est mono-participant (`isRead`, `hidden`). |
| `PendingConquest` | fenêtre de capture ouverte après un pré-combat victorieux avec Seigneur survivant. Stocke `attackerVillageId`, `attackerUserId`, `targetVillageId`, `captureUntil`, `status` (`OPEN`/`COMPLETED`/`INTERRUPTED`) et le `finalizeJobId` pg-boss. |

Un trajet passe généralement par les phases `EN_ROUTE → RESOLVED → RETURNING` (cf. `ExpeditionStatus`). Backend : un job pg-boss à `arrivalAt` (résolution), puis un autre à `returnAt` (retour) uniquement s'il reste des unités ou du loot à ramener. Si toute l'armée attaquante est détruite sans loot, l'expédition reste `RESOLVED` avec `returnAt = null`. Pour les retours de raids et scouts, `returnAt` est calculé avec `outboundTravelMs`, la durée aller figée au dispatch.

Une conquête passe par `PendingConquest.OPEN → COMPLETED|INTERRUPTED`. La DB impose une seule fenêtre `OPEN` par `targetVillageId` via index unique partiel SQL ; les historiques terminés/interrompus peuvent coexister pour une même cible. Pendant la fenêtre, le Seigneur survivant est stationné comme `Garrison { villageId: targetVillageId, originVillageId: attackerVillageId, unitType: NOBLE }`; s'il survit jusqu'à la finalisation, il est converti en `UnitInventory.NOBLE` du village conquis.

### Crowns

| Table | Rôle |
|-------|------|
| `Crown` | balance par user (`User.crownsBalance` parfois redondant — voir le schéma) |
| `CrownTransaction` | historique gain/dépense, `delta`, `reason` |

### Rétention quotidienne

| Table | Rôle |
|-------|------|
| `DailyCard` | carte quotidienne par `userId × worldId × dayKey`, backlog non réclamé et récompense ressources modérée |
| `DailyCardTask` | tâches de la carte, progressées depuis les facts gameplay Outbox (`unit.trained`, `building.completed`, etc.) |
| `DailyCardProgressEvent` | ledger idempotent par `EventOutbox.id` pour éviter le double comptage si un event est rejoué |
| `DailyOyez` | Oyez actif ou planifié par monde, exposé dans le résumé rétention |

Le `dayKey` est calculé sur le reset `04:00 Europe/Paris`. Une carte réclamée peut cibler un village possédé ; le dernier `rewardVillageId` réclamé sert de défaut pour le claim suivant.

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
 │                              ├── DailyOyez
 │                              │
 │                              └── BarbarianVillage
 │
 ├── DailyCard ──< DailyCardTask
 │
 └── Village ──< Building
      │
      ├── UnitInventory
      ├── UnitTraining
      ├── Garrison (hôte & source)
      │
      ├── Expedition (origin)  ─→ Village ou BarbarianVillage (target)
      │     │
      │     ├── CombatReport (1:1 via reportId)
      │     └── ScoutReport (1:1 via scoutReportId)
      │
      ├── PendingConquest (attacker)
      └── PendingConquest (target)
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
  - `Expedition.units`, `Expedition.survivingUnits`, `CombatReport.{lossesAttacker, lossesDefender, totalUnitsAttacker, totalUnitsDefender}`, `ScoutReport.units` → `UnitMapSchema` (shared `army/unit-map.ts`), parsés via `parseUnitMap` (backend `combat/codecs/unit-map.codec.ts`).
  - `Expedition.loot`, `CombatReport.loot` → `LootResultSchema` / `CombatLootSchema` (shared `combat/schemas.ts`), parsés via `parseLootResult` ou `parseCombatLoot` (backend `combat/codecs/loot.codec.ts`).
  - **Règle** : toute lecture/écriture d'une colonne JSON Prisma passe par un codec ; le seul cast frontière `as unknown as Prisma.InputJsonValue` est isolé dans les codecs eux-mêmes.

## Migrations

Toutes dans [`prisma/migrations/`](../../battleforthecrown-backend/prisma/migrations/). Historique linéaire — pas de squash dans une base partagée.

⚠️ **Jamais `prisma migrate reset`** sur une base utilisée (convention projet, cf. `~/.claude/CLAUDE.md`).
