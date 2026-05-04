# 02 — Architecture cible

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                  battleforthecrown-pixi/                    │
│                  (Vite + React + PixiJS v8)                 │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐ │
│   │            React HUD (Tailwind 3 / 4)                │ │
│   │  • Login / Register / WorldSelector                  │ │
│   │  • Header bar : ressources, crowns, population       │ │
│   │  • Panels : Buildings, Army, Queue, Reports          │ │
│   │  • Modals : BuildingDetail, AttackTarget, Settings   │ │
│   │  • Toasts                                            │ │
│   └────────────────┬─────────────────────────────────────┘ │
│                    │                                        │
│   ┌────────────────▼─────────────────────────────────────┐ │
│   │       Stores Zustand (pas de Redux)                  │ │
│   │  useAuthStore, useGameStore, useUIStore,             │ │
│   │  useResourcesStore, useCrownsStore                   │ │
│   └──┬─────────────────┬─────────────────┬───────────────┘ │
│      │                 │                 │                 │
│   ┌──▼───┐    ┌────────▼──────┐   ┌──────▼────────────┐   │
│   │ Pixi │    │ TanStack      │   │ Socket.IO Service │   │
│   │ App  │    │ Query (REST)  │   │ + Event Bus       │   │
│   └──┬───┘    └───────┬───────┘   └──────┬────────────┘   │
│      │                │                  │                 │
└──────┼────────────────┼──────────────────┼─────────────────┘
       │                │                  │
       │            ┌───▼──────────────────▼──────────────┐
       │            │   Backend NestJS (intouché)         │
       │            │   REST + Socket.IO (Outbox pattern) │
       │            └─────────────────────────────────────┘
       │
   ┌───▼─────────────────────────────────────────────────┐
   │  Pixi Application (1 stage, plusieurs scenes)       │
   │  ┌────────────────────────────────────────────────┐ │
   │  │   Scene Manager                                │ │
   │  │   ├── WorldMapScene   (pixi-viewport, 500×500) │ │
   │  │   └── VillageScene    (pixi-viewport, top-down)│ │
   │  │       (mobile portrait, zoom/pan, no 3D)       │ │
   │  └────────────────────────────────────────────────┘ │
   │  ┌────────────────────────────────────────────────┐ │
   │  │   AssetsManager (Pixi Assets API + bundles)    │ │
   │  └────────────────────────────────────────────────┘ │
   │  ┌────────────────────────────────────────────────┐ │
   │  │   Input Layer (clic, hover, drag, zoom)        │ │
   │  └────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────┘
```

## Principes directeurs

### 1. **Une seule source de vérité par domaine**

- **State client persistant** (auth tokens, préférences UI) → Zustand store avec `persist` middleware.
- **State serveur cache** (config monde, bâtiments, expéditions) → TanStack Query (avec retry, staleness, background refetch).
- **State éphémère** (modale ouverte, hover canvas) → état local React ou variables Pixi.

Pas de duplication. Pas de slice qui mirror un endpoint REST.

### 2. **React rend le HUD, Pixi rend le jeu**

Les deux **coexistent** dans le même DOM. Le canvas Pixi remplit le viewport, le HUD React est en `position: fixed` au-dessus.

```tsx
function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <PixiCanvas /> {/* fond, plein écran */}
      <HUDOverlay /> {/* position: absolute pointer-events: none */}
    </div>
  );
}
```

Les éléments interactifs du HUD ont `pointer-events: auto`. Le reste laisse passer les clics au canvas.

### 3. **Communication React ↔ Pixi via stores Zustand**

Pixi lit les stores via `useStore.subscribe()` (pas de hook React, pas de re-render React). React lit les mêmes stores via `useStore()`.

```ts
// Pixi side
useGameStore.subscribe(
  (s) => s.selectedVillageId,
  (id) => worldMapScene.highlightVillage(id),
);

