# Battle for the Crown — backend

NestJS 10 + Prisma 6 + PostgreSQL + pg-boss + Socket.IO. Server-authoritative — c'est lui qui calcule les ressources, valide les combats, planifie les jobs.

## Stack

- **NestJS** : architecture en couches `Controllers → Services → Prisma`.
- **Prisma** : ORM, source de vérité dans [`prisma/schema.prisma`](./prisma/schema.prisma).
- **pg-boss** : queue de jobs (production tick, finalisation construction/training, combat, retour d'armée, outbox).
- **Socket.IO** : temps réel, gateway `event/game.gateway.ts` alimenté par l'`OutboxWorker`.
- **Zod** (nouveau) / `class-validator` (legacy) : validation DTOs. Migrer vers Zod pour les nouveaux endpoints.

## Commandes

```bash
docker compose up -d                                # Postgres
yarn install
yarn prisma migrate deploy                          # appliquer les migrations
PORT=15001 yarn start:dev                           # backend (port 15001)
yarn test                                           # unit tests
yarn lint
yarn build
```

## Architecture en bref

```
src/
├── common/                  # pipes (zod), middleware, prisma types
├── infra/
│   ├── prisma/              # PrismaService global
│   └── pg-boss/             # PgBoss client global
├── modules/                 # bounded contexts (auth, world, village, resources, army, combat, crowns, population, power)
│   └── event/               # WebSocket gateway + EventOutbox
└── workers/                 # production, construction, training, crown-production, outbox
```

Chaque module = `controller.ts` + `service.ts` + `module.ts` + `dto/` + tests `*.spec.ts`. Détail [`docs/architecture/backend-modules.md`](../docs/architecture/backend-modules.md) à la racine du monorepo.

## Pattern Outbox (critique)

Toute mutation qui doit notifier le frontend écrit l'événement dans `EventOutbox` **dans la même transaction Prisma**. L'`OutboxWorker` poll ~1s, marque comme traité, et l'`event/game.gateway.ts` émet via Socket.IO. Délai mutation → event WS : 0–1 seconde.

Détail dans [`.agents/rules/workers.md`](./.agents/rules/workers.md) (Outbox section).

## Règles path-scoped

- [`.agents/rules/nest-conventions.md`](./.agents/rules/nest-conventions.md) — Controllers / Services / DTOs / Guards / structure modulaire.
- [`.agents/rules/prisma.md`](./.agents/rules/prisma.md) — accès données, transactions, N+1, migrations.
- [`.agents/rules/workers.md`](./.agents/rules/workers.md) — pg-boss, Outbox, isolation des erreurs.

## Tests

**Politique** : [`../.agents/rules/tests.md`](../.agents/rules/tests.md) (source unique transversale). Côté backend : pure-logic-only en unit (formules combat/monde, Zod, strategies, géométrie) ; orchestration (workers/controllers/services Prisma) → smoke (cf. [`../docs/architecture/smoke-tests.md`](../docs/architecture/smoke-tests.md)).

## Variables d'environnement

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_ACCESS_SECRET=...
PORT=15001
NODE_ENV=development
```

Auth : voir [`docs/architecture/auth.md`](../docs/architecture/auth.md).

## Notes pour les agents

- Pour tester un endpoint pendant l'implémentation, l'agent lance sa **propre instance** en background sur un port libre (ex `PORT=15002`) — accès direct aux logs/stack traces. Ne pas se reposer sur le serveur du user.
- Après modif `schema.prisma` → `yarn prisma generate`. Après modif `packages/shared` → `yarn workspace @battleforthecrown/shared build`. Sinon le runtime ment.
- Le frontend Pixi (`battleforthecrown-pixi/`) consomme cette API par REST + Socket.IO. Toute breaking change d'endpoint ou d'event WS doit être communiquée explicitement.
- Le sous-repo backend a son **propre `.git`** — committer dedans avec `git -C battleforthecrown-backend ...`.
- Si une instruction de l'`AGENTS.md` racine ou de `docs/` contredit le code observé, **fais confiance au code observé** et signale.
