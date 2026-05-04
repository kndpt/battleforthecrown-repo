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
| **Total** | **~14-20j** | — | — |
