# 03 — Plan d'exécution (phasé)

## Stratégie globale {#strategy}

**Approche : nouveau dossier en parallèle, bascule à la fin.**

```
battleforthecrown-repo/
├── battleforthecrown/          ← legacy Next.js (intact, sert de référence vivante)
├── battleforthecrown-pixi/     ← nouveau (créé en Phase 0)
├── battleforthecrown-backend/  ← intouché
└── packages/shared/            ← intouché (consommé par les deux)
```

**Pourquoi pas un refactor in-place ?**
- Casser des écrans pendant 2 semaines avec un seul frontend = pas démontrable.
- Dépendances Redux/Next entrelacées : virer Next sans virer Redux et inverser, puis tout casser progressivement, c'est plus risqué que de réécrire en parallèle.
- On peut tester côte à côte (`yarn workspace battleforthecrown dev` vs `yarn workspace battleforthecrown-pixi dev`) à tout moment.
- Suppression du legacy = un seul commit propre à la fin de Phase 7.

**Workspace yarn** : ajouter `"battleforthecrown-pixi"` dans `package.json` racine → l'app pixi consomme `@battleforthecrown/shared` automatiquement.

## Définition de "done" pour chaque phase

Chaque phase doit produire :

1. ✅ **Une démo jouable** ou **un test mesurable** (pas de phase « plomberie cachée »).
2. ✅ **Tests unitaires Vitest** pour la logique non-triviale ajoutée.
3. ✅ **Lint + type-check** propres.
4. ✅ **Une entrée dans `docs/migration/CHANGELOG.md`** (à créer en Phase 0) listant ce qui est fait, ce qui a dévié du plan, et pourquoi.
5. ✅ **Un commit ou un set de commits** suivant `<type>(<scope>): <subject>`.

---

## Phase 0 — Skill, scaffold, plomberie {#phase-0}

**Durée : ½ jour. Bloquante.**

### 0.A — Bootstrap base de données (préalable absolu)

> La DB n'existe plus. Il faut la recréer avant tout.

