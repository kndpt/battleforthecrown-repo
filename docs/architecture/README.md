# Architecture — Battle for the Crown

Documentation technique de référence (humaine) pour les agents et les contributeurs.

## Index

- [`backend-modules.md`](./backend-modules.md) — arborescence NestJS, modules métiers, sous-services notables (combat, world, event).
- [`data-model.md`](./data-model.md) — entités Prisma, relations, conventions de schéma, pièges connus.
- [`realtime.md`](./realtime.md) — pattern Outbox, gateway WebSocket, catalogue d'événements, latence, reconnection.

## À lire avant tout travail backend

1. **`backend-modules.md`** pour situer le module concerné dans la hiérarchie.
2. **`data-model.md`** pour valider la forme de la donnée que tu vas lire/écrire.
3. **`realtime.md`** si la mutation doit notifier le frontend (presque toujours).

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
- Migration en cours : [`docs/migration/`](../migration/README.md)
- Setup DB local : [`docs/migration/db-setup.md`](../migration/db-setup.md)
