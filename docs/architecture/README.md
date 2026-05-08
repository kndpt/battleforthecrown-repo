# Architecture — Battle for the Crown

Documentation technique de référence (humaine) pour les agents et les contributeurs.

## Index

- [`decisions.md`](./decisions.md) — ADR consolidé : décisions structurantes (stack, Outbox, reconciliation Pixi, etc.) et leur **pourquoi**.
- [`backend-modules.md`](./backend-modules.md) — arborescence NestJS, modules métiers, sous-services notables (combat, world, event).
- [`data-model.md`](./data-model.md) — entités Prisma, relations, conventions de schéma, pièges connus.
- [`realtime.md`](./realtime.md) — pattern Outbox, gateway WebSocket, catalogue d'événements, latence, reconnection.
- [`auth.md`](./auth.md) — JWT global, `@Public()` opt-out, `OwnershipService`, handshake WS, modèle de menace.
- [`db-setup.md`](./db-setup.md) — bootstrap Postgres + Prisma, snippets SQL de debug, reset.
- [`smoke-tests.md`](./smoke-tests.md) — stratégie smokes orchestration/I/O : flows couverts, comment ajouter, anti-patterns.

## À lire avant tout travail backend

1. **`backend-modules.md`** pour situer le module concerné dans la hiérarchie.
2. **`data-model.md`** pour valider la forme de la donnée que tu vas lire/écrire.
3. **`realtime.md`** si la mutation doit notifier le frontend (presque toujours).
4. **`decisions.md`** pour comprendre le pourquoi d'une convention avant de la remettre en cause.

## Conventions transversales

- TypeScript strict, yarn, server-authoritative — voir [`.claude/rules/conventions.md`](../../.claude/rules/conventions.md).
- Commits EN au format `<type>(<scope>): <subject>` — voir [`.claude/rules/git.md`](../../.claude/rules/git.md).
- Doc humain ici dans `docs/`. Doc opérationnelle Claude dans les `CLAUDE.md` + `.claude/rules/` des workspaces.

## Workspaces

| Workspace | CLAUDE.md | .claude/rules/ |
|-----------|-----------|----------------|
| `battleforthecrown-pixi/` | [pixi CLAUDE.md](../../battleforthecrown-pixi/CLAUDE.md) | `pixi-conventions.md`, `react-hud.md` |
| `battleforthecrown-backend/` | [backend CLAUDE.md](../../battleforthecrown-backend/CLAUDE.md) | `nest-conventions.md`, `prisma.md`, `workers.md` |
| `packages/shared/` | — (code pur, pas de domaine) | — |

## Liens connexes

- Gameplay : [`docs/gameplay/`](../gameplay/README.md)
