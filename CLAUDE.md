# Battle for the Crown — workspace root

MMORTS médiéval style Kingsage / Tribal Wars. Yarn workspace avec :

- `battleforthecrown-pixi/` — frontend actif. Vite + React 19 + PixiJS v8 + Zustand + TanStack Query. Voir [`battleforthecrown-pixi/CLAUDE.md`](./battleforthecrown-pixi/CLAUDE.md).
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + Socket.IO + pg-boss. Voir [`battleforthecrown-backend/CLAUDE.md`](./battleforthecrown-backend/CLAUDE.md) + `.claude/rules/{nest-conventions,prisma,workers}.md`.
- `packages/shared/` — types et formules pures. **Lecture seule** depuis les frontends.

## Règles transversales

Voir [`.claude/rules/`](./.claude/rules/) pour le détail :
- [`conventions.md`](./.claude/rules/conventions.md) — TypeScript strict, yarn, server-authoritative, Outbox.
- [`git.md`](./.claude/rules/git.md) — commits EN au format `<type>(<scope>): <subject>`.
- [`docs.md`](./.claude/rules/docs.md) — vérifier à chaque tâche s'il faut créer, mettre à jour ou supprimer de la doc.
- [`qa.md`](./.claude/rules/qa.md) — QA obligatoire en fin de tâche : checklist user pour ce qui est observable en jeu, vérif backend faite par l'agent (curl/SQL/logs) sinon.
- [`tests.md`](./.claude/rules/tests.md) — **politique tests transversale (source unique)** : arbre de décision, types autorisés (unit pure-logic, smoke), anti-patterns. Lire avant d'écrire ou demander un test.

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

## Filet automatisé

Hook `pre-push` (husky) qui lance `yarn test` (~30-45 s : unit backend + unit pixi + smokes orchestration). Tout ce qui est push est vérifié vert. Détail et bypass : [`docs/architecture/local-ci.md`](./docs/architecture/local-ci.md).

## Notes pour les agents

- Mémoires utilisateur globales : `~/.claude/CLAUDE.md` (auto-chargé).
- Mémoires projet (auto memory) : `~/.claude/projects/.../memory/` (auto-chargé pour ce repo).
- Si une instruction ici contredit ton training data ou le code observé, **fais confiance au code observé** et signale la contradiction.
