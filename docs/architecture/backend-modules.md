# Backend — modules et arborescence

> Référence détaillée de la structure NestJS du workspace `battleforthecrown-backend/`. Pour les conventions (Controllers/Services/DTOs/Guards), voir [`battleforthecrown-backend/.agents/rules/nest-conventions.md`](../../battleforthecrown-backend/.agents/rules/nest-conventions.md). Pour les workers et le pattern Outbox, voir le skill [`bftc-workers-outbox`](../../.agents/skills/bftc-workers-outbox/SKILL.md).

## Arborescence `src/`

```
src/
├── app.module.ts            # Module racine, imports globaux
├── main.ts                  # Bootstrap NestJS, ValidationPipe, CORS, Socket.IO
├── health.controller.ts     # GET /health pour monitoring
│
├── common/                  # Utilitaires partagés cross-module
│   ├── constants.ts                # Constantes globales (legacy, en cours de migration vers WorldConfig)
│   ├── prisma.types.ts             # Types TS partagés liés à Prisma
│   ├── pipes/
│   │   └── zod-validation.pipe.ts  # Pipe Zod (préféré aux décorateurs class-validator pour le neuf)
│   └── request-logger.middleware.ts
│
├── infra/                   # Infrastructure technique (singletons globaux)
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts       # PrismaClient injectable, source unique
│   └── pg-boss/
│       └── pg-boss.module.ts       # Client pg-boss exposé via 'PG_BOSS' token
│
├── modules/                 # Bounded contexts métiers (cf. tableau ci-dessous)
│   ├── auth/
│   ├── world/
│   ├── village/             # Lecture village + bâtiments (sans logique de mutation transverse)
│   ├── resources/           # Production passive + lectures stock
│   ├── army/                # Lecture inventaire + entraînements en cours
│   ├── combat/
│   ├── crowns/
│   ├── retention/           # Cartes quotidiennes + Oyez, projection des facts Outbox
│   ├── onboarding/          # Tutoriel scripté MVP, état dédié + projection des facts Outbox
│   ├── population/
│   ├── power/
│   ├── strategy/            # VillageStrategyService partagé (cf. ADR-12)
│   ├── gameplay/            # Use cases métier transverses (cf. ADR-12)
│   └── event/               # Gateway WebSocket + EventOutbox + OutboxPublisher
│
└── workers/                 # Jobs asynchrones pg-boss
    ├── workers.module.ts
    ├── production.worker.ts
    ├── construction.worker.ts
    ├── training.worker.ts
    ├── crown-production.worker.ts
    ├── world-lifecycle.worker.ts
    └── outbox.worker.ts
```

## Modules métiers