// React side
const selectedVillageId = useGameStore((s) => s.selectedVillageId);
```

Pas d'event emitter custom entre les deux mondes — Zustand est déjà un pub/sub.

### 4. **Une scene Pixi = un écran de jeu**

```
WorldMapScene  → /game/world      (pixi-viewport ; carte monde 500×500)
VillageScene   → /game/village    (pixi-viewport ; vue top-down 2D mobile portrait)
```

Une seule scene est mounted à la fois. Elle est créée à l'entrée de la route, détruite à la sortie. Pas de garde de mémoire à long terme : les assets sont dans `Assets` (cache global Pixi).

**Les deux scenes utilisent `pixi-viewport`.** La VillageScene n'est *pas* une grille fixe — c'est un terrain modulable où on pourra ajouter par la suite des décors, des routes, du brouillard de guerre, des animations ambiantes. Référence visuelle : Kingsage, Tribal Wars, Travian (vue 2D top-down stylisée, pas isométrique, pas 3D).

### 5. **Server-authoritative, client interpole**

- Aucun state de gameplay n'est dérivé localement (les ressources sont pushées par le backend, le client interpole entre deux pushes mais ne « calcule » rien d'autoritatif).
- Optimistic UI explicitement reservé aux mutations utilisateur (upgrade building, train units) avec rollback automatique.

## Stack précise

| Concern | Choix | Pourquoi |
|---------|-------|----------|
| Bundler / dev server | **Vite 5** | HMR instantané, build instant, pas de magie SSR inutile. |
| UI library | **React 19** | Garde le HUD existant, courbe d'apprentissage nulle. |
| Routing | **react-router 7** (data router) | Léger, équivalent fonctionnel à App Router pour ce cas. |
| Styling | **Tailwind CSS 3.4** | Identique à l'existant, copie de la config. |
| Form / inputs | natif React + petit hook custom | `react-hook-form` est over-kill ici (3 forms : login, register, train). |
| State client | **Zustand 4** | API minimaliste, persist middleware, subscribe sans re-render. |
| Server cache | **TanStack Query 5** | Standard de facto, gère retry/refetch/optimistic out-of-the-box. |
| Validation | **Zod 3** | Typage runtime, déjà utilisé côté backend, schéma partagé possible. |
| Realtime | **socket.io-client 4** | Identique à l'existant (le backend est socket.io). |
| **Renderer canvas** | **PixiJS v8** | WebGL/WebGPU, perf 60fps même sur 500×500 entités. |
| Viewport (zoom/pan) | **pixi-viewport** v6 (compat Pixi v8) | Drag, pinch, wheel, follow camera, world bounds. |
| Sounds (futur) | **@pixi/sound** | Optionnel Phase 7. |
| Tests unitaires | **Vitest 3** | Identique à l'existant. |
| Tests E2E (futur) | **Playwright** | Optionnel Phase 7. |
| Lint | **ESLint 9** + flat config | Repartir from scratch, plus simple. |

> Détail des choix Pixi (renderer, asset bundler, ECS éventuel, math libs) → [05-pixijs-stack-decisions.md](./05-pixijs-stack-decisions.md).

## Arborescence cible

```
battleforthecrown-pixi/
├── public/
│   └── assets/
│       ├── tiles/                  # tuiles carte monde
│       ├── buildings/              # sprites bâtiments
│       ├── units/                  # sprites unités
│       ├── ui/                     # icônes UI (ressources, crowns)
│       └── manifest.json           # bundles Pixi Assets
├── src/
│   ├── main.tsx                    # entry point (Vite)
│   ├── App.tsx                     # router + providers minimaux
│   │
│   ├── pixi/                       # tout ce qui touche au canvas
│   │   ├── PixiCanvas.tsx          # composant React qui mount l'app Pixi
│   │   ├── application.ts          # instanciation Pixi Application
│   │   ├── assets/
│   │   │   ├── manifest.ts         # déclaration des bundles
│   │   │   └── loader.ts           # wrapper Assets.loadBundle
│   │   ├── scenes/
│   │   │   ├── SceneManager.ts     # switcher de scene
│   │   │   ├── WorldMapScene.ts    # scene carte monde
│   │   │   ├── VillageScene.ts     # scene vue village
│   │   │   └── BootScene.ts        # écran chargement initial
│   │   ├── entities/
│   │   │   ├── VillageMarker.ts    # rendu d'un village sur la carte
│   │   │   ├── BuildingSprite.ts   # rendu d'un bâtiment
│   │   │   ├── UnitSprite.ts       # rendu d'une troupe en marche
│   │   │   └── ExpeditionPath.ts   # ligne tracée carte
│   │   ├── input/
│   │   │   ├── HitTest.ts          # picking
│   │   │   └── Camera.ts           # wrapper pixi-viewport
│   │   └── debug/
│   │       └── DebugOverlay.ts     # remplace l'ancien AdminPanel
│   │
│   ├── features/                   # même découpage qu'avant, sans le canvas
│   │   ├── auth/
│   │   ├── game/
│   │   ├── world/
│   │   ├── village/
│   │   ├── army/
│   │   ├── combat/
│   │   ├── resources/
│   │   ├── crowns/
│   │   ├── power/
│   │   ├── worlds/
│   │   ├── config/
│   │   └── session/
│   │
│   ├── stores/
│   │   ├── auth.ts                 # useAuthStore
│   │   ├── game.ts                 # useGameStore
│   │   ├── ui.ts                   # useUIStore
│   │   ├── resources.ts            # useResourcesStore
│   │   └── crowns.ts               # useCrownsStore
│   │
│   ├── api/
│   │   ├── client.ts               # fetch wrapper + auth + retry
│   │   ├── queries.ts              # tous les useQuery hooks
│   │   ├── mutations.ts            # tous les useMutation hooks
│   │   ├── ws.ts                   # singleton Socket.IO
│   │   └── ws-bindings.ts          # event WS → store / query invalidation
│   │
│   ├── ui/                         # design system (copie de l'ancien src/ui/)
│   │   ├── buttons/
│   │   ├── cards/
│   │   ├── modals/
│   │   ├── panels/
│   │   └── ... (identique à l'audit)
│   │
│   ├── lib/
│   │   ├── types.ts                # types métier client
│   │   ├── resourceConfig.ts       # config UI ressources (copié)
│   │   ├── unitConfig.ts           # config UI unités (copié)
│   │   ├── combatHelpers.ts        # copié
│   │   ├── gameHelpers.ts          # copié
│   │   └── navigation.ts           # réécrit pour react-router
│   │
│   └── routes/                     # routes react-router
│       ├── root.tsx
│       ├── auth.tsx
│       ├── worlds.tsx
│       ├── game.tsx                # parent, mount PixiCanvas
│       ├── world-map.tsx           # → switche la scene Pixi vers WorldMap
│       ├── village.tsx             # → switche la scene Pixi vers Village
│       └── ...
├── tests/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

## Communication entre couches

### Auth flow

```
LoginScreen (React)
   └─ mutation login → POST /auth/login
       └─ on success: useAuthStore.setTokens(tokens)
           └─ ws.connect(accessToken)
               └─ navigate('/worlds')
```

### Cycle ressources

```
TanStack Query (initial fetch)
   └─ GET /resources/:villageId
       └─ useResourcesStore.set(payload)
           └─ Hook React `useResourcesInterpolation()` (1s/1s, recalcul local)
               └─ HUD se redessine (header bar)

Socket.IO event resources.changed
   └─ ws-bindings.ts → useResourcesStore.set(payload) (re-baseline)
       └─ Interpolation reprend depuis le nouveau lastUpdate
```

### Cycle attaque

```
React (modal "Attack target")
   └─ mutation attack → POST /combat/attack
       └─ on success: optimistic update useResourcesStore (pop minus, food minus)
           └─ TanStack Query invalidate active expeditions

Socket.IO event battle.sent
   └─ ws-bindings.ts → invalidate active expeditions
       └─ Pixi WorldMapScene listens to expeditions store
           └─ ExpeditionPath ajoutée sur la carte (sprite armée + ligne)

(temps t = arrivée)
Socket.IO event battle.resolved
   └─ Toast React + ExpeditionPath change de couleur (Pixi)

Socket.IO event battle.returned
   └─ ExpeditionPath retirée (Pixi), CombatReport ouvre la modale
```

## Pourquoi PixiJS v8 et pas autre chose

| Alternative | Verdict |
|-------------|---------|
| **Three.js** (3D) | Over-kill pour 2D top-down. Plus de courbe d'apprentissage, pipeline assets plus lourd. *(Reste possible plus tard pour la vue village 3D si on veut.)* |
| **Phaser 3** | Game framework complet, mais opinions très fortes (scene system, GameObjects, physics). On veut juste un renderer perf, pas un framework. |
| **Konva.js** | OK pour ~1000 nodes, pas pour 500×500 = 250 000 tuiles. WebGL pas natif. |
| **Excalibur.js** | Bien pour des jeux complets, mais petite communauté. |
| **Native Canvas 2D** | Pas de batching, perf médiocre au-delà de 1k draws/frame. |
| **Custom WebGL** | Perte de temps. Pixi est exactement ce qu'on construirait. |

**PixiJS v8** :
- WebGPU avec fallback WebGL automatique
- Batching natif (10x plus rapide que Pixi v7 sur certains cas)
- Bundle ~80 KB gzippé pour les imports modulaires
- API stable depuis fin 2024
- Communauté massive, doc excellente, [Pixi Skills](https://github.com/pixijs/pixijs-skills) officielle

## Bundle target (prod)

| Asset | Cible |
|-------|-------|
| JS gzippé | < 500 KB |
| CSS gzippé | < 30 KB |
| Initial assets (boot scene) | < 200 KB |
| Lazy bundles (par scene) | < 1 MB chacun |
| TTI sur 4G simulée | < 2s |
| FPS stable | 60 fps sur Mac mid-2020 / Pixel 6 |

Ces cibles sont mesurées en Phase 7 (polish/perf), pas obligatoires en Phase 4-6.

## Diagramme : où vit chaque morceau de l'ancien front

| Ancien (Next.js) | Nouveau (Pixi) | Type de migration |
|------------------|----------------|-------------------|
| `src/app/store.ts` (Redux) | `src/stores/*.ts` (Zustand) | Réécriture (~5x moins de code) |
| `src/app/api.ts` (RTK Query) | `src/api/queries.ts` + `mutations.ts` (TanStack Query) | Réécriture |
| `src/app/providers.tsx` | `src/App.tsx` | Simplification (3 providers au lieu de 12) |
| `src/lib/websocket/` | `src/api/ws.ts` + `ws-bindings.ts` | Quasi-copie (event bindings recâblés) |
| `src/lib/api/` | `src/api/client.ts` | Quasi-copie |
| `src/lib/types.ts`, `combatHelpers.ts`, etc. | `src/lib/` | Copie littérale |
| `src/lib/navigation.ts` | `src/lib/navigation.ts` | Réécriture (next/navigation → react-router) |
| `src/ui/` | `src/ui/` | Copie quasi-littérale |
| `src/features/auth/` | `src/features/auth/` | Réécriture (slice → store) |
| `src/features/world/WorldMapCanvas.tsx` (854 l) | `src/pixi/scenes/WorldMapScene.ts` | **Réécriture totale** |
| `src/features/village/VillageCanvas.tsx` (17 l) | `src/pixi/scenes/VillageScene.ts` | **Création** |
| `src/features/world/Wor*` panels | `src/features/world/` (HUD seulement) | Réécriture (RTK → TanStack) |
| `src/features/village/BuildingCard*` etc | `src/features/village/` (HUD seulement) | Réécriture (RTK → TanStack) |
| `src/features/admin/AdminPanel` | `src/pixi/debug/DebugOverlay.ts` | Réécriture minimale |
| Tout le reste (`features/army`, `combat`, `resources`, `crowns`, `power`, `worlds`, `session`, `game`, `config`, `layout`, `ui` slice) | `src/features/*/` | Réécriture (slice/RTK → store/TanStack) |
