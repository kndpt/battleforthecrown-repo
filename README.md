# Battle for the Crown — workspace

MMORTS médiéval (Kingsage / Tribal Wars). Workspace yarn avec :

- `battleforthecrown-pixi/` — **frontend actif** (Vite + React 19 + PixiJS v8 + Zustand + TanStack Query). Voir [son README](./battleforthecrown-pixi/README.md).
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + Socket.IO + pg-boss.
- `packages/shared/` — types et formules partagés (lecture seule pour les frontends).

## Documentation

- Décisions structurantes : [`docs/architecture/decisions.md`](./docs/architecture/decisions.md).
- Doc technique de référence : [`docs/architecture/`](./docs/architecture/README.md).
- Mécaniques de jeu : [`docs/gameplay/`](./docs/gameplay/README.md).
- Briefings AI agents : `CLAUDE.md` à la racine et dans chaque workspace.

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
```

## Conventions globales

- **Yarn**, jamais npm.
- **TypeScript strict** : pas de `any` pour faire taire le compilateur.
- **Server-authoritative** : le backend est l'unique vérité ; le frontend interpole entre updates WebSocket.
- **Outbox pattern** : toute mutation backend crée une ligne `EventOutbox` dans la même transaction.
- **Commits en EN** au format `<type>(<scope>): <subject>`. Échanges en FR avec l'utilisateur.
- Détails CLAUDE/AI : voir [`CLAUDE.md`](./CLAUDE.md).
