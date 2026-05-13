# Smoke tests — orchestration & I/O

Source unique de la stratégie : skill [`bftc-tests-policy`](../../.agents/skills/bftc-tests-policy/SKILL.md).
Ce document décrit la mise en œuvre concrète : où ils vivent, comment les lancer, comment en ajouter un.

## Où

```
battleforthecrown-backend/test/
├── smoke.spec.ts             # 1 describe, 1 boot, 1 it() par flow
├── helpers.ts                # bootSmokeApp, truncateAll, registerUser, joinWorld, waitFor, outboxDispatched
├── jest-smoke.json           # config Jest dédiée (testRegex smoke.spec.ts$, runInBand)
├── jest-smoke-setup.ts       # env vars (DATABASE_URL smoke, JWT secrets de test)
└── fixtures/smoke-world-config.ts   # WorldConfig avec gameSpeed élevé
```

## Comment lancer

```bash
yarn workspace battleforthecrown-backend test:smoke
```

Pré-requis : la base `battleforthecrown_smoke` doit exister + migrations appliquées (cf. [`db-setup.md`](./db-setup.md)). La commande lance d'abord `scripts/smoke-preflight.sh` pour vérifier Docker, la DB smoke et `prisma migrate status`. Un seul boot AppModule, ~100s pour la suite complète locale actuelle.

## Flows couverts

| # | Flow | Trigger | Assertion |
|---|---|---|---|
| 1 | production tick | `boss.send('production:tick')` | `ResourceStock.lastUpdateTs` bumped (no Outbox by design) |
| 2 | construction | `POST /village/:id/upgrade` | `Building.level=2` + `building.completed` dispatched |
| 3 | training | `POST /army/:id/train` | `UnitInventory.quantity≥1` + `unit.training.completed` dispatched |
| 4 | combat resolve+return | `POST /combat/attack` | `battle.resolved` + `battle.returned` dispatched |
| 5 | combat report supprimé pendant retour | `POST /combat/attack` puis `DELETE /combat/report/:id` | expédition supprimée, troupes/loot revenus, `battle.returned.reportId = null` dispatched |
| 6 | combat reports participant-scoped | REST reports read/delete | lu/suppression isolés par participant |
| 7 | target outside vision | `POST /combat/attack` | 403 |
| 8 | scouting resolve+return | `POST /combat/scout` | SPY gate Caserne 3, SPY-only, `ScoutReport`, `scout.reported` + `scout.returned`, style ennemi absent du public |
| 9 | conquest | combat + `PendingConquest` + `conquest:finalize` | fenêtre de capture, Seigneur immobilisé, finalisation, village matérialisé spec + events dispatched |
| 10 | crown production | `boss.send('crowns:production')` | `crowns.changed` dispatched |
| 11 | barbarian seeding catchup | `BarbarianSeedingCatchupWorker.handleCatchup()` | new BVs seeded in DB for players created < 1h (no Outbox by design) |
| 12 | JWT auth + refresh | REST register/login/refresh | tokens valides, route protégée 200 |
| 13 | fog of war | `GET /world/:id/entities` | barbares hors vision portent `kind: 'fogged'` |
| 14 | outbox dispatch (transversal) | upgrade WOOD + Socket.IO client | client reçoit `building.completed` via WS réel |

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

Cf. [`bftc-tests-policy`](../../.agents/skills/bftc-tests-policy/SKILL.md). Rappel critique :

- **Jamais** mocker `PrismaService` ou `pg-boss` dans un smoke.
- **Jamais** asserter sur `mock.toHaveBeenCalledWith(...)` — on assert sur l'effet (DB row, event row dispatched).
- **Jamais** lancer les smokes sur la DB dev (`battleforthecrown`) — toujours sur `battleforthecrown_smoke`.

## Points connus

- **Production tick et barbarian seeding catchup n'écrivent pas dans l'Outbox** : choix archi (frontend interpole pour les ressources ; le catchup est invisible côté UI). Le smoke valide l'effet DB seul.
- **Crown production** gate l'event sur `production > 0`. Le smoke backdate `lastUpdateTs` d'1 jour pour forcer une production mesurable.
- **Le flow combat → conquête** demande un NOBLE recruté à la Salle du Trône. Les smokes dédiés couvrent le recrutement, l'ouverture de fenêtre après combat, la mort du Seigneur, l'interruption et la finalisation `conquest:finalize`.
