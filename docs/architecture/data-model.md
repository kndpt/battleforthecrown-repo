# Modèle de données

> Source de vérité : [`battleforthecrown-backend/prisma/schema.prisma`](../../battleforthecrown-backend/prisma/schema.prisma). Ce document survole les entités et leurs relations — toujours valider contre le schéma Prisma avant d'implémenter.

## Domaines

### Auth

| Table | Rôle |
|-------|------|
| `User` | compte joueur, `email` (login privé), `displayName` (nom public global unique case-insensitive), password hash, `crownsBalance` |
| `RefreshToken` | rotation des refresh tokens, lié à un `User` |

### Mondes

| Table | Rôle |
|-------|------|
| `World` | un monde = un serveur de jeu indépendant. `status` (`WorldStatus` : `PLANNED, OPEN, LOCKED, ENDED, ARCHIVED`), `startedAt`, `endsAt`, `plannedOpenAt`, `archivedAt` (timestamp d'archivage, run 065, audit indépendant du status) et `config` JSON (`tempo`, lifecycle, identity, combat, seeding barbares, etc.) |
| `WorldMembership` | join `User × World` avec `role` (PLAYER / MOD), `joinedAt`, `lastLoginAt` |
| `WorldConfig` *(legacy)* | en cours de fusion dans `World.config` |

`World.config` (JSON) contient notamment : `tempo.{global, overrides?}` (multiplier unifié « < 1 = jeu plus rapide » — cf. [`docs/gameplay/23-world-tempo-and-multipliers.md`](../gameplay/23-world-tempo-and-multipliers.md)), `lifecycle.{worldDuration,inscriptionMainDays,inscriptionLateDays,newWorldEverydays,newbieShieldHours}`, `identity.{displayName,tagline,sigil,themeColor,tier}`, `combat.{attackBonus,defenseBonus,lootFactor}`, paramètres de seeding barbares.

> ⚠️ **Migration en cours** : les anciens champs `gameSpeed.{construction,training,travel,capture}` (sémantique inverse : « > 1 = plus rapide ») et `economy.productionRate` sont **supprimés clean cut** au profit de `tempo`. Voir [`decisions.md` § ADR-12](./decisions.md#adr-12--pivot-compressed-async--tempo-world-scoped-via-worldconfigtempo).

**Cycle de vie player ↔ monde** : `JoinWorldUseCase` crée le tuple `(WorldMembership, Village, Building rows, ResourceStock, Population, CrownBalance, OnboardingState)`. Si c'est le premier village du joueur sur ce monde, l'onboarding applique une récompense initiale unique (`+850/+850/+850` ressources, `+100` couronnes). `ResetWorldUseCase` (`DELETE /world/:worldId/me`) effectue l'opération inverse — full wipe par `(userId, worldId)`, suppression des `ScoutReport` du joueur, suppression de l'état onboarding et anonymisation des `CombatReport` côté défenseur. Aucun event Outbox émis. Le joueur peut re-join immédiatement comme un nouveau joueur. Code : `src/modules/world/{join,reset}-world.use-case.ts`.

**Cycle de vie du monde** : `WorldLifecycleWorker` ouvre les mondes `PLANNED` quand `plannedOpenAt <= now`, calcule `startedAt`/`endsAt` depuis `WorldConfig.lifecycle.worldDuration`, verrouille les inscriptions après `inscriptionMainDays + inscriptionLateDays`, termine le monde à `endsAt`, puis l'**archive** à `endsAt + archiveAfterDays` (run 065 : purge atomique des données joueur scopées au monde, `World` + données durables conservés). Chaque transition écrit `world.status.changed` dans `EventOutbox`.

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
| `Expedition` | un trajet d'armée ou de caravane. Champs : `attackerVillageId`, `targetRefId`, `arrivalAt`, `outboundTravelMs`, `returnAt`, `status`, plus snapshot de retour `survivingUnits`/`loot` selon le kind. |
| `Expedition.kind` | `ATTACK`, `REINFORCE`, `SCOUT` ou `CARAVAN`. Détermine le comportement à l'arrivée. |
| `Expedition.recalled` | boolean — vrai si l'armée a fait demi-tour pendant l'aller (Recall). |
| `Expedition.reinforcementOriginVillageId` | utilisé pour identifier le village d'origine lors d'un rappel (Recall) de renforts. |
| `Expedition.reinforcementRecallActorUserId` | colonne additive nullable. Porte l'identité de l'acteur du Rappeler / Renvoyer depuis le service jusqu'au worker ; permet de créer le `ReinforcementReport` RETURNED avec le bon acteur à l'arrivée. |
| `CombatReport` | rapport persistant d'un combat ou d'une finalisation de capture. L'accès est porté par `attackerUserId` / `defenderUserId` / `observerUserId`; l'état inbox est par participant (`readByAttacker` / `readByDefender` / `readByObserver`, `hiddenByAttacker` / `hiddenByDefender` / `hiddenByObserver`). Pendant une capture, `defenderUserId` représente l'occupant de la garnison et `observerUserId` le propriétaire original d'un village joueur distinct ; un village barbare n'a pas d'observateur propriétaire. |
| `ScoutReport` | rapport persistant d'une mission scout. L'accès est porté par `scoutUserId`; snapshot de `units`, `resources` et `strategy` nullable au moment d'arrivée. L'état inbox est mono-participant (`isRead`, `hidden`). |
| `VillageIntel` | carnet d'intel : **dernière info connue** (snapshot agrégé) d'un village cible, **privé** au joueur observateur. Clé unique `(userId, worldId, targetVillageId)` → upsert, pas d'historique multi-snapshots. `sourceKind` (`SCOUT` / `COMBAT_WIN`) + `sourceReportId` pointent le rapport révélateur (polymorphe `ScoutReport`/`CombatReport`, **sans FK**, dénormalisé). Écrit par `IntelService.recordIntel` (dans la tx du `CombatWorker`) à chaque scout résolu et à chaque combat offensif **gagné** (`isVictory && !occupationDefense`). Sémantique **par champ « si révélé »** : un upsert ne remplace `wallLevel`/`strategy`/`targetName`/`targetTier` que si la nouvelle source les fournit (un combat gagné ne dégrade pas le rempart/style vus au scout). Lecture via `GET /worlds/:worldId/intel/:villageId` → `VillageIntelDto \| null`. Source de vérité des champs : [`prisma/schema.prisma`](../../battleforthecrown-backend/prisma/schema.prisma). |
| `ReinforcementReport` | fait métier persistant d'un mouvement de renfort. `type` : enum `ReinforcementReportType` (`STATIONED` — renfort arrivé en garnison ; `RETURNED` — renfort rentré à son village d'origine). Capture les villages d'origine et hôte (id, nom, coordonnées), le snapshot `units` (JSON), l'`actorUserId` (acteur du rappel/renvoi, RETURNED uniquement), `worldId` et `timestamp`. Pas de pertes, pas de loot, pas d'issue victoire/défaite. Archive permanente — ne disparaît pas quand un destinataire masque son `InboxEntry`. Source de vérité des champs exacts : [`prisma/schema.prisma`](../../battleforthecrown-backend/prisma/schema.prisma). |
| `CaravanReport` | fait métier persistant d'un mouvement de caravane. `type` : enum `CaravanReportType` (`ARRIVED` — livraison arrivée ; `RETURNED` — retour rappelé). Capture les villages d'origine et de destination (id, nom, coordonnées), les ressources transportées, créditées, restituées ou perdues (JSON), les porteurs, `recalled`, `worldId` et `timestamp`. Aucun rapport n'est créé pour `caravan.sent` ni pour le retour normal après livraison. Archive permanente — ne disparaît pas quand un destinataire masque son `InboxEntry`. Source de vérité des champs exacts : [`prisma/schema.prisma`](../../battleforthecrown-backend/prisma/schema.prisma). |
| `InboxEntry` | état inbox par destinataire pour les rapports typés branchés via FK (`ReinforcementReport`, `CaravanReport`). Champs clés : `userId`, `worldId`, `kind` (enum `InboxKind` : `REINFORCEMENT`, `CARAVAN`), `reinforcementReportId` / `caravanReportId` (FK nullable, `onDelete Cascade`), `isRead`, `hidden`, `timestamp`. Une ligne par destinataire unique ; contrainte unique par `(userId, <reportId>)`. Dédoublonnée quand les participants pointent vers le même utilisateur. L'état lu/masqué d'un joueur n'affecte pas le rapport physique. Source de vérité des champs exacts : [`prisma/schema.prisma`](../../battleforthecrown-backend/prisma/schema.prisma). |
| `PendingConquest` | fenêtre de capture ouverte après un pré-combat victorieux avec Seigneur survivant. Stocke `attackerVillageId`, `attackerUserId`, `targetVillageId`, `captureUntil`, `status` (`OPEN`/`COMPLETED`/`INTERRUPTED`) et le `finalizeJobId` pg-boss. |

Un trajet passe généralement par les phases `EN_ROUTE → RESOLVED → RETURNING` (cf. `ExpeditionStatus`). Backend : un job pg-boss à `arrivalAt` (résolution), puis un autre à `returnAt` (retour) uniquement s'il reste des unités ou du loot à ramener. Si toute l'armée attaquante est détruite sans loot, l'expédition reste `RESOLVED` avec `returnAt = null`. Pour les retours de raids et scouts, `returnAt` est calculé avec `outboundTravelMs`, la durée aller figée au dispatch.

Pour `CARAVAN`, `Expedition.units` reste vide et `Expedition.loot.resources` porte les ressources transportées. À l'arrivée, le worker crédite le village cible jusqu'à la capacité de son Entrepôt, perd l'excédent et crée un `CaravanReport.ARRIVED` avec son `InboxEntry`. Le retour nominal libère seulement les porteurs dans `Population.used` du village d'origine. Si la caravane est rappelée avant arrivée, son retour restitue aussi les ressources à l'origine jusqu'à la capacité de stockage, perd le surplus, libère les porteurs et crée un `CaravanReport.RETURNED`. Aucune ligne `UnitInventory` n'est créée pour les porteurs.

Une conquête passe par `PendingConquest.OPEN → COMPLETED|INTERRUPTED`. La DB impose une seule fenêtre `OPEN` par `targetVillageId` via index unique partiel SQL ; les historiques terminés/interrompus peuvent coexister pour une même cible. Pendant la fenêtre, le Seigneur survivant est stationné comme `Garrison { villageId: targetVillageId, originVillageId: attackerVillageId, unitType: NOBLE }`; s'il survit jusqu'à la finalisation, il est converti en `UnitInventory.NOBLE` du village conquis.

### Marqueurs de carte privés

| Table | Rôle |
|-------|------|
| `MapMarker` | marqueur de carte **privé** au joueur, posé sur une **tile libre** `(worldId, x, y)` indépendamment de son contenu (run 085). Champs : `userId`, `worldId`, `x`, `y`, `kind` (enum `MapMarkerKind` : `TO_SCOUT`/`TARGET`/`DANGER`/`FUTURE_VILLAGE`/`INTEREST`/`NOTE`), `note` (≤80, nullable), `createdAt`, `updatedAt`. Unicité `(userId, worldId, x, y)` → upsert idempotent par tile ; index `(userId, worldId)`. `worldId` **dénormalisé** (pas de FK cascade depuis `Village`) → purge explicite à l'archive monde, comme `VillageIntel`. Aucun event WS (privé par compte). Spec [`26-private-map-markers.md`](../gameplay/26-private-map-markers.md). |

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

### Onboarding scripté

| Table | Rôle |
|-------|------|
| `OnboardingState` | état tutoriel unique par `userId × worldId`, premier village, statut `ACTIVE|COMPLETED`, étape courante, récompense initiale appliquée |
| `OnboardingStepProgress` | étapes complétées, une ligne par `state × step`, optionnellement liée à l'`EventOutbox.id` source |
| `OnboardingProgressEvent` | ledger idempotent par `EventOutbox.id` pour éviter le double comptage si un event est rejoué |

La progression est séquentielle et consomme des facts gameplay Outbox (`building.completed`, `unit.trained`, `battle.resolved`). Elle est volontairement séparée de `DailyCard*` pour ne pas confondre tutoriel de première session et rétention quotidienne.

### Population

Pas de table dédiée — la population est dérivée de la somme des `Building.population` des bâtiments du village vs `getFarmPopulationLimit(farmLevel)`.

### Pouvoir (power)

Calcul à la volée côté `power.service.ts` :
- Power bâtiments : somme des `BUILDING_POWER[type][level]` du shared package.
- Power armée : somme des `unit.power × quantity`.
- Power royaume : somme des powers de tous les villages du user.

### Classements finaux

| Table | Rôle |
|-------|------|
| `WorldFinalRankingSnapshot` | snapshot des 3 classements (`FinalRankingSignal` : `POWER`, `ASSAULT_GLORY`, `RAMPART_GLORY`) à la transition `LOCKED → ENDED`. Champs : `worldId`, `userId`, `signal`, `rank`, `score`, `snapshotAt`. Contrainte unique `(worldId, signal, userId)` ; index `(worldId, signal, rank)`. Inclut tous les `WorldMembership`, y compris les éliminés (score 0). Tiebreaker : `userId` lexicographique. Source de vérité pour les runs UI/awards aval — lu en consultation publique via `GET /worlds/:worldId/rankings/final` (run 066, cf. [`backend-modules.md`](./backend-modules.md)). |
| `GloryCycleSnapshot` | leaderboard figé d'un cycle hebdo Gloire clos (run 068). Champs : `worldId`, `signal` (`RankingSignal` : `ASSAULT_GLORY`, `RAMPART_GLORY`), `cycleIndex` (1-based, monotone par `worldId × signal`), `cycleStartAt`, `cycleEndAt` (exclusif), `closedAt`, `entries` (JSONB top-N `[{userId, displayName, score, rank}]`). Unique `(worldId, signal, cycleIndex)` ; index `(worldId, signal, cycleEndAt)`. Lié au monde (purgeable au wipe). Frontière de cycle wall-clock Lundi 00:00 UTC (configurable via `WorldConfig.rankings`). Helpers purs : [`@battleforthecrown/shared` → `src/rankings/cycle.ts`](../../packages/shared/src/rankings/cycle.ts). |
| `RankingCycleTitleAward` | titre hebdo temporaire attribué au rang 1 d'un cycle clos (run 068). Champs : `userId`, `worldId`, `signal`, `cycleIndex`, `worldDisplayName` (snapshot immutable), `cycleEndAt`, `validUntilAt` (= `cycleEndAt` du cycle suivant), `awardedAt`. Unique `(userId, worldId, signal, cycleIndex)` ; index `(userId, validUntilAt)`. **Permanent** (l'historique reste lisible après expiration de `validUntilAt`) — survit au wipe destructeur de fin de monde, comme `UserWorldCosmeticAward`. Lu via `GET /users/me/ranking-titles`. |
| `UserWorldCosmeticAward` | titre cosmétique **permanent** attaché au compte global, attribué au top 1 de chaque signal à `LOCKED → ENDED` (run 067), dans la même transaction que le snapshot ci-dessus. `kind` (`CosmeticAwardKind` : `POWER_CHAMPION_TITLE`, `ASSAULT_CHAMPION_TITLE`, `RAMPART_CHAMPION_TITLE`). `worldDisplayName` snapshotté à l'attribution (immuable, lisible même après rename/purge du monde). Filtre : score 0 → pas de titre sauf POWER (≥ 1 château ⇒ score > 0). Contrainte unique `(userId, worldId, kind)` (idempotence replay worker via `createMany skipDuplicates`) ; index `(userId)`. Lu par `GET /users/me/cosmetic-awards`. Cosmétique only — jamais de bonus gameplay (cf. [`gameplay/24-rankings.md`](../gameplay/24-rankings.md) § Rewards). **Préservé au wipe destructeur** (run 065). |

