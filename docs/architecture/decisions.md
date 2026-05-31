# Décisions d'architecture (ADR)

> Décisions structurantes prises pendant la migration `Next.js → Vite/Pixi` et la conception du backend.
> Format léger : Contexte / Décision / Conséquences. Chaque entrée capture le **pourquoi** que ni le code ni `git log` ne révèlent.
>
> L'historique détaillé de la migration (planning, journal phase par phase, écarts) vit dans `git log` jusqu'à la mi-2026.

---

## ADR-01 — Stack frontend : Vite + React 19 + Pixi v8 + Zustand + TanStack Query

**Contexte.** Le frontend legacy (`battleforthecrown/`) était Next.js 14 + React + Redux/RTK Query + Tailwind. Le rendu monde était fait en Canvas2D bricolé dans des `useEffect`. Trois douleurs : SSR inutile pour un jeu client-side, Redux trop verbeux pour un état majoritairement serveur-autoritaire, Canvas2D plafonnait en perf et rendait l'animation des expéditions pénible.

**Décision.** Réécrire en :
- **Vite** au lieu de Next.js : pas de SSR (le jeu nécessite un user authentifié), build plus rapide, dev server plus simple.
- **React 19** pour le HUD uniquement (auth, panels, modals, bottom sheets).
- **Pixi v8** pour les scènes (Village top-down, WorldMap), avec WebGL/WebGPU.
- **Zustand** pour l'état client (UI state, snapshots WS, sélection courante).
- **TanStack Query** pour le cache REST (queries + mutations + invalidation).

**Conséquences.**
- React et Pixi ne se chevauchent jamais : React ne touche pas au canvas, Pixi ne touche pas au DOM. Communication via stores Zustand subscribed des deux côtés.
- Bundle initial à ~134 KB gzip (sous le cap de 500 KB), Pixi en lazy chunks.
- Plus de SSR → routing client via `react-router`, pas de rehydration.
- Tradeoff Redux → Zustand : moins de boilerplate mais perte des devtools time-travel ; on accepte (l'état dérive surtout du serveur via WS).

---

## ADR-02 — Server-authoritative + pattern Outbox

**Contexte.** Un MMORTS expose ressources, files de construction, expéditions, soldes — tout est sensible à la triche et à la concurrence multi-onglets. Émettre un event WebSocket directement depuis un service NestJS après une mutation crée deux risques : (1) si la transaction DB échoue après l'émit, le client reçoit un event fantôme ; (2) si le serveur crash entre commit DB et emit, l'event est perdu.

**Décision.**
- Le backend NestJS est l'**unique vérité** : ressources, queue, expéditions, power — tout est calculé serveur-side.
- Toute mutation écrit dans la table `EventOutbox` **dans la même transaction Prisma** que la mutation métier.
- Un worker `OutboxWorker` poll la table ~1s, marque les events comme `dispatched`, et les émet via Socket.IO.
- Le frontend **interpole** entre les updates WS pour l'affichage continu (production ressources/seconde) sans jamais se calculer une valeur autoritative.

**Conséquences.**
- Latence mutation → event WS : 0 à ~1s. Acceptable pour un jeu tour par tour.
- Garantie d'idempotence + at-least-once delivery (le client doit dédupliquer si pertinent — pour la plupart des events, l'invalidation TanStack rend ça naturel).
- Pas de cohérence éventuelle non gérée : si le worker tombe, les events s'accumulent et seront re-dispatchés au redémarrage.
- Détail dans `realtime.md` (§ Pattern Outbox) et le skill `bftc-workers-outbox`.

---

## ADR-03 — Optimistic UI sélectif

**Contexte.** Le pattern Outbox impose ~1s de latence avant qu'une action joueur soit visible. Pour une queue de construction, c'est invisible. Pour ajouter une unité à un slider d'attaque, c'est intolérable.

**Décision.** Optimistic UI **autorisé seulement si** :
1. Le backend retourne 200/201 typiquement en <500ms.
2. Le rollback est trivial (annuler une insertion locale, restaurer une snapshot).
3. La cohérence des autres données (ressources, population) sera resynchronisée par les events WS.

Pattern : `onMutate` (snapshot + mutate cache) → `onError` (rollback via context) → `onSettled` (invalidate les keys liées).

**Conséquences.** Convient bien aux annulations de construction, marquer un rapport comme lu, démarrer un entraînement. **Ne convient pas** au lancement d'attaque (effet trop visible côté carte, rollback complexe).

---

## ADR-04 — Reconciliation Pixi sans recréation

**Contexte.** Naïvement, on pourrait à chaque update de store WS détruire la scène Pixi et la recréer. Mais Pixi v8 alloue des `Container`/`Sprite`/`Graphics` lourds, et le ré-attachement d'event listeners fait perdre 200-500ms par reconciliation. Sur une WorldMap avec 1000+ entités, ça plombe le 60 fps.

