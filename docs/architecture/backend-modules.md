# Backend — modules et arborescence

> Référence détaillée de la structure NestJS du workspace `battleforthecrown-backend/`. Pour les conventions (Controllers/Services/DTOs/Guards), voir [`battleforthecrown-backend/.claude/rules/nest-conventions.md`](../../battleforthecrown-backend/.claude/rules/nest-conventions.md). Pour les workers et le pattern Outbox, voir [`battleforthecrown-backend/.claude/rules/workers.md`](../../battleforthecrown-backend/.claude/rules/workers.md).

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
│   ├── village/
│   ├── resources/
│   ├── army/
│   ├── combat/
│   ├── crowns/
│   ├── population/
│   ├── power/
│   └── event/               # Gateway WebSocket + EventOutbox
│
└── workers/                 # Jobs asynchrones pg-boss
    ├── workers.module.ts
    ├── production.worker.ts
    ├── construction.worker.ts
    ├── training.worker.ts
    ├── crown-production.worker.ts
    └── outbox.worker.ts
```

## Modules métiers

| Module | Endpoints clés | Workers | Notes |
|--------|----------------|---------|-------|
| **auth** | `POST /auth/login`, `/register`, `/refresh` | — | JWT + refresh tokens, sessions DB |
| **world** | `GET /world/:slug/details`, `/entities` | `BarbarianBackfillWorker` | Seeding procédural des villages barbares + placement joueur |
| **village** | `GET /village/:id/buildings`, `POST /upgrade`, `/cancel` | `ConstructionWorker` | File de construction, transactions DB pour upgrade |
| **resources** | `GET /resources/:villageId` | `ProductionWorker` | Production passive bois/pierre/fer, capé par warehouse |
| **army** | `GET /army/:villageId/inventory`, `/training`, `POST /train`, `/cancel` | `TrainingWorker` | Entraînement de troupes (MILITIA / ARCHER / CAVALRY / etc.) |
| **combat** | `POST /combat/attack`, `GET /combat/reports` | `CombatWorker`, `ReturnWorker` | Attaque, conquête, butin, retour. Stratégies `Barbarian` / `Player` |
| **crowns** | `GET /crowns/:userId` | `CrownProductionWorker` | Monnaie premium, production passive, transactions sécurisées |
| **population** | `GET /population/:villageId` | — | Population courante / max via `getFarmPopulationLimit` |
| **power** | `GET /power/village/:id`, `/kingdom/:userId` | — | Calcul puissance bâtiments + armée |
| **event** | WS `socket.io` | (consommé par `OutboxWorker`) | Gateway temps réel, JWT au handshake |

## Sous-services notables

### Combat (le plus dense)

```
combat/
├── combat.service.ts             # Orchestration attaque + résolution
├── combat.controller.ts
├── combat.worker.ts              # Job pg-boss déclenché à arrival time
├── return.worker.ts              # Job retour d'armée
├── conquest.service.ts           # Logique de conquête de village
├── loot/                         # LootManager + providers (resources / building / etc.)
├── strategies/                   # BarbarianVillageStrategy, PlayerVillageStrategy
├── interfaces/                   # Types domaine combat
└── combat.utils.ts               # Helpers calcul (pertes, butin, distance, durée trajet)
```

Flow attaque :
1. `POST /combat/attack` → `CombatService.initiateAttack` valide + crée `Combat` + déclenche job pg-boss à `arrivalAt`.
2. `CombatWorker.handle` → résout via la stratégie (Barbarian/Player), génère `CombatReport`, crée events `battle.resolved` + `village.attacked`/`conquered`.
3. `ReturnWorker.handle` → ramène l'armée + butin à `returnAt`, event `battle.returned`.

### World

```
world/
├── world.controller.ts
├── world.service.ts
├── world-config.service.ts          # Lecture/merge de world.config (JSON)
├── barbarian-seeding.service.ts     # Génération procédurale (Voronoi-like, density par zone)
├── village-placement.service.ts     # Placement villages joueur dans des zones libres
└── barbarian-backfill.worker.ts     # Reseed quand un village barbare disparait
```

`WorldConfigService` est central : la migration d'`common/constants.ts` vers la config par-monde est en cours (objectif : permettre des serveurs à vitesses différentes sans redéploiement).

### Event

```
event/
├── game.gateway.ts                  # @WebSocketGateway, vérif JWT au handshake
├── event-outbox.service.ts          # Helper pour créer un event dans une transaction
├── event-types.ts                   # Union de tous les payloads d'events WS
└── event.utils.ts                   # Routing par worldId / userId, sérialisation
```

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

Le contrat figé pour la migration Pixi est dans [`docs/migration/06-api-contract-snapshot.md`](../migration/06-api-contract-snapshot.md). À mettre à jour si l'API évolue post-migration.
