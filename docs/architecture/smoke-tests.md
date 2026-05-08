# Smoke tests — orchestration & I/O

Source unique de la stratégie : [`.claude/rules/tests.md`](../../.claude/rules/tests.md).
Ce document décrit la mise en œuvre concrète : où ils vivent, comment les lancer, comment en ajouter un.

## Où

```
battleforthecrown-backend/test/
├── smoke.spec.ts             # 1 describe, 1 boot, 1 it() par flow
├── helpers.ts                # bootSmokeApp, truncateAll, registerUser, joinWorld, waitFor, outboxDispatched
├── jest-smoke.json           # config Jest dédiée (testRegex smoke.spec.ts$, runInBand)
├── jest-smoke-setup.ts       # env vars (DATABASE_URL smoke, JWT secrets de test)
└── fixtures/smoke-world-config.ts   # WorldConfig avec gameSpeed élevé (durations clampées au 1s minimum)
```

## Comment lancer

```bash
yarn workspace battleforthecrown-backend test:smoke
```

Pré-requis : la base `battleforthecrown_smoke` doit exister + migrations appliquées (cf. [`db-setup.md`](./db-setup.md)). Un seul boot AppModule, ~23s pour les 10 flows.

## Flows couverts

| # | Flow | Trigger | Assertion |
|---|---|---|---|
| 1 | production tick | `boss.send('production:tick')` | `ResourceStock.lastUpdateTs` bumped (no Outbox by design) |
| 2 | construction | `POST /village/:id/upgrade` | `Building.level=2` + `building.completed` dispatched |
| 3 | training | `POST /army/:id/train` | `UnitInventory.quantity≥1` + `unit.training.completed` dispatched |
| 4 | combat resolve+return | `POST /combat/attack` | `battle.resolved` + `battle.returned` dispatched |
| 5 | conquest | `ConquestService.conquerVillage()` | `Village.userId` reassigned + `village.conquered` dispatched |
| 6 | crown production | `boss.send('crowns:production')` | `crowns.changed` dispatched |
| 7 | barbarian backfill | `BarbarianBackfillWorker.handleBackfill()` | new BVs seeded in DB (no Outbox by design) |
| 8 | JWT auth + refresh | REST register/login/refresh | tokens valides, route protégée 200 |
| 9 | fog of war | `GET /world/:id/entities` | barbares hors vision portent `kind: 'fogged'` |
| 10 | outbox dispatch (transversal) | upgrade WOOD + Socket.IO client | client reçoit `building.completed` via WS réel |

## Quand ajouter un smoke

À chaque ajout :
- d'un **worker pg-boss** (ex : nouvelle queue) ;
- d'un **event Outbox** (nouveau `kind` dans `event-types.ts`) ;
- d'un **endpoint critique** qui touche aux flows ci-dessus.

À l'inverse, **pas de smoke** pour : helpers purs, formules, validation Zod isolée — un unit test pure-logic suffit.

## Comment ajouter un smoke

1. Dans `smoke.spec.ts`, ajouter un `it()` dans le `describe` global.
2. Pattern : `seedSmokeWorld → registerUser → joinWorld → mutation → waitFor(state DB) → outboxDispatched(...)`.
3. Pour les flows de longue durée (combat, training), ajuster `gameSpeed.travel` ou `gameSpeed.training` dans la fixture si le timing est trop lent — `construction`/`training` sont déjà clampés à 1s minimum côté shared.
4. Pour un nouveau `kind` Outbox : retrouver l'`aggregateId` réel dans le publisher (`outbox-publisher.service.ts`) ou le worker — c'est lui qu'on filtre.

## Anti-patterns

Cf. [`.claude/rules/tests.md`](../../.claude/rules/tests.md). Rappel critique :

- **Jamais** mocker `PrismaService` ou `pg-boss` dans un smoke.
- **Jamais** asserter sur `mock.toHaveBeenCalledWith(...)` — on assert sur l'effet (DB row, event row dispatched).
- **Jamais** lancer les smokes sur la DB dev (`battleforthecrown`) — toujours sur `battleforthecrown_smoke`.

## Points connus

- **Production tick et barbarian backfill n'écrivent pas dans l'Outbox** : choix archi (frontend interpole pour les ressources ; le backfill est invisible côté UI). Le smoke valide l'effet DB seul.
- **Crown production** gate l'event sur `production > 0`. Le smoke backdate `lastUpdateTs` d'1 jour pour forcer une production mesurable.
- **Le flow combat → conquête** demande un NOBLE (BARRACKS lvl 10). Le smoke `conquest` court-circuite via `ConquestService.conquerVillage()` direct — c'est le service métier, pas le combat.
