# 01 — État actuel (audit)

> Cartographie de référence du frontend Next.js avant migration. Sert de checklist pour s'assurer qu'aucune fonctionnalité n'est perdue.

## Stack

```
Next.js 15.1 (App Router) + React 19
@reduxjs/toolkit 2.2 + react-redux 9.1 + redux-persist 6
RTK Query (intégré à @reduxjs/toolkit)
Tailwind CSS 3.4 + class-variance-authority
socket.io-client 4.8
lucide-react (icônes)
jwt-decode 4
Vitest 3 + Testing Library
```

## Structure top-level

```
battleforthecrown/
├── src/
│   ├── app/              # App Router Next.js + Redux store + RTK Query API
│   ├── components/       # ⚠️ vide
│   ├── features/         # 15 features métier
│   ├── lib/              # helpers métier + WebSocket service + API config
│   └── ui/               # design system (17 buckets)
├── public/               # assets statiques
├── tests/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## src/app/ — Plomberie globale

| Fichier | Rôle |
|---------|------|
| `layout.tsx` | Root layout HTML + chargement providers |
| `providers.tsx` | Stack : `Provider` (Redux) → `PersistGate` → `SessionProvider` → `AuthContextProvider` → `GameContextProvider` → `AuthGuard` → `ConfigProviderRTK` → `ToastProvider` → `GlobalEventListeners` → `VillageConstructionWatcher` → `AdminPanel` |
| `page.tsx` | Accueil minimal → lien vers `/game` |
| `store.ts` | Redux store + persist (auth + ui only). Slices : auth, ui, resources, village, world, combat, crowns, worldEntities, worldUI |
| `hooks.ts` | `useAppSelector`, `useAppDispatch` typés |
| `api.ts` | **40+ endpoints RTK Query** : buildings, queue, resources, units, training, worlds, expeditions, combat reports, crowns, power, etc. Auto-reauth, gestion erreurs « Insufficient resources » |
| `api.types.ts` | Types côté client : Building, Resources, CombatReport, Unit… |
| `globals.css` | Tailwind base |
| `GameClient.tsx` | Wrapper minimal → `VillageView` |

### Routes (App Router)

```
/                        → page d'accueil
/auth/login              → LoginScreen
/auth/register           → RegisterScreen
/worlds                  → WorldSelector (choix/création de monde)
/my-worlds               → MyWorldsScreen (gestion des mondes rejoints)
/game                    → layout protégé → GameClient → VillageView
  /game/world            → WorldView (carte monde)
  /game/army             → gestion d'armée
  /game/combat-report    → historique combats
  /game/messages         → chat
