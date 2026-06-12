# Architecture — Battle for the Crown

Documentation technique de référence (humaine) pour les agents et les contributeurs.

## Index

- [`decisions.md`](./decisions.md) — ADR consolidé : décisions structurantes (stack, Outbox, reconciliation Pixi, etc.) et leur **pourquoi**.
- [`backend-modules.md`](./backend-modules.md) — arborescence NestJS, modules métiers, sous-services notables (combat, world, event).
- [`data-model.md`](./data-model.md) — entités Prisma, relations, conventions de schéma, pièges connus.
- [`realtime.md`](./realtime.md) — pattern Outbox, gateway WebSocket, catalogue d'événements, latence, reconnection.
- [`auth.md`](./auth.md) — JWT global, `@Public()` opt-out, `OwnershipService`, handshake WS, modèle de menace.
- [`db-setup.md`](./db-setup.md) — bootstrap Postgres + Prisma, snippets SQL de debug, reset.
- [`codex-cloud.md`](./codex-cloud.md) — setup Codex Cloud pour `bftc-run`, DB dev, smokes et QA `curl`.
- [`cursor-cloud.md`](./cursor-cloud.md) — setup Cursor Cloud Agents (`.cursor/environment.json`), harness identique, PR GitHub.
- [`worktree-dev.md`](./worktree-dev.md) — référence humaine pour lancer backend/frontend depuis un worktree parallèle. Les agents utilisent le skill `bftc-worktree-qa` comme point d'entrée opérationnel.
- [`smoke-tests.md`](./smoke-tests.md) — stratégie smokes orchestration/I/O : flows couverts, comment ajouter, anti-patterns.
- [`balance-and-tempo.md`](./balance-and-tempo.md) — guide ops : où vivent les constantes de durées/coûts/productions, comment éditer le seed `world.config`, workflow rebuild.
- [`map-focus-navigation.md`](./map-focus-navigation.md) — contrat URL/helper pour ouvrir la WorldMap centrée sur des coordonnées sans sélectionner d'entité.

## À lire avant tout travail backend

1. **`backend-modules.md`** pour situer le module concerné dans la hiérarchie.
2. **`data-model.md`** pour valider la forme de la donnée que tu vas lire/écrire.
3. **`realtime.md`** si la mutation doit notifier le frontend (presque toujours).
4. **`decisions.md`** pour comprendre le pourquoi d'une convention avant de la remettre en cause.

## Conventions transversales

- TypeScript strict, yarn, server-authoritative — voir [`.agents/rules/conventions.md`](../../.agents/rules/conventions.md).
- Commits EN au format `<type>(<scope>): <subject>` — voir [`.agents/rules/git.md`](../../.agents/rules/git.md).
- Doc humain ici dans `docs/`. Instructions agentiques dans `AGENTS.md` + `.agents/{rules,skills}/`.

## Workspaces

| Workspace | Instructions | Skills/rules spécialisés |
|-----------|--------------|--------------------------|
| `battleforthecrown-pixi/` | [pixi AGENTS.md](../../battleforthecrown-pixi/AGENTS.md) | `bftc-react-hud`, `bftc-pixi-scene` |
| `battleforthecrown-backend/` | [backend AGENTS.md](../../battleforthecrown-backend/AGENTS.md) | `bftc-prisma`, `bftc-workers-outbox`, `nest-conventions.md` |
| `battleforthecrown-design-system/` | [design system README](../../battleforthecrown-design-system/README.md) | Tokens, assets, prototypes, UI kit |
| `packages/shared/` | — (code pur, pas de domaine) | — |

## Liens connexes

- Gameplay : [`docs/gameplay/`](../gameplay/README.md)
- Design system : [`battleforthecrown-design-system/`](../../battleforthecrown-design-system/README.md)
