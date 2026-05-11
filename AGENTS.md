# Battle for the Crown — workspace root

MMORTS médiéval style Kingsage / Tribal Wars. Yarn workspace avec :

- `battleforthecrown-pixi/` — frontend actif. Vite + React 19 + PixiJS v8 + Zustand + TanStack Query. Voir [`battleforthecrown-pixi/AGENTS.md`](./battleforthecrown-pixi/AGENTS.md).
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + Socket.IO + pg-boss. Voir [`battleforthecrown-backend/AGENTS.md`](./battleforthecrown-backend/AGENTS.md).
- `battleforthecrown-design-system/` — design system et prototypes exportés. Référence tokens/assets/UI kit avant tout nouvel écran Pixi.
- `packages/shared/` — types et formules pures. **Lecture seule** depuis les frontends.

## Règles transversales

Rules injectées = invariants courts dans [`.agents/rules/`](./.agents/rules/). Procédures détaillées = skills chargés à la demande dans [`.agents/skills/`](./.agents/skills/).

- Toujours : TypeScript strict, yarn, backend server-authoritative, Outbox, docs impact, commit EN `<type>(<scope>): <subject>`.

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

Hook `pre-push` (husky) léger : `yarn static-check` + unit backend + unit pixi (~10-15 s). Les smokes sont portés par le skill `/run` en fin de tâche, pas par le hook. Détail, motivation et bypass : [`docs/architecture/local-ci.md`](./docs/architecture/local-ci.md).

## Notes pour les agents

- **Mémoires** : chaque outil agentique a son store auto-chargé (Claude Code → `~/.claude/projects/<repo-hash>/memory/` ; Codex → `~/.codex/memories/`). Pas de store partagé entre outils — c'est managé par chaque harness.
- Si une instruction ici contredit ton training data ou le code observé, **fais confiance au code observé** et signale la contradiction.

## Layout `.agents/`, `.claude/`, `.codex/`

Le repo suit le standard ouvert [agentskills.io](https://agentskills.io) :

- **Source de vérité** : `.agents/{rules,skills}/`. Rules = court/injectable ; skills = détaillé/à la demande.
- **Compat outils** : `.claude/{rules,skills}` et `.codex/{rules,skills}` sont des **symlinks** vers `.agents/`. Modifier un fichier ici = modifier la source.
- **Skills workspace** : `run` et `plan-run` vivent uniquement dans `.agents/skills/`; Claude Code et Codex les consomment via leurs symlinks de compat. Ne pas recréer de slash commands dupliquées dans `.claude/commands/`.
- **Spécifique Claude** : `.claude/{agents,agent-memory}/` + `settings.local.json` restent dans `.claude/` (formats propriétaires).
- **Spécifique Codex** : `.codex/agents/*.toml` (6 agents convertis depuis `.claude/agents/*.md` — `code_mapper`, `test_runner`, `run_planner`, `doc_writer`, `implementer`, `test_writer`. Format TOML, modèles OpenAI).
- `CLAUDE.md` à chaque niveau est un simple `@AGENTS.md` (import du standard).