/ui-test                 → storybook maison (à supprimer)
```

## src/features/ — 15 modules métier

> 121 fichiers TS/TSX au total. Pour chaque feature on indique : composants principaux + slices Redux + hooks RTK + sort en migration.

### auth
- **Composants** : `LoginScreen.tsx`, `RegisterScreen.tsx`, `AuthGuard.tsx`
- **Context** : `AuthContext.tsx`
- **Slice** : `authSlice` (selectors `selectIsAuthenticated`, `selectUserId`, `selectWorldId`, `selectVillageId`)
- **Thunks** : `registerUser`, `loginUser`, `refreshTokenThunk`
- **Migration** : ✅ portage React HUD direct, slice → store Zustand `useAuthStore`.

### session
- **Composants** : `SessionProvider.tsx`, `ProtectedRoute.tsx`
- **Migration** : ✅ recoder en hook `useSession()` + composant `<RequireAuth>` minimal.

### game
- **Composants** : `GameContext.tsx` + `GameContextProvider`
- **Rôle** : maintient `userId / worldId / villageId` actifs (consommés par RTK Query base URL)
- **Migration** : ✅ store Zustand `useGameStore` (1 fichier ~30 lignes).

### config
- **Composants** : `ConfigProviderRTK.tsx`
- **Hook** : `useConfig()` (fetch `WorldConfig` du backend)
- **Migration** : ✅ TanStack Query + hook `useWorldConfig(worldId)`.

### village
- **Composants critiques** :
  - `VillageView.tsx` (container principal, gère les panels via URL params)
  - `VillageCanvas.tsx` ⚠️ **17 lignes, placeholder** → **PixiJS**
  - `BuildingCard.tsx`, `BuildingDetailModal.tsx`, `BuildingManagementPanel.tsx`
  - `QueueBottomSheet.tsx`, `BottomNavigationBar.tsx`
  - `VillageConstructionWatcher.tsx` (écoute `building.completed`)
- **Slice** : `villageSlice` (buildings, queue, constructing state)
- **Hooks** : `useVillage()`, `useBuildings()`
- **Migration** : 🎨 **VillageCanvas → PixiJS**, le reste → React HUD.

### world
- **Composants critiques** :
  - `WorldView.tsx` (container)
  - `WorldMapCanvas.tsx` ⚠️ **854 lignes HTML/SVG** → **PixiJS** *(point névralgique)*
  - `WorldMiniMap.tsx`, `WorldSelectedEntityPanel.tsx`, `WorldEntityTooltip.tsx`
  - `WorldLockedState.tsx`, `WorldAdminPanel.tsx`
- **Slice** : `worldSlice` (selectedEntity, isAttackPanelOpen, worldState), `worldEntitiesSlice`, `worldUISlice`
- **Migration** : 🎨 **WorldMapCanvas → PixiJS + pixi-viewport**, panels HUD restent en React.

### army
- **Composants** : structures vides ou minimalistes (composants à compléter dans la nouvelle app)
- **Hooks** : wrappers RTK Query `getUnits`, `trainUnits`
- **Migration** : ✅ portage React + TanStack Query.

### combat
- **Composants** : `ExpeditionList.tsx`, `ExpeditionsFloatingButton.tsx`, `CombatReportModal.tsx` (probable)
- **Slice** : `combatSlice` (UI state)
- **Hooks** : `useCombatEvents()` (event bus WebSocket → toasts)
- **Types** : `BattleSentPayload`, `BattleResolvedPayload`, `BattleReturnedPayload`
- **Migration** : ✅ HUD React + 🎨 animation expédition (ligne tracée + sprite armée) en PixiJS.

### resources
- **Composants** : `ResourceProvider.tsx`
- **Slice** : `resourcesSlice` (resources[], lastUpdate)
- **Hooks** : `useGetResourcesQuery()` (RTK), `useResourcesInterpolation()` (incrément local 1s/1s), `useResources()`
- **Reducers WebSocket** : `resourcesUpdatedFromServer`, `consumeResources`, `refundResources` (optimistic UI)
- **Migration** : ✅ store Zustand `useResourcesStore` + hook `useResourcesInterpolation` recodé identique.

### crowns
- **Composants** : `CrownsManager.tsx`
- **Slice** : `crownsSlice` (balance, productionRate)
- **Hooks** : `useCrownsManager()`, `useCrownsInterpolation()`
- **Reducer WS** : `crownsUpdatedFromServer`
- **Migration** : ✅ jumeau de `resources`. Same pattern.

### power
- **Composants** : `PowerBottomSheet.tsx`
- **Hooks** : `usePower()`
- **Migration** : ✅ TanStack Query, lecture seule.

### population
- (Pas de feature dédiée — accédé via `useResources()` ou via le panel village.)

### ui
- **Slice** : `uiSlice` (modals ouvertes, notifications, theme)
- **Migration** : ✅ store Zustand `useUIStore`, ou simple state local par modale.

### layout
- **Composants** : `GamePageHeader.tsx`
- **Migration** : ✅ portage direct (hook navigation via `react-router` au lieu de `next/navigation`).

### worlds
- **Composants** : `WorldSelector.tsx`
- **Hooks** : RTK Query `getWorlds`, `joinWorld`, `seedWorld`
- **Migration** : ✅ TanStack Query + HUD React.

### admin
- **Composants** : `AdminPanel.tsx`
- **Migration** : 🟡 reconstruire en debug overlay PixiJS minimal (touche `~` pour toggle).

## src/lib/ — Helpers et plomberie

### Pure code (recopié tel quel)

| Fichier | Contenu |
|---------|---------|
| `types.ts` | Types principaux (Resource, Building, Unit, Population, enums) |
| `resourceConfig.ts` | Config UI ressources (icon, colors, unit) — wood/stone/iron/gold/food |
| `unitConfig.ts` | `UNIT_CONFIG[type] = { name, assetPath }` (MILITIA, SQUIRE, ARCHER, CAVALRY, TEMPLAR) |
| `combatHelpers.ts` | `calculateDistance()`, `calculateTravelTime()` (partagé avec `@battleforthecrown/shared/logic`) |
| `gameHelpers.ts` | Helpers coûts, `AffordabilityCheck` |
| `navigation.ts` | URL params routing (`NavigationPanel` enum, `parseNavigationParams`, `setPanel`) — **à reécrire** car couplé à `next/navigation` |

### Plomberie réseau

`src/lib/api/` :
- `config.ts` — base URL, headers, gestion d'erreurs
- `session.ts` — token management (refresh)
- `sync.ts` — utilitaires de sync

`src/lib/websocket/` :
- `websocket.service.ts` — singleton Socket.IO + JWT auth + reconnection (max 5, backoff 1s)
- `useWebSocket.ts` — hook qui mappe les events WS → dispatchs Redux + RTK invalidations
- `WebSocketConnector.tsx` — provider qui appelle `useWebSocket(accessToken)`
- `event-bus.ts` — pub/sub interne (event WS → composants UI)
- `types.ts`, `combat-events.types.ts`

**Migration** : ✅ recoder en passant les events vers Zustand au lieu de Redux. Le service singleton lui-même est portable presque tel quel.

## src/ui/ — Design system

17 buckets, tous portables tels quels (juste `cn()` à recoder si besoin) :

```
buttons/         — Button, IconButton
cards/           — Card, CardBanner, CardBody, CardTitle, CardStats
modals/          — Modal, ModalBody, ModalFooter
panels/          — Panel, PanelHeader, BottomSheet
inputs/          — Input, Checkbox, Radio, Textarea, Select
layout/          — HeaderBar, HeaderActions, ResourceDisplay, PopulationIndicator
toasts/          — Toast, ToastProvider, useToast
tooltips/        — Tooltip
badges/          — Badge
avatars/         — Avatar
spinners/        — Spinner
sliders/         — Slider
feedback/        — ProgressBar
common/          — ResourceIcon
floating-buttons/ — FloatingButton
typography/      — (composants typo)
selects/         — (selects custom)
```

**Migration** : ✅ copie quasi-littérale, ajustements mineurs (Tailwind 4 si on en profite, ou rester en 3.4).

## Surface API consommée (résumé)

> Détail exhaustif : voir [06-api-contract-snapshot.md](./06-api-contract-snapshot.md).

### REST (NestJS, base `/`)

```
auth/         POST /auth/register, /auth/login, /auth/refresh
world/        GET /world, /world/:id/details, /world/:id/config, /world/:id/entities, /world/:id/villages
              POST /world/seed-if-needed, /world/:id/join
              GET /world/users/:userId/memberships
