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

## Runs semi-autonomes

Système d'équipe Claude — lead orchestre, sub-agents à scope chirurgical exécutent.

**Slash commands**

- `/plan-run <description>` — crée fiche dans `tasks/runs/` (statut `PLANNED`). Lit roadmap + spec + carto code. Validation user avant écriture.
- `/run <id>` — exécute pipeline 1-10 sur fiche `PLANNED`. Termine `DONE` + commit + déplacement vers `tasks/runs/archive/`.

**Pipeline `/run`** : 0 préflight → 1 clarif (≤4Q) → 2 carto code → 3 refinement (lead) → 4 coding → 5 testing → 6 review 5 axes → 7 fix findings → 8 re-tests → 9 docs → 10 archive+commit. Hard gate `git diff` post chaque sub-agent qui écrit.

**Sub-agents** (`.claude/agents/`)

| Nom | Rôle | Modèle |
|---|---|---|
| `run-planner` | Draft de fiche depuis roadmap | opus |
| `code-mapper` | Carto module (signatures, callers, écarts) | haiku |
| `implementer` | Applique change cadré ≤5 fichiers, refus si ambigu | sonnet |
| `test-writer` | Tests selon `tests.md`, refus anti-patterns | sonnet |
| `test-runner` | Lance suite, retourne fails compacts | haiku |
| `doc-writer` | Crée/maj docs, refus duplication | sonnet |
| `agent-skills:code-reviewer` | Review 5 axes (built-in plugin) | sonnet |

**Docs** : pipeline détaillé [`tasks/runs/README.md`](./tasks/runs/README.md) ; mitigations [`tasks/runs/safety-fallbacks.md`](./tasks/runs/safety-fallbacks.md) ; roadmap MVP [`tasks/00-mvp-roadmap.md`](./tasks/00-mvp-roadmap.md).
