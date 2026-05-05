# Battle for the Crown — workspace root

MMORTS médiéval style Kingsage / Tribal Wars. Yarn workspace avec :

- `battleforthecrown-pixi/` — frontend actif. Vite + React 19 + PixiJS v8 + Zustand + TanStack Query. Voir [`battleforthecrown-pixi/CLAUDE.md`](./battleforthecrown-pixi/CLAUDE.md).
- `battleforthecrown/` — frontend legacy Next.js. **Ne pas modifier.** Sera supprimé après validation user (la branche d'archive `legacy/nextjs-frontend` existe déjà dans son `.git`).
- `battleforthecrown-backend/` — NestJS + Prisma + Postgres + Socket.IO + pg-boss. Garde ses propres `AGENTS.md` / docs internes. **Ne pas toucher** sauf bug bloquant.
- `packages/shared/` — types et formules pures. **Lecture seule** depuis les frontends.

## Règles transversales

Voir [`.claude/rules/`](./.claude/rules/) pour le détail :
- [`conventions.md`](./.claude/rules/conventions.md) — TypeScript strict, yarn, server-authoritative, Outbox.
- [`git.md`](./.claude/rules/git.md) — commits EN au format `<type>(<scope>): <subject>`.
- [`docs.md`](./.claude/rules/docs.md) — où vit la doc (migration, architecture, gameplay).

## Commandes essentielles

```bash
yarn install                                                      # tous les workspaces
cd battleforthecrown-backend && docker compose up -d              # Postgres
yarn workspace battleforthecrown-backend prisma migrate deploy
PORT=15001 yarn workspace battleforthecrown-backend start:dev     # backend (15001)
yarn workspace battleforthecrown-pixi dev                         # nouveau front (5173)
```

DB et SQL utiles : [`docs/migration/db-setup.md`](./docs/migration/db-setup.md).

## Migration Pixi

La migration Next.js → Vite/Pixi est documentée :
- [`docs/migration/README.md`](./docs/migration/README.md) — index des phases.
- [`docs/migration/CHANGELOG.md`](./docs/migration/CHANGELOG.md) — journal phase par phase.
- [`docs/migration/03-migration-plan.md`](./docs/migration/03-migration-plan.md) — plan détaillé des 9 phases.

À l'issue de la migration : seul `battleforthecrown-pixi/` reste actif. Le legacy sera retiré quand l'utilisateur l'aura validé.

**Phase 9 (post-run nocturne) — fidélité design** : 9.A/B/C/E + L1-L8 (HUD in-game fidèle au legacy : `GameHeader` 2-rangs, `BottomNavigationBar`, `BuildingCard`, `QueueFloatingButton` + `QueueBottomSheet`, `BuildingManagementPanel`, `BuildingDetailModal`, `VillageView`) livrés le 2026-05-05. **9.D reporté** — Army/Combat (rapports complets)/Crowns/Power restent sur des stubs. Détail complet dans [`docs/migration/CHANGELOG.md` § Phase 9](./docs/migration/CHANGELOG.md#phase-9--fidélité-design-assets--ui-test--composants-2026-05-05) et plan dans [`docs/migration/03-migration-plan.md` § Phase 9](./docs/migration/03-migration-plan.md#phase-9).

## Notes pour les agents

- Mémoires utilisateur globales : `~/.claude/CLAUDE.md` (auto-chargé).
- Mémoires projet (auto memory) : `~/.claude/projects/.../memory/` (auto-chargé pour ce repo).
- Si une instruction ici contredit ton training data ou le code observé, **fais confiance au code observé** et signale la contradiction.