village/      GET /village (par worldId+userId), /village/buildings, /village/queue
              POST /village/:id/upgrade, DELETE /village/:id/buildings/:bid/cancel
              GET /village/strategy, POST /village/:id/strategy
resources/    GET /resources/:villageId, POST /resources/:villageId/produce
army/         GET /army/:villageId/inventory, /army/:villageId/training
              POST /army/:villageId/train, DELETE /army/:villageId/training/:tid/cancel
combat/       POST /combat/attack, GET /combat/:villageId/active, /combat/reports, /combat/report/:id
              PATCH /combat/report/:id/read, DELETE /combat/report/:id
crowns/       GET /crowns/:userId/:worldId, POST /crowns/:userId/:worldId/produce
population/   GET /population
power/        GET /power, /power/leaderboard, /power/kingdom/:userId
```

### WebSocket (Socket.IO, JWT en handshake auth)

Rooms : `user:{userId}`, `world:{worldId}`. Client émet `join:world`. Serveur émet :

```
building.completed
unit.training.started
unit.training.completed
battle.sent
battle.resolved
battle.returned
village.attacked
village.conquered
resources.changed
crowns.changed
village.strategy.changed
```

## Patterns critiques à préserver

1. **Interpolation locale ressources/crowns** : le backend pousse un payload « partial » avec `lastUpdate` + `productionRates`, le client incrémente toutes les secondes en local. *Doit fonctionner identique côté Pixi (HUD ressources)*.
2. **Pattern Outbox** : événements potentiellement avec ~1s de retard. Le client peut faire de l'optimistic UI (`consumeResources`, `refundResources`) puis se resync.
3. **Auto-reauth** : si un endpoint répond `401`, le client tente un refresh token automatiquement et rejoue la requête. *À recoder avec un middleware TanStack Query.*
4. **URL params pour panels** : `?panel=buildings&buildings=1,2,3`. *À recoder avec `react-router` searchParams ou similaire.*
5. **Optimistic UI** : actions qui décrémentent les ressources avant la confirmation serveur, avec rollback si erreur. *À recoder en mutations TanStack Query avec `onMutate`/`onError`.*

## Métriques actuelles (référence)

- **121 fichiers TS/TSX** dans `src/features/`
- **854 lignes** de `WorldMapCanvas.tsx` (DOM/SVG, à remplacer)
- **17 lignes** de `VillageCanvas.tsx` (placeholder, à remplacer)
- **40+ endpoints** RTK Query
- **11 types d'événements** WebSocket
- **15 features**, **17 buckets UI**
- `tsconfig.tsbuildinfo` = **226 KB** (artefact)
- `yarn.lock` côté front = **221 KB**

## Ce qui reste verrouillé hors scope

- Schéma Prisma (sauf si on découvre un manque pendant Phase 4-6).
- Backend NestJS modules (sauf bug).
- Workers pg-boss.
- `@battleforthecrown/shared` (lecture seule pendant la migration).
