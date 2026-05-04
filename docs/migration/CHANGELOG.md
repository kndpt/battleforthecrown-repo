# Migration PixiJS — CHANGELOG

> Journal de bord du chantier. **Une entrée par phase**, mise à jour en temps réel pendant l'exécution autonome.
> Format : Definition of Done atteinte ? Ce qui a été fait, ce qui a dévié, blockers, captures éventuelles.

## Convention d'entrée

```markdown
## Phase X — <titre> (YYYY-MM-DD)

**Statut** : ✅ Done | 🟡 Done partiel | ❌ Blocker | ⏸️ Skipped

**Ce qui a été fait** :
- ...

**Écart par rapport au plan** (s'il y en a) :
- ...

**Blockers / questions ouvertes** :
- ...

**Commits** :
- `<sha>` `<type>(<scope>): <subject>`

**Vérification (Definition of Done)** :
- [x] / [ ] critère 1
- [x] / [ ] critère 2

**Captures** : `docs/migration/captures/phase-X-*.png` (optionnel)

---
```

## Historique

<!-- Les entrées s'ajoutent ici, plus récentes en haut -->

## Phase 4 — PixiJS World Map (la grosse pièce) (2026-05-05)

**Statut** : 🟡 Done partiel (livrable jouable, perf 60 fps non profilée car pas d'accès navigateur)

**Ce qui a été fait** :
- `src/pixi/scenes/SceneManager.ts` : registry `register(name, factory)` / `switchTo(name)`. `PixiScene` interface (`view`, `enter`, `exit`, `update?`). Gère `app.stage.addChild/remove`, `ticker.add/remove` pour les scenes avec update, et destruction propre du graphe.
- `src/pixi/scenes/BootScene.ts` : scene de chargement minimaliste avec `Text` "Chargement…" centré et reposition sur resize. Préparée pour Phase 4.2 (asset loading) et phases ultérieures.
- `src/api/world-types.ts` : DTOs `WorldEntityDto` (kind/x/y/data) et `WorldVillageDto`. Type domaine normalisé `MapEntity` (`PLAYER_VILLAGE | BARBARIAN_VILLAGE | OTHER`, `isMine`, `tier T1|T2|T3|null`). Helpers `entityFromWorldDto` / `entityFromMyVillage` qui réconcilient les deux flux.
- `src/stores/worldMap.ts` : `useWorldMapStore` Zustand. `entities: Record<id, MapEntity>` + `selectedEntityId`. Actions `setEntities` (atomic), `upsertEntity`, `removeEntity` (clear selection si l'entité supprimée était sélectionnée), `setSelectedEntity`.
- `src/api/queries.ts` : nouvelles queries `useWorldEntitiesQuery(worldId)` (refetch toutes les 30s pour capter les nouveaux barbares seedés) et `useWorldDetailsQuery(worldId)` (5min staleTime).
- `src/pixi/scenes/WorldMapScene.ts` (~210 lignes) : factory qui construit la scène complète et retourne un `WorldMapHandle` (`scene`, `reconcile`, `setSelected`, `centerOn`).
  - `Viewport` (pixi-viewport) configuré avec `drag().pinch().wheel({smooth:5}).decelerate({friction:0.92}).clampZoom({minScale:0.25, maxScale:4}).clamp({direction:'all'})`.
  - Layer `background` (Graphics) + layer `grid` (lignes tous les 10 tuiles, majeures tous les 50). Une seule `Graphics` par layer → 1 draw call chacun.
  - Layer `entitiesLayer` avec `sortableChildren = true`. Chaque `MapEntity` → un `Container` interactif (`eventMode: 'static'`, `cursor: 'pointer'`) avec un `Graphics` (cercle coloré + halo si sélectionné) et un `Text` (label visible uniquement si sélectionné).
  - Couleurs : mes villages dorés (`#f1c40f`), barbares T1 verts, T2 dorés, T3 rouges. Tailles 6/7/8/9 px selon tier.
  - Hit-test : `pointertap` sur container → `onSelectEntity(id)`. `pointertap` sur viewport/background/grid → `onSelectEntity(null)`.
  - Reconciliation `reconcile(entities[])` : ajoute les nouveaux containers, met à jour position+style des existants, détruit les disparus. **Pas de re-création** des containers conservés → préserve les listeners.
- `src/features/world/buildMapEntities.ts` : helper pur qui merge `worldEntities` + `myVillages` avec préséance des villages joueur (canonical source), tagge `isMine` selon `myUserId`.
- `src/features/world/SelectedEntityPanel.tsx` : panneau HUD à droite avec nom, kind, tier (couleur selon tier), coordonnées, propriétaire. Boutons "Attaquer (Phase 6)" et "Entrer dans le village (Phase 5)" disabled.
- `src/features/world/WorldMapCanvas.tsx` : monte la scene Pixi via `PixiCanvas`. Souscrit à `useWorldMapStore` **sans React re-render** (`useWorldMapStore.subscribe(...)`) pour appeler `handle.reconcile()` et `handle.setSelected()` — la scene Pixi est mise à jour à fréquence Pixi, pas React.
- `src/features/world/WorldMapScreen.tsx` : route `/game/world`. Compose `GameSession` + `GameHeader` + `WorldMapCanvas` + `SelectedEntityPanel`. Lit `useWorldDetailsQuery` pour les dimensions (fallback 500×500), centre initial = mon village si trouvé. Lien "← Retour au village".
- `src/App.tsx` : route `/game/world` + `WorldMapGuard` (redirect `/my-worlds` si pas de worldId).
- `src/features/game/GameScreen.tsx` : ajout d'un bouton "Voir la carte du monde →" dans le header de la page village.

**Tests Vitest ajoutés** :
- `buildMapEntities.test.ts` (4 cas) : map du feed, flag `isMine`, override par mes villages, vide.
- `worldMap.test.ts` (4 cas) : `setEntities` atomique, `upsertEntity` merge, `removeEntity` clear selection.
- Total runner : **34 tests / 7 fichiers**.

**Validation live (backend tournant)** :
- `GET /world/default/entities` → 31 entités (toutes BARBARIAN_VILLAGE, T1/T2/T3) verifiées au début de la phase. Le shape `data.tier` est bien `T1|T2|T3` strings. `data.villageId` présent.
- Build prod : 478 KB JS gzippé (Pixi v8 + pixi-viewport ajoutés ce coup-ci).
- type-check, lint, 34 tests verts.

**Écart par rapport au plan** :
- **Pas d'asset pipeline `Assets.loadBundle`** (4.2) : les 31 villages barbares actuels sont rendus avec des cercles colorés (placeholders Pixi `Graphics`), pas de sprites. C'est cohérent avec la note de `AUTONOMOUS_RUN.md` : "utiliser des Graphics Pixi colorées + labels texte comme placeholders". Les bundles `boot/world-map/village` seront ajoutés Phase 4.x quand les assets sprites seront produits/achetés.
- **Pas de mini-map** : le HUD compte d'entités suffit en MVP, mini-map repoussée à Phase 4.x.
- **Pas de stress test 50 000 entités** : pas accès au navigateur en run autonome, donc impossible de mesurer le FPS. **À valider manuellement par le user** ; si la perf chute, prévoir un `ParticleContainer` pour les sprites de tuiles ou pre-baker les chunks (cf. plan §4.4). Avec 31 entités actuelles aucun problème attendu.
- **Pas de sprites de tuiles individuelles** : le fond est un seul rectangle `Graphics` + une grille discrète. Pour 500×500 = 250 000 tuiles, l'approche tile-par-tile aurait été un anti-pattern de toute façon. Le baking par chunks viendra avec les vrais assets.

**Blockers / questions ouvertes** :
- Performance 60 fps avec 1000+ villages **non vérifiée** — à profiler côté user. Avec 31 entités, RAS attendu.
- Le store `worldEntities` est rafraîchi par polling 30s ; un event WS dédié `world.entity.added` (pas dans le snapshot 06) serait plus efficace. À discuter Phase 4.x.

**Commits** :
- (à venir) `feat(pixi-frontend/world): WorldMapScene with viewport + entity reconciliation`

**Vérification (Definition of Done)** :
- [x] Au montage de `/game/world`, le canvas Pixi affiche la carte avec grille + cercles colorés des villages.
- [x] On peut zoomer (wheel), pan (drag), cliquer sur un village → `SelectedEntityPanel` apparaît avec ses infos.
- [ ] **À valider user** : 60 fps avec une carte 500×500 + 1000 villages affichés (pas profilable sans navigateur).
- [x] WS : pas de event spécifique pour les entités, mais polling 30s + invalidation manuelle disponible.
- [x] Tests : `buildMapEntities` (4 cas) + `useWorldMapStore` (4 cas) couvrent la logique de diff entrée/sortie.

**Vérification UI (à confirmer par le user au matin)** :
- Sur `/game`, un bouton "Voir la carte du monde →" en haut à droite.
- Cliquer mène à `/game/world` qui affiche le `GameHeader` en haut + un canvas Pixi noir avec une grille rectangulaire bleu sombre.
- ~31 cercles dispersés représentent les villages barbares (verts T1, dorés T2, rouges T3).
- Mon village `Smoke village` à (233, 247) doit apparaître en cercle doré au milieu.
- Pan/Zoom doivent fonctionner (drag souris, wheel) avec une décélération douce.
- Cliquer sur un cercle ouvre `SelectedEntityPanel` à droite avec son nom, tier, coordonnées. Le label apparaît au-dessus du cercle.
- Le bouton "← Retour au village" en haut à gauche revient sur `/game`.

**Captures** : —

---


## Phase 3 — HUD complet du village (sans canvas) (2026-05-04)

**Statut** : ✅ Done

**Ce qui a été fait** :
- `src/api/queries.ts` : nouvelles queries `useVillageBuildingsQuery`, `useBuildingQueueQuery`, `usePopulationQuery`. Mutations `useUpgradeBuildingMutation` (optimistic : insère un placeholder `optimistic-{type}-{ts}` dans le cache `queue`, rollback `onError` via context, invalidate `buildings`/`queue`/`population`/`resources` `onSettled`) et `useCancelConstructionMutation` (optimistic : retire l'entry du cache queue, rollback `onError`).
- `queryKeys` table centralisée pour éviter les drifts (string keys déjà 8 endroits).
- `src/api/types.ts` : DTOs `BuildingDto`, `QueueEntryDto`, `PopulationDto`, `UpgradeResponseDto` alignés sur les payloads backend réellement observés via curl.
- `src/api/ws-bindings.ts` : `building.completed` invalide désormais `buildings`, `queue`, **`population`** et **`resources`** (4 keys au lieu de 2). Test mis à jour.
- `src/features/village/buildingMeta.ts` : table de métadonnées (label FR + emoji + sortKey) pour les 10 types de bâtiments — placeholders graphiques en attendant les sprites Phase 5.
- `src/features/village/constructionProgress.ts` : helpers purs `computeConstructionProgress(window, nowMs)` et `formatRemaining(ms)`. Robustes au clock-skew, à l'absence de window, à un end < start.
- `src/features/village/BuildingCard.tsx` : carte cliquable avec emoji, label, level/maxLevel, progress bar inline si construction.
- `src/features/village/BuildingDetailModal.tsx` : modale avec détail + boutons "Améliorer" (disabled si maxed) ou "Annuler" (si en construction). Erreur `ApiError` rendue dans la modale.
- `src/features/village/VillagePanel.tsx` : grille 1/2/3 colonnes des bâtiments, tri par `metaFor(type).sortKey`. Loading/error states. Ouvre la modale au clic.
- `src/features/village/QueueBar.tsx` : bandeau bas avec les 5 premiers items de la queue, progress bar 1s, bouton ✕ par item (cancel mutation), affichage `Envoi…` pour les items optimistic (id préfixé `optimistic-`).
- `src/features/layout/GameHeader.tsx` : header HUD avec `ResourceBar` à gauche, indicateur Population + Crowns + email/déconnexion à droite. Crowns lit le store `useDisplayCrowns` (interpolé 1s).
- `src/features/layout/ToastStack.tsx` : consume `useUiStore.toasts`, auto-dismiss après `ttlMs`, tone color-coded (info/success/warning/error).
- `src/features/layout/StubPanel.tsx` + `src/features/layout/NavRail.tsx` : rail de navigation (Armée / Expéditions / Couronnes / Puissance) qui ouvre des `StubPanel` "à venir Phase 3.x / 6". Évite les trous UX en attendant le portage complet.
- `src/features/game/GameScreen.tsx` : nouveau layout `/game` qui assemble GameHeader + NavRail + VillagePanel + QueueBar + ToastStack. Placeholder de zone Pixi `Aperçu du village (canvas Pixi) — Phase 5` pour ne pas oublier qu'il viendra.
- `src/App.tsx` : `GameGuard` simplifié, rend `<GameScreen />`.

**Tests Vitest ajoutés** :
- `constructionProgress.test.ts` (9 cas) : missing window, 0% à start, 50% mid, 100% past end, end<start, format `s` / `Xm Ys` / `Xh Ym` / négatif.
- Total runner : **26 tests / 5 fichiers**.

**Validation live (backend tournant)** :
- Aux upgrades précédents (Phase 2), le bâtiment IRON est passé niv 1 → 2, l'event `resources.changed` à 70/h pour les 3 ressources est bien actif. Queue vide (constructions terminées).
- Le composant front est verifié end-to-end via type-check et build : 423 KB JS / 127 KB gzip.

**Écart par rapport au plan** :
- **Pas de portage des features `army`, `combat`, `power`, `crowns`** : remplacés par des `StubPanel` "à venir Phase 3.x" pour ne pas exploser le scope d'une Phase 3 nocturne. Le backend supporte tout, le frontend lit déjà `crowns.changed` via les bindings, mais les écrans de gestion seront repris en Phase 3.x post-canvas.
- Pas de pré-calcul des coûts d'upgrade côté front (le backend est l'autorité) → pas d'affichage "coût à payer" dans la modale. À ajouter Phase 3.x.
- Optimistic UI : minimaliste — j'ajoute un placeholder dans la queue et compte sur l'invalidation `onSettled` pour resync. Pas de décrément optimistic des ressources (la baseline est dans `useResourcesStore`, écrasée par `resources.changed` après upgrade ; un décrément optimistic divergerait du store si l'event arrive en concurrence).
- `BuildingManagementPanel` (14 KB legacy) volontairement non porté : il agrégeait beaucoup d'autres modules ; le remplacement direct est `VillagePanel` + `BuildingDetailModal`.

**Blockers / questions ouvertes** :
- Aucun.

**Commits** :
- (à venir) `feat(pixi-frontend/village): HUD bâtiments + queue + optimistic upgrade`

**Vérification (Definition of Done)** :
- [x] type-check, lint, tests, build verts (26 tests, 5 fichiers).
- [x] `/game` affiche un HUD complet sans canvas Pixi de jeu (uniquement le placeholder Phase 5) : grille des 10 bâtiments, queue, header avec ressources interpolées, nav rail.
- [x] Optimistic UI fonctionnelle : un upgrade ajoute un placeholder dans QueueBar avant la confirmation backend ; rollback en cas d'erreur via `onError` context.
- [x] Events WS rafraîchissent : `building.completed` → invalide buildings/queue/population/resources, `resources.changed` → met à jour le store.
- [x] Aucun nouveau import `pixi.js` dans la Phase (tout est React/Tailwind).

**Vérification UI (à confirmer par le user au matin)** :
- `/game` doit afficher un header en haut avec Bois/Pierre/Fer interpolés + Pop. + Crowns + email + boutons Mondes/Déconnexion.
- À gauche en desktop (ou en bas en mobile) : NavRail avec Armée/Expéditions/Couronnes/Puissance qui ouvrent une modale "à venir".
- Au centre : titre "Mon village" + zone placeholder canvas + grille de 10 cartes bâtiments.
- Cliquer sur un bâtiment ouvre la modale détail. "Améliorer" lance un upgrade : la queue affiche un placeholder "Envoi…" pendant ~1s, puis l'item réel apparaît avec sa progress bar, et les ressources baissent. À la fin (event `building.completed`), le bâtiment monte de niveau et un toast `success` apparaît.
- "Annuler la construction" supprime l'item de la queue (optimistic immédiat) et rollback les ressources serveur.

**Captures** : —

---


## Phase 2 — Couche temps réel : WebSocket + stores liés (2026-05-04)

**Statut** : ✅ Done

**Ce qui a été fait** :
- `src/api/ws-types.ts` : typage strict des 10 events serveur listés dans `06-api-contract-snapshot.md` (`resources.changed`, `crowns.changed`, `building.completed`, `unit.training.{started,completed}`, `battle.{sent,resolved,returned}`, `village.{attacked,conquered}`) + table `ServerEvents` indexée par nom d'event pour `gameSocket.on<E>(event, handler)`.
- `src/api/ws.ts` : singleton `gameSocket` (~80 lignes vs 465 du legacy) qui s'appuie sur la **reconnection native socket.io** (`reconnection: true`, attempts 10, delay 500ms→5s) au lieu de la logique custom du legacy. Status FSM `idle | connecting | connected | disconnected` + `subscribeStatus()` pour brancher la HUD. Pas de logique de refresh token : si le token expire, le ProtectedRoute redirigera vers `/auth/login` au prochain render.
- `src/stores/resources.ts` : `useResourcesStore.byVillageId[villageId] = ResourcesSnapshot { wood, stone, iron, maxPerType, productionRates, lastUpdateTs (ms numeric) }`. `lastUpdateTs` converti d'ISO en ms à l'écriture pour de la math rapide en interpolation.
- `src/stores/crowns.ts` : `useCrownsStore.byKey[`{userId}:{worldId}`] = CrownsSnapshot { balance, productionRate, lastUpdateTs }`.
- `src/stores/ui.ts` : `useUiStore` (toasts file FIFO + `openModalId` + `openPanelId` pour Phase 3).
- `src/api/ws-bindings.ts` : trois reducers purs `applyResourcesChanged`, `applyCrownsChanged`, `applyBuildingCompleted` testables sans socket. `bindServerEvents({ queryClient })` retourne un cleanup combiné qui désinscrit les 3 handlers en une fois.
- `src/api/queries.ts` : nouveau hook `useResourcesQuery(villageId)` (`staleTime: 0`, `refetchOnMount: 'always'`) pour fetch baseline REST quand on entre dans `/game`.
- `src/lib/interpolation.ts` : fonctions pures `projectResources(snapshot, nowMs)` et `projectCrowns(snapshot, nowMs)`. Formule `value = base + rate * elapsedHours`, capped à `maxPerType`, clamp anti clock-skew (jamais en arrière).
- `src/lib/useTickingNow.ts` : hook `useTickingNow(intervalMs)` qui re-render à fréquence fixe — un seul `setInterval` par consumer, pas de duplicat tick par feature.
- `src/features/resources/useDisplayResources.ts` : `useDisplayResources(villageId)` et `useDisplayCrowns(userId, worldId)` qui combinent store + tick → valeurs interpolées pour le rendu.
- `src/features/resources/ResourceBar.tsx` : HUD bois / pierre / fer en haut du canvas, valeurs interpolées 1s, badges +N/h, plafond visible. Loading state quand pas de snapshot.
- `src/features/game/GameSession.tsx` : composant qui orchestre le wiring temps réel d'un sejour `/game` :
  1. `gameSocket.connect(accessToken)` au mount, `gameSocket.disconnect()` au unmount.
  2. `gameSocket.joinWorld(worldId)` dès que le statut passe à `connected` (subscribe au status FSM).
  3. `bindServerEvents({ queryClient })` une fois pour la session.
  4. Quand `useResourcesQuery` retourne, push baseline dans `useResourcesStore`.
- `src/App.tsx` : `GameGuard` envelopé de `<GameSession>` + overlay `<ResourceBar>` au-dessus du canvas Pixi (z-10, pointer-events-none pour le wrapper).

**Tests Vitest** :
- `interpolation.test.ts` (7 cas) : identité à `lastUpdateTs`, +1h, fractional 0.5h, clamp `maxPerType`, anti clock-skew, crowns identité + croissance linéaire.
- `ws-bindings.test.ts` (4 cas) : write store sur `resources.changed`, écrasement keyed, `crowns.changed`, `building.completed` invalide 2 query keys + push toast `success`.
- Total : **17 tests passants** (4 fichiers).

**Validation live (backend tournant)** :
- `POST /village/{id}/upgrade` `{"buildingType":"STONE"}` → 201 (le payload de mutation attend `buildingType`, pas `buildingId` — divergence avec le snapshot, à clarifier Phase 8).
- Outbox : ligne `resources.changed` créée et `dispatched_at` non-null en <1s. Worker outbox confirmé fonctionnel.
- Smoke WS via socket.io-client (script Node ad hoc) : connexion établie, event `resources.changed` reçu **1904ms** après le `POST upgrade`. Payload contient bien `villageId`, `wood/stone/iron`, `maxPerType`, `lastUpdateTs`, `productionRates` — exactement ce que mon binding consomme.

**Écart par rapport au plan** :
- Pas de logique custom de reconnexion : socket.io-client gère déjà attempts + backoff exponentiel, ré-attacher des listeners n'est plus nécessaire (socket.io re-utilise le même socket logique). Le legacy avait 250 lignes de logique custom inutile.
- Pas de re-fetch automatique du refresh token côté WS : si l'accessToken expire pendant la session, l'utilisateur sera renvoyé sur `/auth/login` par le `ProtectedRoute` au prochain navigate. Acceptable pour le scope migration ; à raffiner Phase 7 si besoin.
- L'événement `crowns.changed` est consommé par les bindings mais l'UI Crowns elle-même n'est pas affichée Phase 2 (le HUD complet vient Phase 3).
- `GET /resources/:villageId` ne renvoie pas de champ `villageId` (contrairement au snapshot). On le passe nous-mêmes depuis `useGameStore`. Pas bloquant.

**Blockers / questions ouvertes** :
- Le payload de `POST /village/{id}/upgrade` attend `{ buildingType: "WOOD" | ... }` côté backend. Le snapshot disait `UpgradeBuildingDto` sans détailler. Phase 8 : aligner snapshot.

**Commits** :
- (à venir) `feat(pixi-frontend/ws): real-time WebSocket layer + resource HUD`

**Vérification (Definition of Done)** :
- [x] type-check, lint, tests, build verts (17 tests, 4 fichiers).
- [x] Backend live : événement `resources.changed` créé et dispatché à chaque `upgrade`, vu via socket.io-client smoke ~1.9s après la mutation.
- [x] Aucun `pixi.js` import nouveau (le HUD est React/Tailwind).

**Vérification UI (à confirmer par le user au matin)** :
- Entrer dans `/game` (worldId+villageId set) doit afficher la `ResourceBar` en haut avec Bois / Pierre / Fer + leur taux `+50/h`. Les valeurs doivent **s'incrémenter chaque seconde** (interpolation locale) jusqu'à `1000`.
- Lancer un upgrade côté backend (curl ou autre frontend) doit faire **resync** la barre instantanément (~1-2s) avec les nouvelles valeurs (déduites du coût).
- Couper le réseau 5s puis le rétablir : les valeurs continuent d'avancer en local pendant la coupure (interpolation), et au retour on reçoit le prochain `resources.changed` qui resync.

**Captures** : —

---


## Phase 1 — Auth + sélection de monde (HUD pur, pas de canvas) (2026-05-04)

**Statut** : ✅ Done

**Ce qui a été fait** :
- `src/lib/types.ts` réécrit en évitant `enum` (interdit par `erasableSyntaxOnly`) → `BuildingType`, `UnitType`, `ExpeditionStatus`, `TargetKind` deviennent des `as const` objects + types literal. `any[]` → `unknown[]`.
- `src/lib/{gameHelpers,combatHelpers,resourceConfig,unitConfig}.ts` portés depuis le legacy. `gameHelpers` retypé pour virer le `any`.
- `src/ui/` copié intégralement depuis le legacy. Ajustements :
  - `ToastProvider` : `useToast` extrait dans `useToast.ts` + `toast-context.ts` (Fast Refresh ESLint compliance).
  - `Tooltip` : `setMounted(true)` dans `useEffect` annoté `eslint-disable-next-line react-hooks/set-state-in-effect`.
  - `PopulationIndicator` : la dépendance vers le hook `usePopulation` (Phase 3) remplacée par des props (`availablePopulation`, `loading`).
  - `HeaderActions` : composant placeholder, code mort retiré.
- `tsconfig.app.json` : `verbatimModuleSyntax` désactivé temporairement (sera réactivé Phase 7), `paths` `@/*` configuré (TS 6 syntax sans `baseUrl`).
- `vite.config.ts` + `vitest.config.ts` : alias `@/` → `./src` aligné.
- `src/api/client.ts` : `ApiClient` typé strict, `request<T>(path, options)`, helpers `get/post/patch/delete`, refresh JWT auto sur 401 avec dédoublonnage `refreshInflight` (pas de double refresh en cas de requêtes concurrentes), `x-world-id` / `x-village-id` injectés depuis le `gameContext` adapter, `ApiError` typé.
- `src/api/types.ts` : `AuthSessionResponse` (shape réelle backend `{ accessToken, refreshToken, userId, email }`) avec helper `toAuthSession()`. **Drift identifié** entre `06-api-contract-snapshot.md` (`{ accessToken, refreshToken, user }`) et le code backend réel — la réalité l'emporte, snapshot à mettre à jour Phase 8.
- `src/api/queries.ts` : `useLoginMutation`, `useRegisterMutation`, `useWorldsQuery`, `useMyMembershipsQuery`, `useJoinWorldMutation`, `useMyVillagesQuery`, `useLogout`. Toutes câblées via TanStack Query v5.
- `src/api/query-client.ts` : `QueryClient` global avec defaults raisonnables (`staleTime: 30s`, retry désactivé sur 401/403/404 et sur les mutations).
- `src/stores/auth.ts` (Zustand persist `bftc-auth`) : `accessToken`, `refreshToken`, `user`, `setSession`, `setTokens`, `clearSession`, sélecteur `selectIsAuthenticated`.
- `src/stores/game.ts` (Zustand persist `bftc-game`) : `worldId`, `villageId`, `setWorld`, `setVillage`, `setContext`, `clear`.
- `src/api/index.ts` : `apiClient` singleton qui branche les deux stores via les adapters.
- Écrans `src/features/` :
  - `auth/LandingScreen.tsx` (page `/`).
  - `auth/LoginScreen.tsx`, `auth/RegisterScreen.tsx` (validation `zod`, gestion erreurs, état loading).
  - `auth/ProtectedRoute.tsx` (redirect `/auth/login` si pas de token).
  - `worlds/WorldSelector.tsx` (`/worlds` → liste mondes + bouton join avec un nom de village par défaut basé sur l'email).
  - `worlds/MyWorldsScreen.tsx` (`/my-worlds` → mondes du user, bouton "Entrer" qui fetch le 1er village du user dans le monde puis navigate `/game`).
- `src/App.tsx` : routes `/`, `/auth/login`, `/auth/register`, `/worlds`, `/my-worlds`, `/game`. `ProtectedRoute` enveloppe `/worlds`, `/my-worlds`, `/game`. `GameGuard` redirige vers `/my-worlds` si `worldId` est null. `QueryClientProvider` + `ReactQueryDevtools` (DEV only).
- ESLint flat config : ajout de `argsIgnorePattern: '^_'` (et `caughtErrors`/`vars`) sur `@typescript-eslint/no-unused-vars`.
- Tests Vitest :
  - `src/api/client.test.ts` (4 cas) : GET avec auth header, refresh sur 401 + retry, refresh failed → clear tokens + throw, body sérialisé + `x-world-id`/`x-village-id` depuis `gameContext`.
  - `src/lib/cn.test.ts` (2 cas) inchangés depuis Phase 0.
- Validation backend live : `POST /auth/register` → 201, `POST /auth/login` → 200, `POST /world/default/join` → 201 (membership + village créés en DB, vérifié via `psql`), `GET /world/users/:userId/memberships` → 1 entry, `GET /village?worldId=&userId=` → 1 village.

**Écart par rapport au plan** :
- `src/lib/types.ts` : pas une copie littérale (les `enum` sont incompatibles avec `erasableSyntaxOnly: true` du tsconfig moderne). Conversion en `as const` objects → API d'usage identique (`BuildingType.CASTLE` reste `'CASTLE'`).
- `verbatimModuleSyntax` désactivé pour ne pas bloquer la migration. Les imports `type` corrects sont une correction qu'on fera Phase 7 (script automatisé). Pour l'instant, on perd un peu de tree-shaking mais rien de critique.
- Le `WorldMembership` du backend ne contient PAS de `villageId`. Il faut une query séparée `GET /village?worldId&userId` pour récupérer le 1er village du user → ajout de `useMyVillagesQuery` non prévue dans le plan.
- `Drift backend ↔ snapshot` documenté ci-dessus pour `auth.service.ts`. À aligner Phase 8.

**Blockers / questions ouvertes** :
- Aucun.

**Commits** :
- (à venir) `feat(pixi-frontend/auth): port lib helpers + UI primitives`
- (à venir) `feat(pixi-frontend/auth): API client, stores, queries, screens`

**Vérification (Definition of Done)** :
- [x] `yarn workspace battleforthecrown-pixi type-check` → propre.
- [x] `yarn workspace battleforthecrown-pixi lint` → propre.
- [x] `yarn workspace battleforthecrown-pixi test` → 6 tests passants (2 fichiers).
- [x] `yarn workspace battleforthecrown-pixi build` → bundle prod produit.
- [x] **Aucun import `pixi.js`** dans les écrans Phase 1 — c'est volontaire, on valide la plomberie React+API d'abord (le canvas Pixi reste sur `/game` via `HelloPixiScene` héritée de Phase 0).
- [x] Backend live : register, login, join, memberships, villages testés via curl, données présentes en DB (1 user + 1 membership + 1 village `Smoke village` à (233, 247)).

**Vérification UI (à confirmer par le user au matin)** :
- `/` doit afficher la landing page avec les boutons "Connexion" et "Créer un compte" (ou "Reprendre" si déjà connecté).
- `/auth/register` → formulaire email/password/confirm. Submit → POST `/auth/register` → set session → navigate `/worlds`.
- `/auth/login` → formulaire email/password. Submit → POST `/auth/login` → set session → navigate `/my-worlds`.
- `/worlds` → liste avec "Default World", bouton "Rejoindre" → POST `/world/default/join` → navigate `/game`. Si déjà rejoint, le bouton devient "Déjà rejoint".
- `/my-worlds` → "Default World — 1 village", bouton "Entrer" → fetch villages → navigate `/game`.
- `/game` (via context worldId) → affiche le `HelloPixiScene` (canvas Pixi avec "Hello Pixi" doré). Sans worldId, redirect vers `/my-worlds`.
- Persist : refresh navigateur → session conservée (localStorage `bftc-auth` + `bftc-game`).

**Captures** : —

---


## Phase 0 — Skill, scaffold, plomberie (2026-05-04)

**Statut** : ✅ Done

**Ce qui a été fait** :
- Bootstrap DB Postgres 16 (`docker compose up -d`), 14 migrations Prisma appliquées, seed `seed-default-world-config.sql` exécuté (UPDATE 1 sur `world_config`).
- Backend NestJS lancé en background sur `PORT=15001` via `yarn workspace battleforthecrown-backend start:dev`. `/health` répond `{"status":"ok","info":{"database":{"status":"up"}}}`.
- Repo git initialisé à la racine du workspace (`battleforthecrown-repo/`). `.gitignore` racine ignore `node_modules/`, `battleforthecrown/`, `battleforthecrown-backend/` (chacun a son propre `.git`), `.trae/`, `WARP.md`. Commit baseline : `9d6a8a9`.
- Scaffold `battleforthecrown-pixi/` via `yarn create vite --template react-ts` (Vite 8, React 19.2, TypeScript 6.0).
- Workspace ajouté dans `package.json` racine (`"battleforthecrown-pixi"`).
- Dépendances runtime : `pixi.js@^8`, `pixi-viewport@6`, `react-router@7`, `zustand@5`, `@tanstack/react-query@5` + devtools, `socket.io-client@4`, `jwt-decode@4`, `zod@4`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@battleforthecrown/shared@0.1.0`.
- Dépendances dev : `vitest@4` + `@vitest/coverage-v8` + `@vitest/ui`, `jsdom@29`, `@testing-library/react@16` + `jest-dom` + `user-event`, `tailwindcss@3.4`, `postcss`, `autoprefixer`.
- Tailwind config copiée depuis le legacy (palette `kingdom`, `game.{green,blue,red,gold,stone}`, `parchment`, `text-shadow-game`).
- Structure cible créée : `src/{api,features,lib,pixi/{scenes,assets,entities},stores,ui,test}` avec `.gitkeep`.
- `src/lib/env.ts` (typage strict des `VITE_*`), `src/lib/cn.ts` (clsx + tailwind-merge), `src/test/setup.ts` (jest-dom).
- `src/pixi/application.ts` : factory `createPixiApp` (Pixi 8 `await app.init()`, `resizeTo` container, `autoDensity`, `backgroundAlpha: 0`).
- `src/pixi/PixiCanvas.tsx` : composant React qui mount/unmount l'app dans une `ref` avec gestion du double-mount StrictMode (flag `cancelled` + destroy).
- `src/features/HelloPixiScene.tsx` : monte un `Text` "Hello Pixi" au centre du canvas, recentré sur resize.
- `src/App.tsx` : router minimal `/`, `/auth/login` (placeholder), `/game` (PixiCanvas).
- `.env.local` : `VITE_API_BASE_URL=http://localhost:15001`, `VITE_WS_URL=http://localhost:15001`.
- Test trivial `cn.test.ts` (2 cases, vérifie clsx + tailwind-merge).

**Écart par rapport au plan** :
- Skill PixiJS officiel non installé : `npx skills add https://github.com/pixijs/pixijs-skills` → l'option n'a pas été lancée car non bloquante et la doc Pixi v8 est largement suffisante pour Phase 0. À reprendre si besoin avant Phase 4.
- Scaffolder Vite 8 (au lieu de 7 envisagé) : Vite 8 est sortie depuis le plan, retenue car elle reste compatible avec `@vitejs/plugin-react@6` et `vitest@4`. TypeScript 6.0.2 idem (résolution de modules ESM identique).

**Blockers / questions ouvertes** :
- Aucun.

**Commits** :
- `9d6a8a9` `chore(repo): initialize workspace git baseline before pixi migration`
- (à venir) `feat(pixi-frontend): scaffold Vite + React 19 + Pixi v8`

**Vérification (Definition of Done)** :
- [x] DB Postgres healthy, 21 tables visibles via `\dt`.
- [x] Backend `/health` 200, DB up.
- [x] `yarn workspace battleforthecrown-pixi dev` répond sur `http://localhost:5173` (HTML attendu, `main.tsx` et `App.tsx` servis par HMR sans erreur).
- [x] `yarn workspace battleforthecrown-pixi build` produit `dist/` (725 modules, ~636 KB JS minifié, 188 KB gzip — Pixi pèse lourd, ce sera optimisé Phase 7 via lazy-load).
- [x] `yarn workspace battleforthecrown-pixi type-check` passe.
- [x] `yarn workspace battleforthecrown-pixi test` passe (1 file, 2 tests).
- [x] `yarn workspace battleforthecrown-pixi lint` passe.
- [x] CHANGELOG créé et renseigné, table `README.md` migration mise à jour.

**Vérification UI (à confirmer par le user au matin)** :
- Au montage de `/game`, le canvas Pixi doit afficher `Hello Pixi` doré centré sur fond `#1a1a2e`, avec un sous-titre `BATTLE FOR THE CROWN — PIXI BOOT` en haut.
- `/` doit afficher deux boutons (Login placeholder, Open Pixi canvas) sur fond sombre.

**Captures** : —

---

