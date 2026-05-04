# Battle for the Crown — workspace

MMORTS médiéval (Kingsage / Tribal Wars). Workspace yarn avec :

- `battleforthecrown-pixi/` — **nouveau frontend** (Vite + React 19 + PixiJS v8 + Zustand + TanStack Query). Voir [son README](./battleforthecrown-pixi/README.md).
- `battleforthecrown/` — **legacy Next.js** (intact pendant la migration, sera supprimé après validation user). Branche d'archive : `legacy/nextjs-frontend` dans `battleforthecrown/.git`.
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + Socket.IO + pg-boss. Inchangé.
- `packages/shared/` — types et formules partagés (lecture seule pour les frontends).

## Migration en cours

La migration Next.js → Vite/Pixi est documentée dans `docs/migration/`. Voir :
- [`docs/migration/README.md`](./docs/migration/README.md) — index des phases.
- [`docs/migration/CHANGELOG.md`](./docs/migration/CHANGELOG.md) — journal détaillé phase par phase.

## Démarrage rapide

```bash
yarn install                                                    # installe tout

# Base de données (Postgres dans Docker)
cd battleforthecrown-backend && docker compose up -d
yarn workspace battleforthecrown-backend prisma migrate deploy
docker exec -i battleforthecrown-postgres psql -U postgres -d battleforthecrown \
  < battleforthecrown-backend/prisma/seed-default-world-config.sql

# Backend NestJS (port 15001)
PORT=15001 yarn workspace battleforthecrown-backend start:dev

# Nouveau frontend Pixi (port 5173)
yarn workspace battleforthecrown-pixi dev

# Legacy Next.js (port 3000) — optionnel, pour comparaison
yarn workspace battleforthecrown dev
```

## Conventions globales

- **Yarn**, jamais npm.
- **TypeScript strict** : pas de `any` pour faire taire le compilateur.
- **Server-authoritative** : le backend est l'unique vérité ; le frontend interpole entre updates WebSocket.
- **Outbox pattern** : toute mutation backend crée une ligne `EventOutbox` dans la même transaction.
- **Commits en EN** au format `<type>(<scope>): <subject>`. Échanges en FR avec l'utilisateur.
- Détails CLAUDE/AI : voir [`CLAUDE.md`](./CLAUDE.md).
