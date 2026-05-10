# battleforthecrown-pixi — briefing AI

Frontend Battle for the Crown : Vite + React 19 + PixiJS v8 + Zustand + TanStack Query.

> Briefing court. Le détail vit dans [`./README.md`](./README.md), les conventions techniques dans [`./.agents/rules/`](./.agents/rules/), les décisions structurantes dans [`../docs/architecture/decisions.md`](../docs/architecture/decisions.md).

## Règles transversales

- TypeScript strict, **pas de `any`** complaisant.
- Yarn (jamais npm).
- Server-authoritative — le backend est l'unique vérité, le front interpole entre updates WebSocket.
- Outbox : tout event WS arrive 0 à ~1s après la mutation REST associée.
- Commits EN : `<type>(<pixi-frontend|pixi/<scope>>): <subject>`.

## Stack

- **Routing** : `react-router` v7. Routes lazy (`React.lazy`) pour `GameScreen` et `WorldMapScreen` afin d'isoler la stack Pixi du bundle initial.
- **State global** : Zustand (persistance localStorage pour `auth` et `game`). Voir `src/stores/`.
- **Cache REST** : `@tanstack/react-query` v5. Mutations optimistic quand le rollback est réversible.
- **WebSocket** : `socket.io-client`, singleton `gameSocket` dans `src/api/ws.ts`. Reconnection native socket.io (10 attempts, backoff 5s max).
- **Pixi v8** : `Application` initialisée avec `await app.init({...})`. Les scènes sont des factories qui retournent `{view, enter, exit, update}` ; le `SceneManager` gère stage + ticker.

## Conventions Pixi

- **Reconciliation** : sur changement de store, ne pas re-créer les containers existants. Utiliser une `Map<id, Visual>` interne au scene handle (`reconcile`, `setSelected`, etc.).
- **Subscribe Pixi-only** : la scène s'abonne au store Zustand via `store.subscribe()` *en dehors* de React, pour éviter les re-renders inutiles. Le canvas React (ex `WorldMapCanvas.tsx`) ne re-render pas quand les entités bougent.
- **Update via ticker** : pour les animations (interpolation expéditions, progress bar construction), implémenter `scene.update(deltaMs)` que le `SceneManager` branche au ticker Pixi.
- **Placeholders** : pour la migration nocturne, beaucoup de visuels sont des `Graphics` colorées + emoji `Text`. Les sprites finaux viendront avec les assets définitifs.

## Conventions React HUD

- **Tailwind 3.4** avec palette `kingdom`, `game.{green,blue,red,gold,stone}`, `parchment`. Pas de styled-components, pas de CSS modules.
- **UI primitives** : `src/ui/` (Clash-like, CVA + Tailwind). Catalogue → [`docs/ui-library.md`](./docs/ui-library.md) · Design system → [`docs/ui-design-system.md`](./docs/ui-design-system.md) · Tone & writing → [`docs/ui-writing-style.md`](./docs/ui-writing-style.md). UI idiote : zéro logique métier dans `src/ui/`.
- **Pas de Redux** (le legacy en avait). Migrer toute logique d'état vers Zustand ou TanStack Query.
- **Optimistic UI** : pattern `onMutate` (snapshot previous, mutate cache) → `onError` (rollback) → `onSettled` (invalidate). Voir `useUpgradeBuildingMutation`.

## Path alias

`@/*` → `./src/*` (configuré dans `tsconfig.app.json` + `vite.config.ts` + `vitest.config.ts`).

## Tests

**Politique** : [`../.agents/rules/tests.md`](../.agents/rules/tests.md) (source unique transversale — quand écrire un test, quel type, anti-patterns).

Couverture actuelle Vitest (jsdom) :
- `lib/` helpers purs (cn, interpolation, construction progress).
- `api/` client (refresh JWT 401), WS bindings.
- `stores/` (worldMap, expeditions).
- `pixi/entities/` math (Bezier, progress).
- `features/world/` (buildMapEntities), `pixi/scenes/` (villageLayout invariants).

Lance `yarn workspace battleforthecrown-pixi test`.

## Pour démarrer

Voir [`./README.md`](./README.md). Backend obligatoire pour tester l'app au-delà du landing.