### Renommée de compte (account renown)

| Table / champ | Rôle |
|-------|------|
| `User.renownXp` | XP de Renommée cumulée cross-monde (`Int`, défaut 0). Source d'autorité du niveau (le niveau est dérivé, jamais stocké). Cosmétique uniquement — **zéro effet in-world** (cf. [`gameplay/25-account-renown.md`](../gameplay/25-account-renown.md)). |
| `RenownLedger` | journal de crédit idempotent. Champs : `userId`, `source` (`RenownSource` : `CONSTRUCTION`, `CONQUEST`, `COMBAT`, `RANKING_BONUS`), `xp`, `worldId?`, `dedupKey`, `createdAt`. Contrainte unique `dedupKey` ; index `userId`. Idempotence par `dedupKey` (`outbox:<eventId>` live, `combat:<reportId>:<signal>:<scorer>:<opponent>`, `ranking:<worldId>:<signal>:<userId>`). Crédit via `createMany({skipDuplicates})` + increment conditionnel → un replay d'Outbox ne double pas la XP. Formules : [`@battleforthecrown/shared` → `src/renown/`](../../packages/shared/src/renown/). |

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
 │                              ├── OnboardingState ──< OnboardingStepProgress
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
      │     ├── ScoutReport (1:1 via scoutReportId)
      │     └── ReinforcementReport (1:N via originVillageId/hostVillageId)
      │           └── InboxEntry ──< (userId destinataire)
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
