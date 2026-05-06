# Battle for the Crown — workspace root

MMORTS médiéval style Kingsage / Tribal Wars. Yarn workspace avec :

- `battleforthecrown-pixi/` — frontend actif. Vite + React 19 + PixiJS v8 + Zustand + TanStack Query. Voir [`battleforthecrown-pixi/CLAUDE.md`](./battleforthecrown-pixi/CLAUDE.md).
- `battleforthecrown/` — frontend legacy Next.js. **Ne pas modifier.** Sera supprimé après validation user (la branche d'archive `legacy/nextjs-frontend` existe déjà dans son `.git`).
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + Socket.IO + pg-boss. Voir [`battleforthecrown-backend/CLAUDE.md`](./battleforthecrown-backend/CLAUDE.md) + `.claude/rules/{nest-conventions,prisma,workers}.md`. Sous-repo avec son propre `.git`. **Ne pas toucher** sauf bug bloquant ou demande explicite.
- `packages/shared/` — types et formules pures. **Lecture seule** depuis les frontends.

## Règles transversales

Voir [`.claude/rules/`](./.claude/rules/) pour le détail :
- [`conventions.md`](./.claude/rules/conventions.md) — TypeScript strict, yarn, server-authoritative, Outbox.
- [`git.md`](./.claude/rules/git.md) — commits EN au format `<type>(<scope>): <subject>`.
- [`docs.md`](./.claude/rules/docs.md) — où vit la doc (architecture, gameplay).
- [`qa.md`](./.claude/rules/qa.md) — QA obligatoire en fin de tâche : checklist user pour ce qui est observable en jeu, vérif backend faite par l'agent (curl/SQL/logs) sinon.

## Commandes essentielles

```bash
yarn install                                                      # tous les workspaces
cd battleforthecrown-backend && docker compose up -d              # Postgres
yarn workspace battleforthecrown-backend prisma migrate deploy
PORT=15001 yarn workspace battleforthecrown-backend start:dev     # backend (15001)
yarn workspace battleforthecrown-pixi dev                         # frontend (5173)
```

DB et SQL utiles : [`docs/architecture/db-setup.md`](./docs/architecture/db-setup.md).

## Décisions d'architecture

Les choix structurants (stack, Outbox, reconciliation Pixi, optimistic UI, etc.) sont consignés dans [`docs/architecture/decisions.md`](./docs/architecture/decisions.md). À lire avant de remettre en cause une convention.

## Notes pour les agents

- Mémoires utilisateur globales : `~/.claude/CLAUDE.md` (auto-chargé).
- Mémoires projet (auto memory) : `~/.claude/projects/.../memory/` (auto-chargé pour ce repo).
- Si une instruction ici contredit ton training data ou le code observé, **fais confiance au code observé** et signale la contradiction.
