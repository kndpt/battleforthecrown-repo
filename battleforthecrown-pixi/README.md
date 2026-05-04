# battleforthecrown-pixi

Nouveau frontend Battle for the Crown : Vite + React 19 + PixiJS v8 + Zustand + TanStack Query.

> Le legacy Next.js vit dans `../battleforthecrown/` jusqu'à validation user (suppression Phase 7+). Sa branche `main` est aussi disponible sous `legacy/nextjs-frontend` dans le `.git` du legacy.

## Démarrer le dev

Backend + DB requis :

```bash
cd ../battleforthecrown-backend && docker compose up -d
yarn workspace battleforthecrown-backend prisma migrate deploy
PORT=15001 yarn workspace battleforthecrown-backend start:dev
```

Front Pixi :

```bash
yarn workspace battleforthecrown-pixi dev    # http://localhost:5173
```

## Scripts

| Script | Détail |
|---|---|
| `yarn workspace battleforthecrown-pixi dev` | Vite dev server (HMR). |
| `yarn workspace battleforthecrown-pixi build` | Build prod (`dist/`). |
| `yarn workspace battleforthecrown-pixi test` | Vitest run (53+ tests). |
| `yarn workspace battleforthecrown-pixi test:watch` | Vitest watch. |
| `yarn workspace battleforthecrown-pixi type-check` | `tsc --noEmit`. |
| `yarn workspace battleforthecrown-pixi lint` | ESLint flat config. |

## Structure

```
src/
├── api/                # client REST + WS singleton + queries TanStack
├── features/
│   ├── auth/           # login, register, ProtectedRoute, landing
│   ├── worlds/         # WorldSelector, MyWorldsScreen
│   ├── game/           # GameScreen + GameSession
│   ├── village/        # HUD bâtiments + VillageCanvas (Pixi top-down)
│   ├── world/          # WorldMapScreen + WorldMapCanvas (Pixi 2D)
│   ├── resources/      # ResourceBar interpolée
│   ├── combat/         # ExpeditionList HUD
│   └── layout/         # GameHeader, NavRail, ToastStack, DebugOverlay
├── pixi/
│   ├── application.ts  # factory new Application().init()
│   ├── PixiCanvas.tsx  # mount/unmount React-friendly
│   ├── scenes/         # SceneManager, BootScene, WorldMapScene, VillageScene
│   └── entities/       # BuildingSprite, ExpeditionVisual
├── stores/             # Zustand : auth, game, resources, crowns, ui, worldMap, expeditions
├── lib/                # cn, env, interpolation, useTickingNow, types, helpers
├── ui/                 # primitives portées du legacy (Button, Card, Modal, …)
└── App.tsx             # routing + lazy-loaded GameScreen / WorldMapScreen
```

## Routes

| Path | Description |
|---|---|
| `/` | Landing |
| `/auth/login`, `/auth/register` | Auth |
| `/worlds` | Liste des mondes (rejoindre) |
| `/my-worlds` | Mes mondes (sélectionner) |
| `/game` | Vue village (HUD + canvas Pixi top-down) |
| `/game/world` | Carte du monde (canvas Pixi 2D + entités) |

Routes protégées par `ProtectedRoute` (token JWT + worldId pour `/game`).

## Bundle

L'index initial fait ~363 KB JS / ~109 KB gzip (sans Pixi). Pixi + viewport + scenes sont lazy-chargés au besoin via `React.lazy`. Voir `dist/` après `yarn build`.

## Conventions

- TypeScript strict (pas de `any` complaisant).
- Zustand pour le state global ; TanStack Query pour le cache REST ; Socket.IO pour le temps réel.
- Mutations server-authoritative — optimistic UI uniquement quand le rollback est réversible.
- Pas de Redux (le legacy l'utilisait).

## Documentation migration

`../docs/migration/CHANGELOG.md` documente chaque phase du run autonome (DB → auth → WS → HUD → WorldMap → VillageScene → expéditions → polish).