**Décision.** Chaque scène Pixi (`VillageScene`, `WorldMapScene`) maintient une `Map<id, Handle>` des entités affichées. À chaque update du store, la scène **diff** : ajoute les nouvelles, met à jour les positions/sprites des existantes, supprime celles qui ne sont plus dans le snapshot. Aucune destruction/recréation tant qu'une entité existe.

**Conséquences.**
- Tick stable à 60 fps même avec 1000+ entités sur la WorldMap.
- Code de scène plus complexe (gestion de cycle de vie explicite) — convention documentée dans le skill `bftc-pixi-scene`.
- Subscribe Zustand côté Pixi via `store.subscribe()` direct (pas `useStore`) pour éviter les React re-renders inutiles.

---

## ADR-05 — `pixi-viewport` pour la WorldMap

**Contexte.** La WorldMap est un grand monde 100×100 tiles avec drag/pinch/wheel/decelerate. Implémenter ces gestes from scratch sur Pixi v8 demande ~500 lignes (gestion mobile, momentum, clamp aux bords).

**Décision.** Utiliser la librairie `pixi-viewport` qui expose `.drag().pinch().wheel().decelerate()` en chaîne fluide, plus `clamp()` et `centerOn()`.

**Conséquences.** Gain immédiat : pan/zoom mobile et desktop fonctionnent sans code custom. Coût bundle : +28 KB gzip (lazy avec les scènes). Tradeoff accepté.

---

## ADR-06 — Assets Pixi v8 par bundles

**Contexte.** Charger les sprites un par un avec `Assets.load(url)` est verbeux et ne permet pas de progress global. Charger tout au boot allonge le TTI.

**Décision.** Déclarer 3 bundles dans `src/pixi/assets/manifest.ts` :
- `boot` (banner UI)
- `village` (8 bâtiments)
- `world-map` (9 sprites villages + barbares)

Le bundle pertinent est chargé via `loadBundle(name)` au mount du canvas correspondant. Les sprites apparaissent dès que la texture est en cache (`Assets.get<Texture>(alias)`). Fallback `Graphics + emoji` tant que la texture n'est pas prête.

**Conséquences.**
- Pas de loading state bloquant — le HUD s'affiche immédiatement, les sprites paraissent ~500ms après.
- Asset `manifest.ts` typé en `AssetsBundle[]` Pixi v8 → autocomplete des aliases.
- Convention documentée dans le skill `bftc-pixi-scene`.

---

## ADR-07 — HUD React et canvas Pixi mutuellement exclusifs

**Contexte.** Tentation initiale : afficher des composants React au-dessus du canvas (tooltips, panels) en lisant directement la position d'une entité Pixi. Mais ça crée un couplage React ↔ Pixi qui s'effondre dès qu'on pan/zoom (les coordonnées React deviennent obsolètes à chaque frame).

**Décision.**
- React touche **uniquement** au DOM (HUD, modals, bottom sheets, bottom nav).
- Pixi touche **uniquement** au canvas.
- Quand un composant React doit suivre une entité Pixi (tooltip), la scène expose `worldToScreen(tx, ty)` et React lit ça dans une `raf` loop.
- Communication bidirectionnelle via les stores Zustand (cliquer un sprite Pixi → setter `selectedEntity` dans le store → React panel le lit).

**Conséquences.** Boundary nette, pas de fuite. Coût : un peu de code de pont (callback `onSelectBuilding` côté `VillageView`).

---

## ADR-08 — Hiérarchie `AGENTS.md` + `.agents/{rules,skills}`

> Superseded 2026-05-11 : les règles longues path-scoped ont été remplacées par des skills à la demande. Les rules restantes ne portent que les invariants toujours chargés.

**Contexte.** Un seul `AGENTS.md` ou `CLAUDE.md` racine devient illisible dès que le repo grossit (multi-workspace, multi-stack). Les agents AI chargent toute la doc au boot et le contexte explose.

**Décision.**
- `/AGENTS.md` racine : court, pointe vers les workspaces, rules courtes et skills.
- `<workspace>/AGENTS.md` : briefing spécifique au workspace.
- `.agents/rules/<scope>.md` : invariants courts toujours chargés.
- `.agents/skills/<skill>/SKILL.md` : procédures détaillées chargées à la demande.
- Doc humaine de référence dans `docs/architecture/`, `docs/gameplay/` (séparée des briefings agents).

**Conséquences.** Charge cognitive et budget contexte limités. Les agents chargent les briefings/rules courts au boot et les skills seulement quand leur description matche. Détail dans `.agents/rules/docs.md`.

---

## ADR-09 — Sub-repos `battleforthecrown-backend/` et `battleforthecrown/`