- [ ] `cd battleforthecrown-backend && docker compose up -d` → démarre Postgres 16 sur le port 5432.
- [ ] Attendre que le healthcheck passe : `docker compose ps` doit montrer `healthy`.
- [ ] `yarn workspace battleforthecrown-backend prisma migrate deploy` → applique les 14 migrations existantes.
- [ ] `yarn workspace battleforthecrown-backend prisma generate` → génère le client Prisma.
- [ ] `docker exec -i battleforthecrown-postgres psql -U postgres -d battleforthecrown < battleforthecrown-backend/prisma/seed-default-world-config.sql` → seed la config du monde par défaut.
- [ ] Sanity check SQL : `docker exec battleforthecrown-postgres psql -U postgres -d battleforthecrown -c '\dt'` doit lister les tables Prisma (User, World, Village, Building, EventOutbox, etc.).
- [ ] Lancer le backend en background : `PORT=15001 yarn workspace battleforthecrown-backend start:dev` *(les CORS sont déjà configurés pour `localhost:5173` qui sera l'URL de Vite)*.
- [ ] Vérifier `curl http://localhost:15001/health` → 200 OK.

> Détail des commandes SQL utiles (debug, reset, seed manuel) : [db-setup.md](./db-setup.md).

### 0.B — Skill PixiJS et scaffold Vite

- [ ] Installer le skill PixiJS : `npx skills add https://github.com/pixijs/pixijs-skills` *(optionnel mais conseillé pour Phase 4-5)*.
- [ ] Créer `battleforthecrown-pixi/` avec `npm create vite@latest -- --template react-ts`.
- [ ] Ajouter dans le `package.json` racine :
  ```json
  "workspaces": ["battleforthecrown", "battleforthecrown-backend", "battleforthecrown-pixi", "packages/*"]
  ```
- [ ] Installer dépendances de base :
  ```bash
  yarn workspace battleforthecrown-pixi add \
    pixi.js@^8 pixi-viewport \
    react react-dom react-router \
    zustand \
    @tanstack/react-query @tanstack/react-query-devtools \
    socket.io-client \
    jwt-decode \
    zod \
    class-variance-authority \
    lucide-react \
    @battleforthecrown/shared
  ```
  ```bash
  yarn workspace battleforthecrown-pixi add -D \
    typescript vite @vitejs/plugin-react \
    tailwindcss postcss autoprefixer \
    eslint @eslint/js typescript-eslint eslint-plugin-react-hooks \
    vitest @vitest/coverage-v8 @vitest/ui jsdom \
    @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- [ ] Configurer Tailwind 3.4 (copie de `tailwind.config.ts` existant).
- [ ] Configurer ESLint flat config (modèle minimaliste).
- [ ] Créer la structure de dossiers cible (cf. [02-target-architecture.md](./02-target-architecture.md#arborescence-cible)) avec des fichiers `.gitkeep`.
- [ ] Créer `src/App.tsx` avec un router minimal (`/`, `/login`) et un écran « Hello Pixi » qui mount `new Application().init({ background: '#1a1a2e' })`.
- [ ] Créer `docs/migration/CHANGELOG.md` (vide, prêt à recevoir).

### Definition of Done

- ✅ DB Postgres tourne dans Docker, healthcheck OK, 14 migrations appliquées, seed world config en place.
- ✅ Backend NestJS répond `200` sur `/health` au port 15001.
- ✅ `yarn workspace battleforthecrown-pixi dev` ouvre Vite, affiche un canvas Pixi noir avec un texte « Hello Pixi » en HUD React.
- ✅ `yarn workspace battleforthecrown-pixi build` produit un bundle.
- ✅ `yarn workspace battleforthecrown-pixi test` passe (test trivial inclus).
- ✅ Le CHANGELOG est créé.

---

## Phase 1 — Auth + sélection de monde (HUD pur) {#phase-1}

**Durée : 1 jour.**

### Tâches

- [ ] Copier `src/ui/` legacy → `battleforthecrown-pixi/src/ui/` (ajuster imports `cn()` si besoin).
- [ ] Créer `src/lib/types.ts`, `resourceConfig.ts`, `unitConfig.ts`, `gameHelpers.ts` (copie littérale).
- [ ] Créer `src/api/client.ts` : `fetch` wrapper avec auth JWT, refresh automatique sur 401.
- [ ] Créer `src/api/queries.ts` : `useLoginMutation`, `useRegisterMutation`, `useRefreshMutation`, `useWorldsQuery`, `useJoinWorldMutation`, `useMyMembershipsQuery`.
- [ ] Créer `src/stores/auth.ts` (Zustand + persist : tokens, userId).
- [ ] Créer `src/stores/game.ts` (Zustand : worldId, villageId actifs).
- [ ] Créer `src/features/auth/LoginScreen.tsx`, `RegisterScreen.tsx`.
- [ ] Créer `src/features/worlds/WorldSelector.tsx`.
- [ ] Routing react-router : `/`, `/auth/login`, `/auth/register`, `/worlds`, `/my-worlds`, route protégée `/game` (qui pour l'instant affiche juste un placeholder).
- [ ] Tests Vitest : pure logic helpers + au moins 1 test sur le `client.ts` (refresh sur 401 via mock).

### Definition of Done

- Un nouvel utilisateur peut s'enregistrer, se connecter, voir la liste des mondes, en rejoindre un, atterrir sur `/game` (qui affiche encore un placeholder).
- Backend NestJS doit tourner (`yarn workspace battleforthecrown-backend start:dev`).
- Pas un seul `pixi.js` import à ce stade — c'est volontaire, on valide la plomberie React+API d'abord.

---

## Phase 2 — Couche temps réel : WebSocket + stores liés {#phase-2}

**Durée : 1-2 jours.**

### Tâches

- [ ] Créer `src/api/ws.ts` : singleton Socket.IO basé sur l'existant (`src/lib/websocket/websocket.service.ts`), recodé en TS strict, sans React deps.
- [ ] Créer `src/api/ws-bindings.ts` : pour chaque event WS, mapping vers `useStore.setState()` ou `queryClient.invalidateQueries()`.
- [ ] Créer `src/stores/resources.ts` (Zustand : ressources par villageId, lastUpdate, productionRates).
- [ ] Créer `src/stores/crowns.ts` (Zustand : balance, productionRate).
- [ ] Créer `src/stores/ui.ts` (Zustand : modales, panels ouverts, toasts).
- [ ] Créer hooks d'interpolation : `useResourcesInterpolation()`, `useCrownsInterpolation()` (1s/1s).
- [ ] Connecter `ws.connect(accessToken)` au montage de la route `/game` ; `ws.disconnect()` au démontage.
- [ ] HUD minimal pour valider : header bar avec ressources qui s'incrémentent en temps réel quand on est connecté à un monde + village.
- [ ] Test E2E manuel : déclencher un upgrade côté backend (via curl ou un autre frontend), voir l'event arriver et la HUD se mettre à jour.

### Definition of Done

- La barre de ressources affiche des valeurs qui s'incrémentent toutes les secondes (interpolation).
- Quand le backend pousse un `resources.changed`, la barre se resync immédiatement.
- Reconnexion WS fonctionne (couper le réseau 5s, voir le retry automatique).

---

## Phase 3 — HUD complet du village (pas encore de canvas) {#phase-3}

**Durée : 1-2 jours.**

### Tâches

- [ ] Porter `src/features/village/` (sans `VillageCanvas`) :
  - `BuildingCard`, `BuildingDetailModal`, `BuildingManagementPanel`, `QueueBottomSheet`, `BottomNavigationBar`, `VillageView` (refait pour utiliser react-router searchParams au lieu de next/navigation).
- [ ] Porter `src/features/army/` (entrainement, inventaire) — formulaires React purs.
- [ ] Porter `src/features/combat/ExpeditionList`, `ExpeditionsFloatingButton` (liste HUD pure).
- [ ] Porter `src/features/power/PowerBottomSheet`.
- [ ] Porter `src/features/crowns/CrownsManager`.
- [ ] Porter `src/features/layout/GamePageHeader`.
- [ ] Toutes les mutations passent par TanStack Query avec `onMutate` (optimistic) et `onError` (rollback).
- [ ] Tests Vitest : tester la logique des hooks d'affordability, du calcul de coûts, des optimistic updates.

### Definition of Done

- `/game` affiche un HUD complet sans canvas : on voit la liste des bâtiments du village, on peut upgrader, l'optimistic UI fonctionne, les events WS rafraîchissent.
- L'écran a un `<div>` placeholder « le canvas viendra ici en Phase 4-5 ».
- Lint + type-check + tests passent.

---

## Phase 4 — PixiJS World Map (la grosse pièce) {#phase-4}

**Durée : 3-5 jours.**

### Tâches

#### 4.1 — Bootstrap Pixi
- [ ] `src/pixi/application.ts` : `new Application().init({ resizeTo: window, antialias: true, backgroundAlpha: 0 })`.
- [ ] `src/pixi/PixiCanvas.tsx` : composant React qui mount/unmount l'app dans une ref.
- [ ] `src/pixi/scenes/SceneManager.ts` : registry simple `register(name, scene)` / `switchTo(name)`.
- [ ] `src/pixi/scenes/BootScene.ts` : écran de chargement (spinner Pixi, charge le manifest).

#### 4.2 — Asset pipeline
- [ ] `src/pixi/assets/manifest.ts` : déclarer 3 bundles (`boot`, `world-map`, `village`).
- [ ] Récupérer ou créer un set d'assets minimal : 1 tuile herbe, 1 tuile forêt, 1 sprite « village joueur », 1 sprite « village barbare », 1 sprite « château ennemi », 1 icône expédition.
- [ ] `src/pixi/assets/loader.ts` : wrapper `Assets.loadBundle()` avec progress callback.

#### 4.3 — WorldMapScene
- [ ] `src/pixi/scenes/WorldMapScene.ts` : extends Container. Init `Viewport` (pixi-viewport) avec `worldWidth = gridWidth * tileSize`, drag, pinch, wheel, clamp, decelerate.
- [ ] **Rendu des tuiles** : utiliser `ParticleContainer` ou `Mesh` avec `RenderTexture` baked pour les fonds de tuiles. Cible : 500×500 = 250 000 tuiles, mais on ne rend que celles dans le viewport (culling natif de pixi-viewport).
- [ ] **Rendu des entités** : pour chaque `WorldEntity` (village joueur, village barbare), un `Container` avec son sprite + label. Stocker dans un `Map<entityId, Container>`.
- [ ] **Subscription Zustand** : la scene écoute `useWorldEntitiesStore` et reconcilie les containers (add/remove/update) — pas de re-render React, juste des appels Pixi.
- [ ] **Hover & click** : `eventMode='static'`, gérer `pointerover`/`pointerout`/`click`. Au clic, écrire dans `useGameStore.setSelectedEntity(id)`. Le panel React HUD (`WorldSelectedEntityPanel`) lit ce store et apparaît.
- [ ] **Mini map** : `WorldMiniMap.tsx` rendu en PIXI séparé (ou en SVG, vu sa taille c'est OK).

#### 4.4 — Performance
- [ ] Test de stress : 50 000 entités factices, viewport ouvert, mesurer FPS. Cible : 60 fps stable sur Mac mid-2020.
- [ ] Si non atteint : passer aux `ParticleContainer` pour les sprites de tuiles, ou pre-baker les chunks.

### Definition of Done

- Au montage de `/game/world`, le canvas Pixi affiche la carte du monde, on peut zoomer/dézoomer (wheel), pan (drag), cliquer sur un village → un panel HUD s'ouvre avec ses infos.
- 60 fps avec une carte 500×500 et au moins 1000 villages affichés.
- WebSocket : un nouveau village barbare apparaît automatiquement quand le backend en seede un.
- Tests : au moins 1 test de la fonction de hit-test, 1 test de la diff `worldEntities → containers`.

---

## Phase 5 — PixiJS Village View {#phase-5}

**Durée : 2-3 jours.**

### Tâches

- [ ] `src/pixi/scenes/VillageScene.ts` : top-down 2D, **avec son propre `Viewport` pixi-viewport** (zoom/dézoom + pan). Bounds = taille du village (à confirmer Phase 5, ex: 1500×2000 px en mobile portrait). Range de zoom: `minScale: 0.5`, `maxScale: 2.5`.
- [ ] **Orientation cible : mobile portrait.** Layout des bâtiments pensé pour un viewport vertical, le HUD React reste en `position: fixed` au-dessus.
- [ ] **Référence visuelle** : Kingsage / Tribal Wars (vue 2D top-down stylisée, pas isométrique, pas 3D).
- [ ] `src/pixi/entities/BuildingSprite.ts` : pour chaque type de bâtiment (CASTLE, WOOD, STONE, IRON, WAREHOUSE, FARM, BARRACKS, WATCHTOWER, WALL, HIDEOUT), un sprite + animations (idle, en construction, en upgrade).
- [ ] **Animations construction** : pendant `Building.startTime → endTime`, afficher des échafaudages + **émetteur de particules de poussière** (`@pixi/particle-emitter`, voir [05](./05-pixijs-stack-decisions.md#particules--oui-dès-phase-6)) + barre de progression flottante.
- [ ] **Click sur un bâtiment** : ouvre `BuildingDetailModal` HUD (déjà fait Phase 3) + **lumière douce** sur le bâtiment sélectionné (filter Glow ou émetteur de particules).
- [ ] **WebSocket bindings** : `building.completed` → animation flash → mise à jour visuelle du sprite (nouveau niveau).
- [ ] **Asset minimal** : un sprite par type de bâtiment + un échafaudage générique. Style placeholder OK pour cette phase.

### Definition of Done

- En entrant dans son village, on voit les bâtiments dessinés sur le canvas (placeholder graphique acceptable).
- Cliquer sur un bâtiment ouvre la modale.
- Lancer un upgrade montre l'échafaudage et la progression visuelle.
- À la fin de l'upgrade (event WS), le sprite se met à jour.

---

## Phase 6 — Animations expéditions et combats {#phase-6}

**Durée : 2-3 jours.**

### Tâches

- [ ] `src/pixi/entities/ExpeditionPath.ts` : ligne tracée entre le village d'origine et la cible (Bezier quadratique pour un effet courbe).
- [ ] `src/pixi/entities/UnitSprite.ts` : un sprite « armée » qui glisse le long de la ligne, vitesse calculée pour arriver à `arrivalAt`. **Traînée de poussière** via `@pixi/particle-emitter` derrière le sprite.
- [ ] **Phases visuelles** :
  - `EN_ROUTE` : sprite vert, ligne pleine, particules poussière.
  - `RESOLVED` (arrivée) : **flash + étincelles + ondes de choc** (filter Shockwave + emitter étincelles) sur la cible, ligne change de couleur (victoire/défaite selon report).
  - `RETURNING` : sprite revient en arrière, ligne pointillée. **Particules dorées** sur retour victorieux avec loot.
  - `RETURNED` : sprite disparaît.
- [ ] **Effets cible spéciaux** :
  - Village conquis (`village.conquered`) : panache de fumée persistant ~5s.
  - Village pillé (`village.attacked`) : flash rouge + petits feux (émetteur loop court).
- [ ] **WebSocket bindings** : `battle.sent` (créer l'expedition), `battle.resolved` (changer de phase), `battle.returned` (retirer).
- [ ] **HUD synchronisé** : la liste `ExpeditionList` du HUD se met à jour en parallèle.
- [ ] **Combat report modal** : à l'event `battle.resolved`, ouvrir un toast → clic ouvre le rapport complet HUD.
- [ ] `village.attacked`, `village.conquered` : feedback HUD (toast + animation flash sur la carte si on est sur le world map).

### Definition of Done

- Lancer une attaque depuis le HUD trace une ligne sur la carte, fait avancer un sprite armée.
- À l'arrivée, on voit un flash + le rapport apparaît.
- Le retour est animé.
- 5 expéditions simultanées tournent à 60 fps.

---

## Phase 7 — Polish, perf, bundle, E2E {#phase-7}

**Durée : 2 jours.**

### Tâches

- [ ] Mesure du bundle (`yarn build` + analyser via `vite-bundle-visualizer`). Objectif < 500 KB JS gzippé.
- [ ] Lazy-load des bundles d'assets `village` au montage de la VillageScene (pas avant).
- [ ] Code-splitting des routes (`react-router` lazy).
- [ ] Profiling Pixi (DevTools FPS) sur la WorldMapScene. Optimiser le batching si nécessaire.
- [ ] Tests E2E Playwright (optionnel) sur le golden path : login → join world → world map → village → upgrade → attack.
- [ ] Tester sur mobile (Pixel 6 émulateur ou réel) : le canvas doit être utilisable au touch.
- [ ] Remplacer le `DebugOverlay` minimal par une UI un peu plus utile (toggle FPS, log des events WS, switch de scene rapide).
- [ ] Sécurité : tester un scénario de token expiré, un scénario de WS coupé pendant 30s, un scénario de backend down.
- [ ] Suppression du legacy : retirer `battleforthecrown/` du workspace, l'archiver dans une branche `legacy/nextjs-frontend`. Renommer `battleforthecrown-pixi/` en `battleforthecrown/`.
- [ ] Mettre à jour `WARP.md`, `README.md` racine, `package.json` racine.

### Definition of Done

- Bundle prod < 500 KB JS gzippé.
- TTI < 2s en 4G simulée.
- 60 fps sur WorldMap (500×500, 1000+ entités) et VillageScene (top-down, zoom/pan, mobile portrait).
- Le repo a un seul frontend (l'ancien est dans une branche d'archive).
- README à jour.

---

## Phase 8 — Consolidation documentaire (CLAUDE.md hiérarchique) {#phase-8}

**Durée : 1-2 jours.** Détail complet : [07-doc-consolidation.md](./07-doc-consolidation.md).

### Tâches (résumé)

- [ ] Inventaire tri : conserver / migrer / supprimer (cf. tableau dans `07-doc-consolidation.md`).
- [ ] Supprimer `WARP.md`, tous les `.trae/`, `docs-v2/index.md`, fichiers `*-technical.md` obsolètes, `IMPLEMENTATION_SUMMARY.md`, `PHASE2_*.md`, `schema.prsima.md`.
- [ ] Splitter `battleforthecrown-backend/AGENTS.md` (16.8 KB) en : un `CLAUDE.md` court + des `.claude/rules/*.md` path-scoped + des fichiers d'archi dans `/docs/architecture/`.
- [ ] Créer `/CLAUDE.md` racine (< 100 lignes), `/battleforthecrown-pixi/CLAUDE.md`, `/battleforthecrown-backend/CLAUDE.md`.
- [ ] Créer `.claude/rules/` racine (`conventions.md`, `git.md`, `docs.md`).
- [ ] Créer rules path-scoped dans chaque workspace (`pixi-conventions.md`, `react-hud.md`, `nest-conventions.md`, `prisma.md`, `workers.md`).
- [ ] Réorganiser `/docs/` racine : `architecture/`, `gameplay/`, `migration/` (et rien d'autre).
- [ ] Migrer la doc gameplay des features frontend (`*-gameplay.md`) en 5-6 fichiers fusionnés dans `/docs/gameplay/`.
- [ ] Mettre à jour `.gitignore` : `.claude/settings.local.json`, `CLAUDE.local.md`.
- [ ] Validation pratique : lancer Claude Code à froid, vérifier que `CLAUDE.md` est chargé, qu'aucun rule ne référence du code mort.

### Definition of Done

- Voir [07-doc-consolidation.md § Definition of Done](./07-doc-consolidation.md#definition-of-done--phase-8).
- En une phrase : la doc Claude est centralisée, courte, à jour, hiérarchique, conforme aux conventions Anthropic.

---

## Phase 9 — Fidélité design (assets + ui-test + composants existants) {#phase-9}

**Durée : 2-3 jours.** Ajoutée après le run nocturne du 2026-05-04/05 quand l'utilisateur a constaté que le design ne respecte pas l'existant : la library `src/ui/` est portée mais sous-exploitée, les assets PNG et spritesheets ne sont pas branchés, et la page de démo `/ui-test` (17 sections) n'a pas été portée.

> **Pour l'agent qui exécute cette phase** : tout est déjà fait côté design dans le legacy. Ton job est **branchage**, pas création. Avant de coder une couleur ou un layout, ouvre la page de référence dans le legacy et copie. Pas de tailwind brut sur les écrans HUD, pas d'emoji `Text` dans le canvas Pixi pour des bâtiments — il y a des sprites.

### Pourquoi cette phase existe

Le run autonome a livré le **pipeline complet** (auth → WS → HUD → WorldMap → VillageScene → expéditions) en une nuit, mais pour tenir les délais il a pris quatre raccourcis graphiques majeurs :

1. **Composants `src/ui/` copiés mais non utilisés** — les écrans (`LoginScreen`, `RegisterScreen`, `MyWorldsScreen`, `WorldSelector`, `GameHeader`, `BuildingDetailModal`, `SelectedEntityPanel`, `ExpeditionList`, `QueueBar`, `NavRail`) sont écrits avec du Tailwind brut au lieu de composer `Panel`, `Card`, `HeaderBar`, `Modal`, `Toast`, `ResourceIcon`.
2. **Palette inversée** — le legacy utilise un fond clair parchemin (`from-[#e8d5b7] via-[#f5e6d3] to-[#d4c094]`), le run a mis du sombre (`#2a1f12`) partout.
3. **Assets PNG du legacy ignorés** — `battleforthecrown/public/assets/` contient déjà `castle.png`, `barracks.png`, `farm.png`, `iron.png`, `stone.png`, `warehouse.png`, `watchtower.png`, `crown.png`, `clock.png`, `army-power.png`, `position.png`, `lock.png`, `hand-{gold,red,silver}.png` et plus, **non copiés** dans `battleforthecrown-pixi/public/`.
4. **Spritesheets externes ignorés** — `AUTONOMOUS_RUN.md` lignes 101-128 listait explicitement `StrategyGameIcons/Spritesheets/spritesheet.{png,json}` et `Icon Pack - Casual Game 300/256x256/` à copier. **Pas fait.** Les bâtiments Pixi sont rendus en `Graphics` colorés + emoji.

Cette phase corrige les quatre.

### Inventaire des ressources existantes (à connaître AVANT de coder)

#### Composants UI déjà portés (à exploiter, pas à recréer)

`battleforthecrown-pixi/src/ui/` (déjà commité Phase 1) contient :

| Sous-dossier | Composants | Usage type |
|---|---|---|
| `buttons/` | `Button` (variants `success`/`info`/`danger`/`warning`/`neutral` × tailles `xs`/`sm`/`md`/`lg`/`xl`), `IconButton` | CTA principaux et secondaires |
| `inputs/` | `Input` (variants `default`/`parchment`/`success`/`error`), `InputLabel`, `InputHelperText`, `Checkbox`, `Radio`, `Textarea` | Formulaires |
| `cards/` | `Card`, `CardBanner`, `CardBody`, `CardFooter`, `CardImage`, `CardTitle`, `CardStats`, `StatsContent` | Grilles d'éléments |
| `panels/` | `Panel` (variants), `PanelHeader`, `PanelBody`, `PanelFooter`, `BottomSheet` | Conteneurs de section |
| `modals/` | `Modal`, `ModalBody`, `ModalFooter` | Dialogues |
| `layout/` | `HeaderBar`, `PopulationIndicator`, `PlayerProfile`, `ResourceDisplay`, `HeaderActions` | Top bar du jeu |
| `toasts/` | `Toast`, `ToastProvider`, `useToast` | Notifications transitoires |
| `tooltips/`, `badges/`, `avatars/`, `selects/`, `sliders/`, `spinners/`, `feedback/` (`ProgressBar`), `floating-buttons/`, `common/` (`ResourceIcon`) | Primitives | — |

Chaque sous-dossier a un `README.md` documentant les variants. La page de démo qui les met tous en scène vit dans `battleforthecrown/src/app/ui-test/` (à porter, voir 9.B ci-dessous).

#### Assets PNG du legacy (à copier)

```
battleforthecrown/public/assets/
├── army/                       # PNG d'unités
├── bg/                         # backgrounds
├── resources/                  # icônes ressources (wood/stone/iron/gold/food)
├── ui/                         # éléments UI (boutons, cadres, parchemin)
├── world/                      # sprites du monde (villages, châteaux barbares)
├── castle.png                  # 973 KB — sprite château joueur
├── barracks.png                # 1 MB
├── farm.png                    # 954 KB
├── iron.png, stone.png         # ~985 KB chacun
├── warehouse.png, watchtower.png
├── army-power.png              # icône puissance
├── crown.png                   # couronne premium
├── clock.png                   # icône temps
├── lock.png                    # bâtiment verrouillé
├── position.png                # marqueur de position
└── hand-gold.png, hand-red.png, hand-silver.png  # boutons type Clash
```

#### Spritesheets externes (hors repo)

| Pack | Chemin | Contenu | Cible |
|---|---|---|---|
| StrategyGameIcons | `/Users/kelvindupont/Documents/Kelvin/games/StrategyGameIcons/Spritesheets/spritesheet.{png,json}` | 86 icônes 128×128, format TexturePacker JSON Hash compatible Pixi `Assets.load` (WoodLogs, Stone, Bricks, GoldCoin, Wheat, Cow, Sheep, HorseHead, Barrel, Cloth…) | Icônes ressources HUD, icônes commerce (futur), animaux (décoration village) |
| Icon Pack - Casual Game 300 | `/Users/kelvindupont/Documents/Kelvin/games/Icon Pack - Casual Game 300/256x256/` | PNG individuels 256×256 | `ICON_Crown.png`, `ICON_Coin.png`, `ICON_Card_Gold.png`, `ICON_Bell_Gold.png` pour boutons et notifications |

#### Pages legacy non encore portées

```
battleforthecrown/src/features/army/components/       # ArmyInterface, UnitCard, UnitDetailModal, UnitList
battleforthecrown/src/features/combat/components/     # AttackDetailModal, ExpeditionCard, ExpeditionList,
                                                       # ExpeditionsBottomSheet, ExpeditionsFloatingButton,
                                                       # LootDisplay, ReportCard, ReportsList,
                                                       # RemainingResourcesDisplay, ResourceLootSummary,
                                                       # UnitLosses, ArmyPowerDisplay
battleforthecrown/src/app/game/army/page.tsx
battleforthecrown/src/app/game/messages/page.tsx
battleforthecrown/src/app/game/combat-report/[id]/page.tsx
```

### Tâches

#### 9.A — Copier les assets dans le nouveau frontend

- [ ] `cp -R battleforthecrown/public/assets battleforthecrown-pixi/public/assets` — duplique tout l'arbre PNG du legacy.
- [ ] `mkdir -p battleforthecrown-pixi/public/assets/strategy-icons && cp "/Users/kelvindupont/Documents/Kelvin/games/StrategyGameIcons/Spritesheets/spritesheet."{png,json} battleforthecrown-pixi/public/assets/strategy-icons/` — spritesheet TexturePacker.
- [ ] `mkdir -p battleforthecrown-pixi/public/assets/casual-icons && cp "/Users/kelvindupont/Documents/Kelvin/games/Icon Pack - Casual Game 300/256x256/ICON_Crown.png" battleforthecrown-pixi/public/assets/casual-icons/crown.png` (et les 3-4 autres : `ICON_Coin.png` → `coin.png`, `ICON_Card_Gold.png` → `card-gold.png`, `ICON_Bell_Gold.png` → `bell-gold.png`).
- [ ] Vérifier que le `.gitignore` racine ne filtre pas `*.png` (il n'est pas censé, mais double-check).
- [ ] Commit : `chore(pixi-frontend/assets): import legacy + external pack PNGs and spritesheets`.

#### 9.B — Porter la page `/ui-test` (référence visuelle pour la suite)

- [ ] `cp -R battleforthecrown/src/app/ui-test battleforthecrown-pixi/src/features/ui-test` (nouveau emplacement, c'est plus une *feature* qu'une *route Next*).
- [ ] Adapter les imports : `@/ui` reste valable (l'alias est branché), retirer les `'use client'` (pas de Next), retirer `Providers` import si inutilisé, ajuster les `Link` next → `react-router`.
- [ ] Ajouter une route `/ui-test` dans `src/App.tsx` (pas protégée, accessible librement). Lazy ou eager au choix.
- [ ] Vérifier que les 17 sections (`Buttons`, `FloatingButtons`, `Avatars`, `Modals`, `Cards`, `Inputs`, `CheckboxesRadios`, `Selects`, `Tooltips`, `Badges`, `Toasts`, `Spinners`, `Sliders`, `Panels`, `Textareas`, `HeaderBar`, `ProgressBars`) s'affichent correctement.
- [ ] Si une section casse (faute d'asset, faute d'icône), corriger plutôt que la commenter — c'est précisément ce que cette phase doit débusquer.
- [ ] Commit : `feat(pixi-frontend/ui-test): port the legacy UI demo route`.

#### 9.C — Refactor des écrans non-Pixi avec les composants existants

Pour chaque écran ci-dessous, **ouvrir d'abord la version legacy correspondante** puis composer avec `Panel/Card/HeaderBar/Modal/Toast/ResourceIcon/PlayerProfile` au lieu de Tailwind brut. Conserver les hooks TanStack Query et Zustand existants — la plomberie data ne change pas, seul le rendu change.

| Écran à refactorer | Référence legacy | Composants à utiliser | Fond |
|---|---|---|---|
| `LandingScreen.tsx` | `src/app/page.tsx` + `app/layout.tsx` | `Card` ou layout direct selon legacy | parchemin clair |
| `LoginScreen.tsx` | `features/auth/components/LoginScreen.tsx` | `Panel variant="parchment"`, `PanelHeader`, `PanelBody`, `Input`, `Button` | parchemin clair (`from-[#e8d5b7] via-[#f5e6d3] to-[#d4c094]`) |
| `RegisterScreen.tsx` | `features/auth/components/RegisterScreen.tsx` | `Card`, `CardBanner`, `CardBody`, `CardFooter` | parchemin clair |
| `WorldSelector.tsx` | `features/worlds/components/WorldSelector.tsx` | `Card`, `Panel`, `Button` | aligner sur legacy |
| `MyWorldsScreen.tsx` | (pas d'équivalent direct, s'inspirer de `WorldSelector` legacy) | `Card`, `Button`, `Spinner` | aligner sur legacy |
| `GameHeader.tsx` (`features/layout/`) | `features/layout/GamePageHeader` (legacy) + `ui/layout/HeaderBar` | **`HeaderBar` directement** au lieu de div Tailwind, `PlayerProfile`, `ResourceDisplay`, `PopulationIndicator`, `HeaderActions` | sombre top bar OK (cf legacy) |
| `BuildingDetailModal.tsx` (`features/village/`) | `features/village/components/BuildingDetailModal.tsx` | `Modal`, `ModalBody`, `ModalFooter`, `ProgressBar`, `Button` | `Modal` standard |
| `SelectedEntityPanel.tsx` (`features/world/`) | (pas exact ; s'inspirer de `WorldSelectedEntityPanel` du plan) | `Panel`, `Badge`, `Button` | sombre OK (overlay carte) |
| `ResourceBar.tsx` (`features/resources/`) | `ui/layout/ResourceDisplay` | **`ResourceDisplay` directement** + `ResourceIcon` (PNG, pas emoji) | aligné HeaderBar |
| `ExpeditionList.tsx` (`features/combat/`) | `features/combat/components/ExpeditionList.tsx` | `Card` ou `Panel`, `Badge` pour la phase | sombre OK |
| `QueueBar.tsx` (`features/village/`) | `features/village/components/QueueBottomSheet.tsx` | `BottomSheet` + `ProgressBar` | aligné legacy |
| `NavRail.tsx` (`features/layout/`) | `features/village/components/BottomNavigationBar.tsx` | `IconButton` avec icônes lucide-react ou PNG | sombre OK |
| `StubPanel.tsx` (`features/layout/`) | — | À supprimer en 9.D, remplacé par les vrais panels Army/Combat | — |

- [ ] Tailwind config : vérifier que la palette `parchment`, `kingdom`, `game.*` est bien dispo (elle l'est, copiée Phase 0). Si un token spécifique manque (ex `[#8b7355]` utilisé en bordure), l'ajouter à `tailwind.config.ts` plutôt qu'en littéral.
- [ ] Remplacer **toutes** les emoji UI (🏰⛏️🪓🌾🏛️🗼🧱🕳️) par soit des PNG via `ResourceIcon` ou `<img>`, soit des icônes lucide-react. Aucune emoji `Text` ne doit subsister dans `src/features/`.
- [ ] Tester dans `/ui-test` que les composants composent correctement. Tester chaque écran réécrit dans le navigateur.
- [ ] Commit : `refactor(pixi-frontend/screens): use ui/ library + parchment palette + PNG assets`.

#### 9.D — Porter les features manquantes (Army, Combat, Reports)

- [ ] **Army** (`features/army/`) :
  - Porter `ArmyInterface`, `UnitCard`, `UnitDetailModal`, `UnitList` depuis `battleforthecrown/src/features/army/components/`.
  - Wirer aux endpoints `GET /army/{id}/inventory`, `GET /army/{id}/training`, `POST /army/{id}/train`, `DELETE /army/{id}/training/{trainingId}/cancel`.
  - Ajouter les queries dans `src/api/queries.ts` : `useArmyInventoryQuery`, `useArmyTrainingQuery`, `useTrainUnitsMutation`, `useCancelTrainingMutation`.
  - Stub Phase 3.F (`features/layout/StubPanel.tsx` "Armée à venir Phase 3.x") → écran réel.
- [ ] **Combat / Expeditions** (`features/combat/`) :
  - Porter `AttackDetailModal`, `ExpeditionsBottomSheet`, `ExpeditionsFloatingButton`, `LootDisplay`, `ResourceLootSummary`, `UnitLosses`, `RemainingResourcesDisplay`, `ArmyPowerDisplay`.
  - L'`ExpeditionList` Phase 6 minimaliste devient un wrapper du composant legacy (ou est remplacé).
  - Wirer `POST /combat/attack` (qui était déjà côté backend, jamais branché côté front).
- [ ] **Combat reports** :
  - Porter `ReportCard`, `ReportsList` + page `app/game/combat-report/[id]/page.tsx`.
  - Nouvelle route `/game/reports` et `/game/reports/:reportId` dans `src/App.tsx`.
  - Wirer endpoints `GET /combat/reports`, `GET /combat/report/{id}`, `PATCH /combat/report/{id}/read`, `DELETE /combat/report/{id}`.
  - Le toast `battle.resolved` Phase 6 devient cliquable et ouvre `/game/reports/:reportId`.
- [ ] **Crowns** (`features/crowns/`) :
  - Porter `CrownsManager` legacy.
  - Stub Phase 3.F → écran réel avec balance interpolée + transactions.
- [ ] **Power** (`features/power/`) :
  - Porter `PowerBottomSheet` + leaderboard.
  - Wirer `GET /power`, `GET /power/leaderboard`, `GET /power/kingdom/{userId}`.
- [ ] Supprimer `features/layout/StubPanel.tsx` et `features/layout/NavRail.tsx` stubs → remplacer par la vraie nav (`BottomNavigationBar` legacy).
- [ ] Commits granulaires : `feat(pixi-frontend/army): port army screens`, `feat(pixi-frontend/combat): port attack + reports`, `feat(pixi-frontend/crowns): port crowns manager`, `feat(pixi-frontend/power): port power leaderboard`.

#### 9.E — Refactor Pixi avec sprites réels

- [ ] `pixi/assets/manifest.ts` : déclarer 3 bundles Pixi `Assets.addBundle(...)` :
  - `boot` : favicon, fond du loader.
  - `village` : tous les PNG de bâtiments (`/assets/castle.png`, etc.) + `/assets/strategy-icons/spritesheet.json` pour les ressources.
  - `world-map` : icônes barbares, château joueur, marqueurs (à créer ou extraire d'un pack si pas déjà au legacy).
- [ ] `pixi/assets/loader.ts` : wrapper `Assets.loadBundle(name, onProgress)` qui retourne une `Promise<Record<string, Texture>>`.
- [ ] `BootScene` : afficher la barre de progression en utilisant le loader (la scène existe déjà, lui ajouter un `onProgress`).
- [ ] `BuildingSprite.ts` :
  - Remplacer le `Graphics + emoji Text` actuel par `Sprite` chargé depuis `Texture.from('/assets/castle.png')` (etc.).
  - Garder le système flash + halo + progress bar (qui sont au-dessus du sprite, pas à la place).
  - Le label `Niv. X` peut rester en `Text` Pixi.
- [ ] `WorldMapScene.ts` : remplacer les cercles colorés par des petits sprites tirés du spritesheet ou d'icônes dédiées (à choisir : couronne pour mes villages, picto barbare teinté par tier).
- [ ] `ExpeditionVisual.ts` : le sprite `⚔️/🐎` en `Text` peut rester (ou utiliser `HorseHead.png` du spritesheet) ; les particules de poussière OK en `Graphics` (légères) ou bascule sur `@pixi/particle-emitter` si la perf le justifie.
- [ ] Commit : `feat(pixi/assets): load real building + map sprites via Assets.loadBundle`.

### Tests à ajouter / mettre à jour

- [ ] Tests des nouvelles queries Army / Combat / Reports / Crowns / Power (mocked fetch comme `client.test.ts`).
- [ ] Test du loader d'assets (mock `Assets.loadBundle` ou simple test de la signature `manifest`).
- [ ] Snapshot test de la palette Tailwind (présence des couleurs `parchment`, `kingdom-100`, etc.) — facultatif mais utile pour éviter les régressions.
- [ ] Pas de tests visuels obligatoires (vérification user dans le navigateur).

### Definition of Done

- ✅ La route `/ui-test` est accessible et toutes les 17 sections rendent correctement.
- ✅ Aucun `'use client'`, aucune emoji UI dans `src/features/` (les emojis du `buildingMeta` sont remplacés par des PNG).
- ✅ Tous les écrans listés en 9.C utilisent au moins un composant de `src/ui/` (pas de Tailwind brut sur des conteneurs qui devraient être un `Panel` ou `Card`).
- ✅ Aucune route ne tombe sur un `StubPanel`. Army, Combat, Reports, Crowns, Power ont leurs vrais écrans portés.
- ✅ Le `BuildingSprite` Pixi affiche un sprite PNG (pas un `Graphics + emoji`) ; idem `WorldMapScene` pour les villages.
- ✅ `yarn workspace battleforthecrown-pixi build` réussit, type-check et lint propres.
- ✅ Bundle prod reste sous 500 KB JS gzip pour l'initial. Les assets sont en `public/` (donc hors bundle JS, téléchargés à la demande).
- ✅ CHANGELOG entrée Phase 9 ajoutée. README index mis à jour.

### Garde-fous spécifiques (à lire avant de coder)

- Ne **pas re-créer** un composant qui existe dans `src/ui/`. Si tu hésites, va dans `/ui-test` voir ce qui existe.
- Ne **pas modifier** les composants `src/ui/` à moins d'un bug avéré — ils sont copiés du legacy et leur API doit rester stable pour comparaison côté à côté.
- Respecter le **palette legacy** : parchemin clair pour les écrans hors-jeu (login/worlds), sombre pour le HUD in-game (header, panels overlay sur canvas).
- Les **assets PNG sont gros** (1 MB chacun pour les bâtiments). Lazy-loader via `Assets.loadBundle` côté Pixi pour éviter de plomber le TTI. Côté React, `<img loading="lazy">`.
- Le legacy utilise `next/image` et `next/link`. Remplacer par `<img>` et `react-router Link` à chaque port.
- **Pas de `git push`**, **pas de modification du backend**, **pas de modification du dossier `battleforthecrown/`** (legacy intact). Le user supprimera le legacy quand il aura validé Phase 9.
- Si un sprite manque (ex: pas de `barbarian-village.png`), l'**identifier explicitement dans le CHANGELOG Phase 9** sous "Assets manquants à produire" plutôt que de retomber sur un `Graphics`.

---

## Critères pour reporter une phase

Avant de passer à la phase suivante :

1. ✅ Definition of Done atteinte.
2. ✅ Démo manuelle réalisée (capture vidéo dans `docs/migration/demos/` si possible).
3. ✅ CHANGELOG mis à jour.
4. ✅ Commits propres, pas de WIP traînant.

Si une Definition of Done n'est pas atteinte → **STOP et re-plan**, on ne fait pas semblant de finir.

## Tableau récap

| Phase | Effort | Dépendances | Livrable |
|-------|--------|-------------|----------|
| 0 | ½j | — | App Pixi qui boot + scaffold complet |
| 1 | 1j | 0 | Login + sélection monde fonctionnels |
| 2 | 1-2j | 1 | WS connecté, ressources qui interpolent |
| 3 | 1-2j | 2 | HUD village complet sans canvas |
| 4 | 3-5j | 2 | World map PixiJS jouable 60fps |
| 5 | 2-3j | 3 | Village view PixiJS jouable (top-down, zoom/pan) |
| 6 | 2-3j | 4, 5 | Animations expéditions/combats + particules |
| 7 | 2j | 6 | Polish, perf, suppression legacy |
| 8 | 1-2j | 7 | Consolidation documentaire (CLAUDE.md hiérarchique) |
| 9 | 2-3j | 0..6 livrables existants | Fidélité design : assets PNG + spritesheets, page `/ui-test` portée, écrans HUD refactorés sur `src/ui/`, sprites Pixi réels, features Army/Combat/Reports/Crowns/Power portées |
| **Total** | **~16-23j** | — | — |