| Module | Endpoints clés | Workers | Notes |
|--------|----------------|---------|-------|
| **auth** | `POST /auth/login`, `/register`, `/refresh` | — | JWT + refresh tokens, sessions DB |
| **world** | `GET /world`, `GET /worlds/public`, `GET /world/:worldId/details`, `/entities` | `BarbarianSeedingCatchupWorker`, `WorldLifecycleWorker` | Seeding procédural des villages barbares + placement joueur ; cycle `PLANNED → OPEN → LOCKED → ENDED` |
| **village** | `GET /village/:id/buildings`, `/queue` | — | Lectures village + bâtiments. Les mutations (upgrade/cancel) délégées à `gameplay/` |
| **resources** | `GET /resources/:villageId` | `ProductionWorker` | Production passive bois/pierre/fer, capé par warehouse. Pas de publication d'event (déléguée à `OutboxPublisher`) |
| **army** | `GET /army/:villageId/inventory`, `/training`, `POST /army/:villageId/throne/recruit-noble` | — | Lectures inventaire + entraînements. Mutations (train/cancel/recruit noble) déléguées à `gameplay/` |
| **gameplay** | `POST /village/:id/upgrade`, `DELETE /village/:id/buildings/:bid/cancel`, `POST /army/:id/train`, `POST /army/:id/throne/recruit-noble`, `DELETE /army/:id/training/:tid/cancel` | `ConstructionWorker`, `TrainingWorker` | Use cases orchestrant les mutations multi-domaine (cf. ADR-12) |
| **strategy** | (interne) | — | `VillageStrategyService` exposé à Population/Resources/Army/Gameplay sans couplage |
| **combat** | `POST /combat/attack`, `POST /combat/scout`, `POST /combat/reinforce`, `POST /combat/recall`, `POST /combat/recall/:expeditionId`, `GET /combat/:villageId/active`, `GET /combat/:villageId/garrison`, `GET /combat/reports`, `GET /combat/scout-reports` | `CombatWorker`, `ReturnWorker` | Attaque, scout, renforts, garnison, conquête, butin, retour. Stratégies `Barbarian` / `Player` |
| **crowns** | `GET /crowns/:userId` | `CrownProductionWorker` | Monnaie premium, production passive, transactions sécurisées |
| **retention** | `GET /retention`, `POST /retention/cards/:cardId/claim` | — | Cartes quotidiennes Phase 10, Oyez actif, projection de progression depuis les events métier Outbox |
| **onboarding** | `GET /onboarding?worldId=...` | — | Tutoriel scripté Phase 8, récompense initiale unique au premier village et projection séquentielle depuis les facts Outbox |
| **population** | `GET /population/:villageId` | — | Population courante / max via `getFarmPopulationLimit` |
| **power** | `GET /power?villageId=…`, `GET /power/village/:id/public`, `GET /power/kingdom`, `GET /power/kingdom/:userId/public?worldId=...`, `GET /power/leaderboard?worldId=...` | — | Calcul puissance bâtiments + armée d'un village (propriétaire), puissance bâtiments publique d'un village, puissance royaume world-scopée du joueur authentifié ou publique, leaderboard public de puissance par monde |
| **event** | WS `socket.io` | (consommé par `OutboxWorker`) | Gateway temps réel + `OutboxPublisher` (point unique de création d'events Outbox côté gameplay) |

## Sous-services notables

### Combat (le plus dense)

```
combat/
├── combat.service.ts             # Orchestration attaque/scout/renforts + rapports
├── combat.controller.ts
├── combat.worker.ts              # Job pg-boss déclenché à arrival time
├── capture-duration.ts           # Courbes fenêtre de capture + tempo.captureWindow
├── return.worker.ts              # Job retour d'armée
├── conquest.service.ts           # Logique de conquête de village
├── loot/                         # LootManager + providers (resources / building / etc.)
├── strategies/                   # BarbarianVillageStrategy, PlayerVillageStrategy
├── interfaces/                   # Types domaine combat
├── codecs/                       # parseUnitMap / parseLootResult / encode* (Zod, frontière JSON Prisma)
├── dto/                          # attack-command.schema.ts (Zod)
└── combat.utils.ts               # Helpers calcul (pertes, butin, distance, durée trajet)
```

Flow expédition (Attaque/Scout/Renfort) :
1. `POST /combat/attack`, `/combat/scout` ou `/combat/reinforce` → `CombatService.initiate*` valide + crée `Expedition` + déclenche job pg-boss à `arrivalAt`.
2. `CombatWorker.handle` → résout selon le `kind` (`ATTACK`: combat via stratégie ; `SCOUT`: snapshot `ScoutReport`, succès auto sans perte ; `REINFORCE`: stationnement en `Garrison`), crée les events adaptés (`battle.*`, `scout.*`, `reinforcement.*`).
3. Le retour d'un raid réutilise `Expedition.outboundTravelMs`, figé au dispatch, pour respecter "même vitesse qu'à l'aller" même si la config monde ou la stratégie changent avant résolution.
4. `ReturnWorker.handle` → ramène l'armée + butin après un combat/raid à `returnAt`, event `battle.returned`; si aucun survivant ni loot ne revient, aucun job retour n'est planifié. Pour un scout, il ramène les ESPIONs sans loot et émet `scout.returned`.
5. `POST /combat/recall/:expeditionId` rappelle une expédition sortante encore `EN_ROUTE` : passage en `RETURNING`, planification `combat:return`, event `expedition.recalled`, puis restitution sans combat par `ReturnWorker`.
6. `POST /combat/recall` crée aussi une `Expedition` de type `REINFORCE`, mais en sens retour ; son arrivée est traitée par `CombatWorker.handle`, qui réinjecte les unités au village d'origine et émet `reinforcement.returned`.

Lectures et contrôle de garnison :
- `GET /combat/:villageId/active` liste les expéditions sortantes `EN_ROUTE` ou `RETURNING` du village.
- `GET /combat/:villageId/garrison` retourne les lignes de garnison visibles par le propriétaire du village, avec `direction: INCOMING | OUTGOING` et les noms `hostVillageName` / `originVillageName` pour distinguer ce qui est stationné sur place de ce qui soutient un autre village.
- `POST /combat/recall` couvre les deux cas UI actuels : `Rappeler` un renfort envoyé ailleurs et `Renvoyer` un renfort stationné chez soi vers son village d'origine.

### World

```
world/
├── world.controller.ts
├── public-worlds.controller.ts
├── world.service.ts
├── world-config.service.ts          # Lecture/merge de world.config (JSON)
├── barbarian-seeding.service.ts     # Génération procédurale (Voronoi-like, density par zone)
├── barbarian-runtime.service.ts     # Stock initial + régénération lazy troupes/ressources BV
├── village-placement.service.ts     # Placement villages joueur dans des zones libres
└── barbarian-seeding-catchup.worker.ts  # Catchup d'arrivée différée (chunks non couverts par le seeding sync)
```

`WorldConfigService` est central : la migration d'`common/constants.ts` vers la config par-monde est en cours (objectif : permettre des serveurs à vitesses différentes sans redéploiement). `GET /worlds/public` expose les mondes planifiés/joignables/verrouillés avec identité, phase d'inscription dérivée, compteur de jour, `plannedOpenAt` et nombre de joueurs.

### Event

```
event/
├── game.gateway.ts                  # @WebSocketGateway, vérif JWT au handshake
├── event-outbox.service.ts          # Dispatcher : poll EventOutbox → Socket.IO
├── outbox-publisher.service.ts      # Writer : single domicile pour créer un event Outbox
├── event-types.ts                   # Union de tous les payloads d'events WS
├── event.utils.ts                   # Helper bas niveau `createOutboxEvent(tx, kind, ...)`
└── codecs/
    └── payload.codec.ts             # parseEventPayload<K> / encodeEventPayload<K> (Zod)
```

`OutboxPublisher` expose des méthodes nommées (`resourcesChanged`, `buildingCompleted`, `unitTrainingCompleted`) consommées par les use cases `gameplay/` et les workers (`ConstructionWorker`, `TrainingWorker`). Les services métier ne font plus jamais `tx.eventOutbox.create(...)` inline. Pour les events combat/crowns qui restent dans leurs propres bounded contexts, on utilise encore `createOutboxEvent` directement (l'extension à `OutboxPublisher` est possible mais pas urgente — cf. ADR-12).

### Gameplay

```
gameplay/
├── gameplay.module.ts
├── upgrade-building.use-case.ts     # POST /village/:id/upgrade
├── cancel-construction.use-case.ts  # DELETE /village/:id/buildings/:bid/cancel
├── recruit-troops.use-case.ts       # POST /army/:id/train
├── recruit-noble.use-case.ts        # POST /army/:id/throne/recruit-noble
└── cancel-recruitment.use-case.ts   # DELETE /army/:id/training/:tid/cancel
```

Chaque use case = une transaction Prisma qui orchestre plusieurs domaines (Village + Resources + Population + Outbox), expose une seule méthode `execute(...)`, et est appelé directement depuis les controllers correspondants. Cela résout les `forwardRef` historiques entre `Village ↔ Resources` et `Army ↔ Resources` (cf. ADR-12 et l'audit ticket 05).

## Invariant monde ENDED — lecture seule

`WorldAccessService` (`@Global`, `src/modules/world/world-access.service.ts`) expose `assertWorldWritable(worldId)` : lève `ForbiddenException` 403 code `WORLD_READ_ONLY` si le monde est `ENDED`.

Mutations gardées (appel obligatoire) : attack, scout, reinforce, caravan, train, recruit-noble, upgrade building, change strategy, claim daily card, claim onboarding completion reward.

Carve-outs autorisés sans garde : recall, cancel construction/training, produce/settle, report read/delete, rename cosmétique, join/enter/leave.

## Modules globaux

- **ConfigModule** (`@nestjs/config`) — lecture `.env`.
- **PrismaModule** — `PrismaService` injectable global.
- **LoggerModule** (`nestjs-pino`) — logger structuré, JSON en prod.

## Conventions de fichiers

```
modules/<bounded-context>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
├── <name>.controller.spec.ts        # optionnel si controller mince
├── <name>.service.spec.ts           # obligatoire si logique métier
└── dto/
    ├── <action>.dto.ts              # un DTO par action
    └── *.schema.ts                  # schémas Zod (préféré au class-validator pour le neuf)
```

## Endpoints — vue rapide

Le catalogue REST/WS canonique est dérivé du code (controllers NestJS + `EventOutbox.kind`). Voir aussi [`realtime.md`](./realtime.md) pour les events WebSocket.