**Contexte.** Le backend a son propre cycle de release et de déploiement, il existe en tant que repo standalone. Le legacy frontend a sa propre histoire git (et une branche d'archive `legacy/nextjs-frontend`) qu'on veut préserver.

**Décision.** Les deux dossiers ont leur propre `.git` à l'intérieur. Le `.gitignore` racine les exclut. Toute modification dans ces dossiers est commitée dans **leur** historique git, pas dans le racine.

**Conséquences.**
- `git status` racine n'affiche jamais leurs changements internes.
- Pour intervenir dans le backend ou le legacy, on `cd` dedans avant `git ...`.
- Branches d'archive (ex `legacy/nextjs-frontend`) créées dans le `.git` du sous-repo, pas dans le racine.

---

## ADR-10 — Zustand stores pour l'état client (vs Redux)

**Contexte.** L'état client se résume à : (1) UI state (modal ouverte, panel sélectionné), (2) snapshots dérivées des events WS (resources, queue, expeditions, crowns, power), (3) cache REST géré par TanStack Query. Redux + RTK Query gère ça mais demande slices, reducers, selectors, middlewares — beaucoup de cérémonie pour peu de logique.

**Décision.** Un store Zustand par domaine (`useResourcesStore`, `useExpeditionsStore`, `useCrownsStore`, `useUiStore`, etc.). API : `set`, `get`, `subscribe`. Pas de middleware. Pas de sélecteurs structurés — on pick directement depuis le hook.

**Conséquences.**
- ~80% moins de boilerplate qu'un slice Redux équivalent.
- Subscribe Zustand utilisable depuis React (`useStore`) **et** depuis Pixi (`store.subscribe`) — utile pour ADR-04.
- Pas de devtools time-travel — accepté car l'état est très majoritairement dérivé du serveur (WS rejoue tout au reconnect).

---

## ADR-11 — Brouillard de guerre server-authoritative

**Contexte.** La tour de guet définit un rayon de visibilité gameplay (5 cases au lvl 1, +5 par niveau). Avant cette décision, l'API `GET /world/:slug/entities` renvoyait toutes les entités du monde et le frontend Pixi se contentait de dessiner un anneau doré au rayon de la tour — purement cosmétique. Un client modifié pouvait lire toutes les positions, owners et niveaux. Le rayon n'était pas une règle de jeu, juste un effet visuel.

**Décision.** Le filtrage devient **server-side**. Trois états :
- **Visible** (dans le rayon d'au moins une tour de guet du joueur) : payload complet (id, kind, owner, level, name, data).
- **Blip** (hors rayon) : payload réduit `{kind: 'fogged', id, x, y}`. Le joueur sait qu'une entité est là mais pas ce que c'est.
- **Hors monde** : non concerné.

Détail du payload blip — **chaque champ est volontaire**, ne pas "corriger" en l'enlevant :
- `x, y` : cœur de l'intent design (« il y a quelque chose ici ») — sans la position, pas de tension narrative ni de cible à explorer.
- `id` : **stable key technique** pour la reconciliation Pixi (le sprite blip persiste entre deux fetchs et le frontend doit le tracker). C'est un cuid opaque ; il ne révèle rien sur l'entité (type, owner, niveau, nom).
- `kind: 'fogged'` : discriminant TS de l'union `FogResult<T>` côté shared.
- Tout le reste (`tier`, `name`, `villageId`, `userId`, etc.) est strippé — c'est ça la vraie fog.

Implémentation :
- Un `VisionService` (NestJS) calcule les disques de vision finis du joueur (un par tour de guet). La Tour de guet suit `WATCHTOWER_VISION_LEVELS` : lvl 1 = 5 cases, +5 par niveau, lvl 10 = 50 cases.
- `applyFogOfWar(entities, disks)` mappe chaque entité vers le payload visible ou un blip.
- Appliqué dans `GET /world/:slug/entities` (le seul endpoint consommé par la WorldMap), qui renvoie `{ entities, visionDisks, fogOfWarEnabled }`.
- `visionDisks` est la source autoritative des overlays Pixi : la carte principale, la mini-carte et le filtre client utilisent ces disques au lieu de recalculer un rayon depuis le village sélectionné.
- Le controller récupère l'utilisateur via `@CurrentUser()` (auth globale, voir [`auth.md`](./auth.md)) — aucune fuite possible côté client (pas de query param userId).
- Les expéditions sont **filtrées en amont** (omises si hors vision) : pas de blip pour elles, simplification volontaire.
- Feature flag par monde : `world.config.fogOfWar.enabled` (suit le pattern `barbarianSeeding.enabled`). Default `true` dans `mergeWithDefaults` + seed.
- Côté Pixi : un `BlipSprite` non-interactif (cercle gris ~10 px, sans listener) rend les payloads `kind: 'fogged'`.
- **Blip non-attaquable côté serveur** : `CombatService.initiateAttack` rejette en `403 ForbiddenException` toute attaque dont la cible (`x, y`) est hors des disques de vision du joueur (gated par `fogOfWar.enabled`). La règle UI "BlipSprite non-cliquable" était insuffisante seule — un client modifié pouvait POSTer `/combat/attack` avec l'`id` du blip. Couvert par smoke `combat: cannot attack a target outside vision`.

**Conséquences.**
- Vraie règle de jeu : un client modifié ne peut **plus** révéler la carte.
- Les events WS (`village.attacked`, `village.conquered`, etc.) sont déjà routés par `userId` et invalident `['world-entities']` côté front — la cache se rafraîchit avec les nouveaux payloads filtrés. Pas de WS dédié au brouillard.
- Pas de mémoire RTS-like : une entité qui sort du rayon redevient blip immédiatement. Modèle ternaire pur, on accepte le tradeoff de simplicité contre richesse.
- Coût en perf : pour chaque requête `entities`, distance euclidienne O(N×M) où N=entités du monde et M=tours du joueur (généralement <10). Linéaire. À reconsidérer >100k entités (chunk_x/chunk_y).
- Hors scope : pas de blip pour les expéditions (visibles dans la vision, invisibles hors). Pas de bâtiment "radar" séparé. Extensions futures possibles.

---

## ADR-12 — Use cases gameplay et `OutboxPublisher` (suppression des `forwardRef`)

**Contexte.** Les modules backend `Village`, `Resources`, `Army` et `Population` étaient liés par des `forwardRef()` au niveau NestJS. En lecture du code, ce n'était pas une vraie circularité métier : `VillageService.upgradeBuilding` appelait simplement `ResourcesService.createResourcesChangedEvent` pour publier un event Outbox, et `PopulationService` n'utilisait que `VillageStrategyService` (placé dans `VillageModule`). Mais en empilant les `imports` cycliques au niveau modules, on avait : init NestJS fragile, tests unitaires impossibles à écrire sans mocker chaînes profondes, et la logique métier transverse (upgrade = stock + population + building + outbox) résidait dans le service du domaine principal — embryon naturel de god service. Audit : `docs/architecture/audit/05-backend-circular-deps.md`.

**Décision.**
1. Extraire `VillageStrategyService` dans un module dédié `modules/strategy/`. Population, Resources, Army et les use cases l'importent désormais sans dépendre de `VillageModule`.
2. Créer un `OutboxPublisher` (dans `EventModule`) qui devient l'unique domicile pour la création d'events Outbox côté gameplay (`resourcesChanged`, `buildingCompleted`, `unitTrainingCompleted`). Plus aucun service ni worker ne fait `tx.eventOutbox.create({...})` inline (sauf l'helper bas niveau `event.utils.ts`). Combat et Crowns gardent `createOutboxEvent` direct — leur extension à `OutboxPublisher` est possible mais n'apporte rien tant qu'aucune circularité ne les concerne.
3. Introduire un module `modules/gameplay/` qui contient des **Application Services** (use cases), un par mutation transverse :
   - `UpgradeBuildingUseCase`, `CancelConstructionUseCase`, `RecruitTroopsUseCase`, `CancelRecruitmentUseCase`.
   - Chacun expose une seule méthode `execute(...)` qui ouvre une transaction Prisma et orchestre les writes multi-domaines + l'event Outbox.
   - Les controllers `Village` et `Army` appellent ces use cases ; `VillageService` et `ArmyService` ne contiennent plus que des lectures.

**Conséquences.**
- Plus aucun `forwardRef` dans `src/modules/` — vérifié par `grep -r forwardRef src/`.
- Tests unitaires triviaux pour les use cases : on mocke Prisma + `OutboxPublisher` + `WorldConfigService`, sans cascade de mocks. Voir `gameplay/upgrade-building.use-case.spec.ts`.
- Effet de bord positif : `CancelConstructionUseCase` et `CancelRecruitmentUseCase` publient maintenant un `resources.changed` (le code historique l'oubliait — le frontend ne se synchronisait que via TanStack invalidation post-mutation).
- Le pattern Outbox reste intact : la transaction Prisma est passée à `OutboxPublisher` via le paramètre `tx?`, atomicité préservée.
- Tickets connexes 03 (dual-path `resources.changed`) et 06 (god services) en partie purgés : `ResourcesService` ne sait plus rien des mutations, `VillageService` est devenu pur read-model, et les workers (`ConstructionWorker`, `TrainingWorker`) consomment `OutboxPublisher` plutôt que de manipuler `tx.eventOutbox` à la main.
- Convention pour le futur : **toute nouvelle mutation transverse doit vivre dans `gameplay/` en tant que use case**. Les services de domaine restent des read-models + helpers de calcul.

**Vérifié en QA backend (2026-05-06).** Upgrade WOOD, cancel-construction QUARTER, recruit + cancel-recruitment MILITIA, validés via curl + DB read-only : stock débité/refundé, population corrigée, events `resources.changed` créés dans la même transaction que la mutation, dispatch via Socket.IO confirmé (`event_outbox.dispatched_at` non NULL).

---

## ADR-13 — `AuthenticatedShell` au niveau Router (vs wrap par écran)

**Contexte.** L'ancien `GameSession.tsx` (`features/game/`) cumulait connexion WebSocket, bindings d'events, seeding des stores Zustand depuis les queries REST et sync expéditions. Chaque écran protégé (VillageView, WorldMapScreen, ArmyScreen, MessagesScreen, WorldLockedScreen) devait s'auto-wrapper avec `<GameSession>`. Conséquence non documentée : à chaque navigation entre écrans protégés, le wrapper se démontait → `gameSocket.disconnect()` puis reconnect dans le nouvel écran. La WebSocket cyclait à chaque navigation, le `join:world` était redéclenché, et tout event arrivant pendant la transition était perdu (masqué par le polling REST). `ArmyScreen` cumulait jusqu'à 3 wrappers via ses early-returns. Audit : `docs/architecture/audit/13-pixi-game-session-fragile-wrapper.md`.

**Décision.**
1. Renommer + déplacer `GameSession` en `AuthenticatedShell` (`src/features/layout/`) — convention `features/layout/` pour le stateful transverse, héritée d'ADR-12 et du ticket 12.
2. Le shell rend `<Outlet />` au lieu de `{children}`, et est branché **une seule fois** dans `App.tsx` :
   ```tsx
   <Route element={<ProtectedRoute />}>
     <Route element={<AuthenticatedShell />}>
       <Route path="/worlds" .../>
       <Route path="/my-worlds" .../>
       <Route path="/game" .../>
       <Route path="/game/world" .../>
       <Route path="/game/army" .../>
       <Route path="/game/messages" .../>
     </Route>
   </Route>
   ```
3. Tous les écrans protégés sont nettoyés du wrap explicite.

**Conséquences.**
- La WebSocket est connectée une fois pour toute la session authentifiée et survit aux navigations. `gameSocket.disconnect()` n'est appelé qu'au logout (quand `accessToken` redevient falsy) ou au démontage de l'app.
- `bindServerEvents` est appelé une seule fois par session — plus de listeners dupliqués.
- Les seeds de stores (`useResourcesQuery`, `useCrownsQuery`, `useMyVillagesQuery`, expeditions sync) ne re-déclenchent plus à chaque navigation.
- Pattern explicite : impossible d'oublier le shell — il est ancré dans le router. Tout nouvel écran ajouté sous `<ProtectedRoute>` hérite automatiquement de la session live.
- Pas de découpage prématuré en `WebSocketProvider` + `Seeder` + `Sync` : tant que le shell tient en ~115 lignes, la cohésion locale gagne sur la séparation. À reconsidérer s'il dépasse ~250 lignes ou si une feature exige un cycle de vie distinct.

**Vérifié (2026-05-08).** Type-check + 57 tests Vitest passent. Commit du refacto : voir `git log` (`refactor(pixi/layout): promote AuthenticatedShell to router level`).

---

## ADR-12 — Pivot compressed-async + tempo world-scoped via `WorldConfig.tempo`

**Contexte (2026-05-15).** Audit de la vision de progression côté gameplay : le calage initial visait un slow-MMORTS façon Tribal Wars (timers de plusieurs heures, cycle de Seigneur en jours, monde de 120 j). Trois constats convergents montrent que ce calage n'est plus viable en 2026 :

1. **Pas de pay-to-win** (contrat de design, cf. [`gameplay/01-overview.md`](../gameplay/01-overview.md)). Or, le segment slow-MMORTS mobile vit des accélérateurs payants — sans P2W, les timers longs deviennent du mur de frustration sans porte de sortie.
2. **Attention mobile 2026** ≠ desktop 2010 : 6-12 sessions de 2-5 min/jour, pas 2-3 sessions de 30 min. Un upgrade de 6 h n'est plus « stratégique », il est « rien à faire ».
3. **« Tout perdre après 3 semaines de grind »** est un repoussoir documenté. Compression du tempo = reconstruction en heures, pas en jours.

Deux alternatives ont été écartées : full real-time façon Million Lords (autre jeu, autre tech, coût de réécriture massif) et P2W modéré (brise le contrat).

**Décision.**

1. **Pivot compressed-async.** L'archi technique reste 100 % async serveur-autoritaire (Outbox, fenêtres de capture, scout, styles, expéditions) — aucun changement de pattern. Les **timescales** sont compressées d'un facteur ~4-5× vs Tribal Wars classique pour aligner le rythme sur les attentes mobile 2026.
2. **Monde MVP : Standard 60 j**, défini comme la référence de tempo (`tempo.global = 1.0`).
3. **Mécanisme `WorldConfig.tempo`** — hybride : un multiplier `global` par monde + `overrides` granulaires optionnels par axe (construction, training, capture, régen, production, couronnes, etc.). **Sémantique unifiée « tempo »** : un seul axe « petit = jeu plus rapide » exposé à la config, le code applique l'opérateur correct par axe (`× tempo` sur les durées, `÷ tempo` sur les débits / régens / yields). Une `tempo = 0.25` signifie « jeu 4× plus rapide partout », sans avoir à mémoriser la convention par axe — c'est la responsabilité du `TempoService` côté backend.
4. **Variantes post-MVP** (Speed 30-45 j, Classic 90 j, Hardcore) deviennent triviales à ajouter : elles jouent uniquement sur `tempo` + `worldDuration`, sans nouvelle mécanique.
5. **Garde-fou strict** : les multipliers touchent **le tempo** (vitesses, durées, régens), jamais **l'équilibrage** (ratios attaque/défense, coûts pop, règle puissance ÷ 3, blueprint barbare, formules de puissance). Ces invariants restent absolus.
6. Les chiffres absolus dans les autres specs gameplay restent valides — ils sont implicitement « à `tempo.global = 1.0` ». Une passe de recalibration dédiée alignera ces valeurs sur le rythme cible compressed (différée, pas dans cette session de design).

**Conséquences.**

- **Aucun rework d'archi.** Le pattern Outbox, le combat, le scout, les styles, l'inbox sont totalement préservés. La migration se réduit à exposer `tempo` dans `WorldConfig`, créer une couche d'accès shared `TempoService`, et brancher les use-cases concernés sur cette couche au lieu des constantes directes.
- **Durée du monde 120 → 60 j** comme conséquence directe : avec un tempo compressé, l'endgame multi-village s'ouvre vers J+5-J+7, donc un monde de 60 j garantit ~50 j de pur endgame — sweet spot validé contre le risque de fatigue endgame de 90 ou 120 j.
- **Faisabilité commerciale améliorée** : on sort de la compétition frontale avec les slow-MMORTS P2W (Tribal Wars / Kingsage), et on ne tente pas la compétition frontale avec les real-time purs (Million Lords). Niche claire : compressed-async sans P2W, reset cyclique court.
- **Coût de design** : recalibrer ~15 sections de chiffres à travers les docs `02`/`03`/`06`/`10`/`13`/`14`/`15`/`19`. Mécanique mais conséquent. Liste exhaustive dans [`gameplay/23-world-tempo-and-multipliers.md` § 7](../gameplay/23-world-tempo-and-multipliers.md#7-impacts-à-recalibrer-dans-les-autres-docs).
- **Nommage** : `WorldConfig.gameSpeed` et `WorldConfig.economy.productionRate` sont **supprimés clean cut** au profit de `WorldConfig.tempo`. Pas d'alias rétro-compat — l'ancienne convention (« > 1 = plus rapide » + diviseurs sur durées) et la nouvelle (« < 1 = plus rapide » + opérateur géré par axe) sont inverses, traîner les deux serait une source de bugs sans bénéfice (aucun monde n'est en prod). Le seul `gameSpeed.*` survivant des docs (`docs/gameplay/10-conquest.md` § cadre commun) est mis à jour en même temps.

**Spec détaillée.** [`docs/gameplay/23-world-tempo-and-multipliers.md`](../gameplay/23-world-tempo-and-multipliers.md) — pourquoi/quoi/comment + catalogue complet des multipliers + garde-fous + checklist d'impacts. Cycle de vie du monde (durée, fenêtres d'inscription) consolidé dans [`docs/gameplay/19-world-lifecycle.md`](../gameplay/19-world-lifecycle.md).

---

## ADR-14 — Niveau max = 10 pour tous les bâtiments (vs courbe « façon Century »)

**Contexte (2026-05-19).** Audit comparatif de la courbe BFTC vs les références mobiles MMORTS du moment (Whiteout Survival, Kingshot — Century Games). Les références utilisent jusqu'à **30+ niveaux par bâtiment** (HQ jusqu'à L30 puis TG/FC 1-10 = L40 équivalent) avec une courbe exponentielle dont les paliers de friction sont placés à L15-L16 (heures → jours), L21-L22 (jours+), L29-L30 (~40 j de construction brute en F2P).

Question posée : faut-il aligner BFTC sur cette granularité (passer à 30 levels) pour bénéficier de la même richesse de progression et des mêmes paliers narratifs ?

**Décision.** **Garder le niveau max à 10 pour tous les bâtiments** (déjà l'état actuel — décision documentée ici pour ancrer le **pourquoi**, qui ne se déduit ni du code ni du `git log`). Trois raisons convergentes :

1. **Different game, different vertical.** Century mise sur le **grind vertical** (un seul HQ qui monte 30 levels lentement) parce qu'il monétise les **speedups payants** — leur courbe brute est volontairement infaisable F2P (40 j pour HQ30), désamorcée uniquement par achat. BFTC mise sur la **conquête horizontale** (multi-village × multi-bâtiment × PvP) avec une boutique cosmétique uniquement (cf. [`gameplay/01-overview.md` § Philosophie mobile](../gameplay/01-overview.md#philosophie-mobile) et [ADR-12 « Pivot compressed-async »](#adr-12--pivot-compressed-async--tempo-world-scoped-via-worldconfigtempo)). Le scope de progression BFTC = 10 villages × 12 bâtiments × 10 levels × N conquêtes — déjà gigantesque sans étendre verticalement.
2. **Sans speedups payants, pas de wall infaisable possible.** Si on transposait 30 levels en compressed-async sans paywall, soit on compresse tellement que chaque level perd son poids narratif, soit on accepte qu'au-delà de L15-L20 personne n'aille — 10-20 levels mort-nés. Aucun des deux n'est satisfaisant.
3. **Coût × bénéfice asymétrique.** Conserver 10 levels avec des **paliers de friction bien placés** (rythme Century transposé : early sec→min, mid min→heure, late heures→jour) capte ~80 % du bénéfice narratif (sensation d'« âges » du jeu) pour ~30 % du coût (120 entrées à balancer vs 360+).

**Conséquences.**

- Toute proposition de calibration de courbe se fait **sur 10 paliers**, en empruntant la **logique de placement** des walls Century (paliers marqués vers L7 et L10) mais pas la granularité.
- Les `unlockCastleLevel` restent les seules contraintes de prérequis (pas de cap « non-Château ≤ Château ») — voir [`gameplay/03-buildings.md`](../gameplay/03-buildings.md).
- Le ranking et la puissance s'expriment sur ce barème 10 levels, étendu par le nombre de villages et de conquêtes. Si un futur playtest révèle un plafond ressenti dès J+30, **on ajoute des bâtiments ou des mécaniques transverses** (alliances, classements hebdo, zones d'influence), **pas des levels**.
- L'invariant « 10 levels max » est ancré dans `packages/shared/src/village/buildings.ts` (table `BUILDING_DEFINITIONS`) et dans [`gameplay/03-buildings.md`](../gameplay/03-buildings.md) (« Niveau max = **10** pour tous »). Ces deux sources et cet ADR doivent rester en cohérence.
- Un simulateur (`scripts/build-simulator.js`) permet de tester l'impact d'une nouvelle courbe sur la wall-clock d'un joueur (tempo + profil sommeil + queue 3 slots + bonus Château + ressources/entrepôt).

---

## ADR-15 — Recalibration courbe construction : max-village ~7-8 j via bonus Château renforcé

> Mise à jour ADR-17 (2026-05-31) : la cible ~7-8 j décrit désormais la capacité de construction hors contrainte économique. Après recalibration de la production passive, le simulateur complet ressources passives seules donne ~35-36 j, avec pillage attendu pour accélérer.

**Contexte (2026-05-31).** Playtest du panneau d'amélioration : le dernier palier du Château (niv 9→10) affichait **81 h 36** (`timeSeconds` 432000 × bonus niv9 0.68 × tempo 1.0). Ressenti « pas possible » pour un seul up, même si le wall-clock *global* (≈14-15 j max-village) respectait la cible ADR-14. Deux constats à l'analyse :

1. Le `120 h` brut du Château niv10 était une valeur **héritée du calage slow-MMORTS pré-pivot**, jamais repassée — exactement la dette de recalibration parquée par [ADR-12 « compressed-async »](#adr-12--pivot-compressed-async--tempo-world-scoped-via-worldconfigtempo).
2. Le bonus Château historique était trop faible (×1.00 → ×1.56) pour « justifier » l'investissement vertical dans le Château.

**Décision.**

1. **Renforcer `CASTLE_CONSTRUCTION_SPEED_BONUS`** sur une courbe géométrique `1.0 → 0.25` : le multiplicateur ressenti passe de **×1.0 (niv1) à ×4.0 (niv10)** (avant : ×1.56 max). Le Château devient le **levier central de vitesse de construction** du village — comme le bonus s'applique à *toutes* les constructions (`building-cost.ts`), le monter accélère tout le reste.
2. **Réduire `BUILDING_DEFINITIONS.CASTLE.levels[10].timeSeconds`** de `432000 → 223000` pour ramener le dernier palier à **~18 h** une fois le bonus niv9 (0.29) appliqué, sans dépendre d'un bonus extrême qui écraserait le global.
3. **Cible recalibrée construction pure : max-village ~7-8 j wall-clock** (profil sommeil 23h-7h, file 3 slots), contre ~14 j auparavant. Cette cible ignore volontairement la friction économique ajoutée ensuite par ADR-16/17.

**Conséquences.**

- Ne modifie **que** la vitesse de construction. Aucun invariant d'équilibrage touché (ratios atk/déf, coûts pop, puissance) — cf. garde-fous [doc 23 § 6](../gameplay/23-world-tempo-and-multipliers.md). Le bonus Château et les `timeSeconds` sont des constantes Niveau 1 explicitement calibrables ([`balance-and-tempo.md`](./balance-and-tempo.md)).
- `build-simulator.js` fiabilisé en parallèle : bug `FARM`→`QUARTER` corrigé (le Quartier était absent du plan, wall-clock sous-estimé), + override `BFTC_CASTLE_BONUS` pour tester une courbe sans rebuild shared.
- Test mis à jour : `world-config.service.spec.ts` (bonus niv2 0.96→0.86).
- La cible « ~14 j » de [ADR-14](#adr-14--niveau-max--10-pour-tous-les-bâtiments-vs-courbe--façon-century) devient « ~7-8 j » pour la capacité de construction pure. Le temps vécu en ressources passives seules est recalé par ADR-17.
- Valeurs absolues (courbe complète, `timeSeconds`) : source de vérité unique dans `packages/shared/src/village/buildings.ts` — non dupliquées ici.

---

## ADR-16 — Coûts bâtiments ancrés sur la capacité d'Entrepôt

**Contexte (2026-05-31).** Après la recalibration des durées, le playtest a révélé une incohérence inverse côté ressources : les coûts d'amélioration étaient restés sur l'ancienne échelle early-game. Exemple typique : les derniers niveaux coûtaient quelques centaines de ressources alors que l'Entrepôt monte jusqu'à 87k par ressource. Résultat : la difficulté venait surtout du timer, pas d'un vrai arbitrage économique.

**Décision.**

1. **Rebaser les coûts ressources de tous les bâtiments actifs** sur une fraction de la capacité d'Entrepôt du palier concerné : plus le plafond de stockage augmente, plus le coût maximal d'un upgrade doit occuper une part visible de ce plafond.
2. **Conserver le rôle économique de chaque bâtiment** via des profils de ratios : Château plus pierre, mines orientées vers leur ressource, Caserne plus fer, Tour de guet plus pierre, Entrepôt/Quartier plus équilibrés.
3. **Garder les coûts stockables** : aucun coût ressource d'un bâtiment actif ne doit dépasser la capacité d'Entrepôt de référence pour son palier. Les bâtiments à un seul niveau utilisent leur palier de déblocage comme référence.

**Conséquences.**

- Le frein de progression devient mixte : temps + accumulation de ressources + gestion de stockage.
- L'Entrepôt reprend son rôle de bâtiment structurant au lieu d'être un plafond très au-dessus des coûts réels.
- Un test d'invariant dans `buildings.spec.ts` empêche de réintroduire une courbe trop basse ou impossible à stocker.
- Les bâtiments désactivés MVP (`HIDEOUT`, `WALL`) ne sont pas recalibrés dans cette décision.

---

## ADR-17 — Production passive contenue et pillage accélérateur

**Contexte (2026-05-31).** Après ADR-16, les coûts d'upgrade sont enfin proportionnels à l'Entrepôt, mais la production passive des mines n'avait pas été recalibrée. À 8 200/h au niveau 10, une mine produisait 196 800 ressources/jour : cela permettait de financer quotidiennement plusieurs upgrades L10, ce qui annulait l'intérêt du pillage.

**Décision.**

1. **Réduire `RESOURCE_PRODUCTION_PER_HOUR`** sur une courbe `60 → 1 350/h`.
2. **Caler le niveau 10 sur le Château L10** : coût pierre `46 980 / 1 350 ≈ 34,8 h` de production passive. Le dernier palier reste atteignable sans pillage, mais le pillage devient le levier naturel pour accélérer.
3. **Conserver une production identique bois/pierre/fer** : aucune ressource ne devient rare structurellement ; les différences viennent des coûts thématiques des bâtiments et des cibles pillées.

**Conséquences.**

- En passif pur, `build-simulator.js` donne ~35-36 j pour maxer un village et ~8 j pour l'éligibilité conquête. C'est volontairement plus lent que la capacité de construction pure.
- Un joueur actif doit réduire ce délai par pillage. Le design cible reste qu'un joueur qui pille efficacement progresse environ 2× plus vite qu'un joueur passif.
- Le test `building resource costs` couvre maintenant aussi l'invariant Château L10 ≈35 h de production passive sur la ressource limitante.

---

## Maintenance de ce document

- Une décision **structurante** (qui change la façon dont on pense le projet) → nouvelle entrée ADR.
- Un changement d'implémentation qui ne remet pas en cause un ADR existant → commit + message clair, pas d'ADR.
- Un ADR **superseded** : ne pas le supprimer, ajouter une mention `Superseded by ADR-XX (YYYY-MM-DD)` en tête.
