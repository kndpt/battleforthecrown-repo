# Battle for the Crown — workspace root

MMORTS médiéval style Kingsage / Tribal Wars. Yarn workspace avec :

- `battleforthecrown-pixi/` — frontend actif. Vite + React 19 + PixiJS v8 + Zustand + TanStack Query. Voir [`battleforthecrown-pixi/AGENTS.md`](./battleforthecrown-pixi/AGENTS.md).
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + Socket.IO + pg-boss. Voir [`battleforthecrown-backend/AGENTS.md`](./battleforthecrown-backend/AGENTS.md) + `.agents/rules/{nest-conventions,prisma,workers}.md`.
- `packages/shared/` — types et formules pures. **Lecture seule** depuis les frontends.

## Règles transversales

Voir [`.agents/rules/`](./.agents/rules/) pour le détail :
- [`conventions.md`](./.agents/rules/conventions.md) — TypeScript strict, yarn, server-authoritative, Outbox.
- [`git.md`](./.agents/rules/git.md) — commits EN au format `<type>(<scope>): <subject>`.
- [`docs.md`](./.agents/rules/docs.md) — vérifier à chaque tâche s'il faut créer, mettre à jour ou supprimer de la doc.
- [`qa.md`](./.agents/rules/qa.md) — QA obligatoire en fin de tâche : checklist user pour ce qui est observable en jeu, vérif backend faite par l'agent (curl/SQL/logs) sinon.
- [`tests.md`](./.agents/rules/tests.md) — **politique tests transversale (source unique)** : arbre de décision, types autorisés (unit pure-logic, smoke), anti-patterns. Lire avant d'écrire ou demander un test.

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

- **Mémoires** : chaque outil agentique a son store auto-chargé (Claude Code → `~/.claude/projects/<repo-hash>/memory/` ; Codex → `~/.codex/memories/`). Pas de store partagé entre outils — c'est managé par chaque harness.
- Si une instruction ici contredit ton training data ou le code observé, **fais confiance au code observé** et signale la contradiction.

## Layout `.agents/`, `.claude/`, `.codex/`

Le repo suit le standard ouvert [agentskills.io](https://agentskills.io) :

- **Source de vérité** : `.agents/{rules,skills}/` à chaque niveau (racine, backend, pixi).
- **Compat outils** : `.claude/{rules,skills}`, `.codex/{rules,skills}` et `.gemini/skills` sont des **symlinks** vers `.agents/`. Modifier un fichier ici = modifier la source.
- **Spécifique Claude** : `.claude/{agents,commands,agent-memory}/` + `settings.local.json` restent dans `.claude/` (formats propriétaires).
- **Spécifique Codex** : `.codex/agents/*.toml` (6 agents convertis depuis `.claude/agents/*.md` — `code_mapper`, `test_runner`, `run_planner`, `doc_writer`, `implementer`, `test_writer`. Format TOML, modèles OpenAI).
- `CLAUDE.md` à chaque niveau est un simple `@AGENTS.md` (import du standard).
