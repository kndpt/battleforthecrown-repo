# Run #042 — feature-world-detail-page

> **Statut** : DONE
> **Démarré** : 2026-05-31
> **Terminé** : 2026-05-31

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle
- **Spec source** :
  - [`docs/gameplay/19-world-lifecycle.md`](../../../docs/gameplay/19-world-lifecycle.md) — paramètres MVP, cycle de transition, wipe et récompenses.
  - [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../../docs/gameplay/23-world-tempo-and-multipliers.md) — catalogue des mondes, multipliers, garde-fous.
  - [`battleforthecrown-design-system/project/world-views.jsx`](../../../battleforthecrown-design-system/project/world-views.jsx) — maquettes `WorldDetailLight` et `WorldArtboardC`.
- **Type** : feature
- **Modules backend** : `world` (`public-worlds.controller.ts`, `world.controller.ts`, `world.service.ts`, DTO public detail si retenu)
- **Modules frontend** : `pixi/features/worlds`, `pixi/features/design-system/worlds`, `pixi/api`, route `/worlds`

## Dépendances

- Run [`032 — Lifecycle backend foundation + identité monde`](./032-world-lifecycle-foundation-and-identity.md) ✅ DONE : `GET /worlds/public`, `identity`, `lifecycle`, `tempoProfile`, `joinedCount`.
- Run [`033 — Écran sélection royaumes Pixi`](./033-feature-worlds-selection-screen.md) ✅ DONE : écran `/worlds`, cards, CTA et preview design-system.
- Run [`034 — Isolation multi-monde des données joueur`](./034-fix-world-scoped-player-data.md) ✅ DONE : hooks/endpoints world-scoped.
- Ticket [`072 — Stats joueur sur les cartes royaumes`](../../archive/072-worlds-player-stats.md) ✅ DONE : stats personnelles par monde rejoint.
- Skill `bftc-design-system-migration` obligatoire en première étape : migrer uniquement le composant générique détail world depuis `world-views.jsx` / preview HTML, sans `StatusBar`, phone shell, barre de notif, ni faux chrome prototype.

## Matrice de données à valider avant implémentation

### Disponible sûr

- Identité publique : `displayName`, `tagline`, `sigil`, `themeColor`, `tier`.
- Statut et lifecycle : `status`, `day`, `totalDays`, `inscriptionPhase`, `startedAt`, `endsAt`, `plannedOpenAt`.
- Compteur public : `joinedCount`.
- Tempo : `tempoProfile` (`standard` / `custom`), avec labels qualitatifs uniquement si dérivés proprement.
- Carte : `gridWidth` × `gridHeight` existe dans le modèle et la spec fixe le MVP à `500 × 500`, mais l'exposition UI doit passer par un contrat public stable.

### Disponible conditionnel

- Stats personnelles : nombre de villages et puissance royaume uniquement pour un monde déjà rejoint, en réutilisant les données/hook du ticket 072.
- CTA : `Entrer dans le royaume`, `Rejoindre le royaume`, `Me prévenir à l'ouverture`, `Inscription close`, selon l'état déjà porté par `WorldCardViewModel`.

### À contracter proprement avant affichage

- DTO public détail dédié (`PublicWorldDetail`) ou enrichissement contrôlé de `PublicWorld`.
- Axes tempo de la maquette (`Construction`, `Entraînement`, `Voyage`, `Fenêtre capture`, `Régen barbare`, `Production`) si on veut afficher des niveaux qualitatifs dérivés de `WorldConfig.tempo`.
- Constantes lifecycle visibles comme bouclier débutant 48 h, durée du monde et fenêtres d'inscription.

### À ne pas inventer depuis la maquette

- Région narrative, coordonnées de capitale illustrative, seigneur fondateur, coalitions max, niveau PvP, mode pillage.
- Densité qualitative (`Calme`, `Naissant`, `Tendu`, `Saturé`).
- Mini-map réelle ou position capitale si aucune source runtime fiable n'est exposée.
- Récompenses fin de saison et classements figés tant que le système n'existe pas.

## Critère de fin (acceptance)

- [x] `bftc-design-system-migration` est appliqué en première étape et produit un composant détail world générique typé, props-first, sans fixture hardcodée dans le composant final. Preuve : grep + preview `/design-system` + QA visuelle.
- [x] Le composant migré ne contient pas `StatusBar`, phone shell, barre de notif, ni faux chrome prototype. Preuve : grep + inspection visuelle.
- [x] Les cards `/worlds` affichent un bouton secondaire `Détails` à gauche du CTA principal, sans modifier les comportements `Entrer dans le royaume` / `Rejoindre le royaume` / `Me prévenir` / `Inscription close`. Preuve : test Pixi.
- [x] Cliquer `Détails` navigue vers une route détail dédiée, par exemple `/worlds/:worldId`, sans déclencher la mutation join. Preuve : test route/component.
- [x] Le backend/shared expose un contrat public stable pour les champs détail réellement affichables, ou la fiche documente explicitement que `PublicWorld` suffit et que `/world/:worldId/config` n'est pas consommé brut par l'UI. Preuve : Zod/test backend ou décision tracée.
- [x] La page détail affiche uniquement les données disponibles sûres : identity, status, lifecycle, tempoProfile, joinedCount, tier/sigil/theme, et dimensions carte seulement si contractées. Preuve : test Pixi.
- [x] Les stats personnelles `villageCount` + puissance ne s'affichent que si le monde est rejoint et si les données sont chargées ; aucune valeur `0` placeholder. Preuve : test Pixi.
- [x] Les fixtures non sourcées de la maquette ne sont pas affichées : région, coord de capitale, seigneur fondateur, coalitions max, PvP level, pillage, densité qualitative, mini-map réelle, récompenses fin de saison, classements figés. Preuve : grep/test de non-rendu.
- [ ] QA navigateur : depuis `/worlds`, ouvrir le détail d'un monde `OPEN`, `PLANNED`, `LOCKED` et d'un monde déjà rejoint ; retour vers la liste OK ; layout mobile sans overlap. Preuve : visuel/gameplay.
- [x] `rtk yarn static-check` et tests ciblés Pixi/backend passent. Preuve : commandes exactes dans le rapport final.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- React/Zustand/TanStack : skill `bftc-react-hud`
- Design-system migration : skill `bftc-design-system-migration`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] `packages/shared/src/world/dtos.ts` + backend `WorldService` : enrichir `PublicWorld` avec un champ public stable `map.gridWidth/gridHeight`, validé par Zod/test, sans exposer la config brute.
- [x] `battleforthecrown-pixi/src/features/worlds/worldsViewModel.ts` + tests : dériver un `WorldDetailViewModel` depuis `PublicWorld` et les stats personnelles déjà chargées, avec non-rendu des données non sourcées.
- [x] `battleforthecrown-pixi/src/features/design-system/worlds/*` + preview : migrer le composant détail monde générique props-first depuis `WorldDetailLight`, sans shell téléphone ni `StatusBar`.
- [x] `WorldSelector` + routes `App.tsx` : ajouter le bouton secondaire `Détails`, naviguer vers `/worlds/:worldId`, préserver tous les CTA existants.
- [x] Tests et QA : couvrir navigation sans mutation join, rendu des champs sûrs, stats personnelles conditionnelles, absence des fixtures non sourcées, puis static-check.

## Progress (rempli pendant le run)

- 2026-05-31 : préflight OK, worktree clean, `HEAD` initial `b64858f` aligné `origin/main`; branche dédiée `run/042-feature-world-detail-page-aa9b` créée car `run/042-feature-world-detail-page` était déjà attachée à un autre worktree.
- 2026-05-31 : règles repo, `SPEC.md`, briefings Pixi/backend, contexte mémoire et specs gameplay 19/23 lus.
- 2026-05-31 : skill `bftc-design-system-migration` chargé ; source maquette lue dans `Choix du Monde.html` + `world-views.jsx` (`WorldDetailLight` / `WorldArtboardC`) + tokens CSS.
- 2026-05-31 : contrat `PublicWorld.map` ajouté, composant `WorldDetailDesign` props-first créé, route `/worlds/:worldId` branchée, bouton secondaire `Détails` ajouté aux cards sans mutation join.
- 2026-05-31 : tests ciblés Pixi verts (`WorldsSelectionDesign`, `worldsViewModel`, `GameEntryTransition`, `GameHeader`), type-check Pixi/backend verts, smoke ciblé `worlds-public.smoke.spec.ts` vert, audit approximation design-system à 0 match.
- 2026-05-31 : review indépendante obligatoire tentée deux fois (`019e7ebf-aa02-7c21-90a9-653556b92378`, puis `019e7ec3-a317-76f1-a2ce-27e7620e1a3e`) ; les deux agents sont restés silencieux jusqu'au timeout prolongé puis ont été fermés. Hard gate non franchissable sans dérogation user explicite.
- 2026-05-31 : user a donné la dérogation explicite pour finaliser malgré le timeout reviewer ; run archivé et PR ready à ouvrir vers `main`.

## Décisions prises

- PR_REQUIRED: oui, mode run sans dérogation user.
- Contrat public : enrichir `PublicWorld` avec `map.gridWidth/gridHeight` plutôt que consommer `/world/:worldId/config` ou l'ancien `/world/:worldId/details`.
- Données affichables : conserver identity/status/lifecycle/tempoProfile/joinedCount/tier/sigil/theme/map dimensions et stats personnelles chargées ; exclure région, capitale illustrative, seigneur fondateur, coalitions max, PvP level, pillage, densité qualitative, mini-map réelle, récompenses fin de saison et classements figés.
- Dérogation review : deux reviewers indépendants ont timeout sans verdict ; le user a explicitement autorisé la finalisation et le push le 2026-05-31.

## Rapport final

Run livré :

- `GET /worlds/public` expose maintenant `map.gridWidth/gridHeight` dans `PublicWorld`, validé par le schéma Zod partagé et le smoke public worlds.
- `/worlds` affiche un bouton secondaire `Détails` sur chaque carte, séparé du CTA principal.
- `/worlds/:worldId` rend un détail monde via `WorldDetailDesign`, props-first, sans shell prototype et sans données inventées.
- Les stats personnelles restent conditionnelles au monde rejoint et aux données chargées.
- Docs : aucun changement durable nécessaire hors fiche run, car le contrat public est porté par les types shared et le smoke ; aucune règle gameplay ou ADR nouvelle.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] `bftc-design-system-migration` appliqué — `rtk grep -n "black/[0-9]\\|white/[0-9]\\|opacity-[0-9][0-9]\\|border-black/[0-9]\\|bg-black/[0-9]" battleforthecrown-pixi/src/features/design-system/worlds` → 0 match après port exact des opacités.
  - [x] Composant sans faux chrome prototype — `rtk rg -n "StatusBar|phone|barre|mini-map|Sire Aldric|Coalitions|Pillage|Densité|Vainqueur de" battleforthecrown-pixi/src/features/design-system/worlds battleforthecrown-pixi/src/features/worlds` → les tests couvrent le non-rendu des fixtures non sourcées ; aucun shell `StatusBar`/phone runtime.
  - [x] Bouton `Détails` et navigation — `rtk yarn workspace battleforthecrown-pixi test WorldsSelectionDesign.test.tsx worldsViewModel.test.ts GameEntryTransition.test.tsx GameHeader.test.tsx` → 4 files / 37 tests passés, `Détails` ne déclenche pas `onJoin`.
  - [x] Contrat public détail — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- worlds-public.smoke.spec.ts` → smoke public worlds passé, `PublicWorld.map.gridWidth/gridHeight` validé via Zod.
  - [x] Données affichées sûres + stats conditionnelles — `rtk yarn workspace battleforthecrown-pixi test WorldsSelectionDesign.test.tsx worldsViewModel.test.ts` → 2 files / 19 tests passés.
  - [x] Static-check obligatoire — `rtk yarn static-check` → passé.
- **Review indépendante** : Déclenchée (raison: back+front/shared, diff > 100 lignes, écran visible, contrat durable). Verdict non obtenu : deux agents reviewers ont timeout sans rendu ; bypass autorisé explicitement par le user le 2026-05-31.
- **Tests automatisés** :
  - `rtk yarn workspace @battleforthecrown/shared build` → passé.
  - `rtk yarn workspace battleforthecrown-pixi test WorldsSelectionDesign.test.tsx worldsViewModel.test.ts GameEntryTransition.test.tsx GameHeader.test.tsx` → passé.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → passé.
  - `rtk yarn workspace battleforthecrown-backend type-check` → passé.
  - `rtk yarn workspace battleforthecrown-pixi build` → passé.
  - `rtk yarn static-check` → passé.
- **Smokes lancés** : Ciblés — `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` puis `rtk yarn workspace battleforthecrown-backend test:smoke:run -- worlds-public.smoke.spec.ts` → passés.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/worlds-public.smoke.spec.ts` enrichi pour vérifier `PublicWorld.map`.
- **QA fonctionnelle agent** : `rtk proxy curl -I http://127.0.0.1:5176/design-system` → HTTP 200. QA navigateur in-app non exécutée : l'in-app browser a bloqué l'URL locale par policy, sans contournement.
- **Tests IG à faire par le user** : vérifier visuellement depuis `/worlds` l'ouverture des détails pour un monde `OPEN`, `PLANNED`, `LOCKED` et un monde déjà rejoint ; vérifier le retour liste, le layout mobile sans overlap et l'absence de données inventées.

## Liens détectés

- **À faire avant** : aucun.
- **À faire après** : aucun identifié.
- **Doublon potentiel** : aucun.
- **Connexe** :
  - [`032 — Lifecycle backend foundation + identité monde`](./032-world-lifecycle-foundation-and-identity.md) — contrat public world lifecycle/identity.
  - [`033 — Écran sélection royaumes Pixi`](./033-feature-worlds-selection-screen.md) — écran `/worlds`, cards et design-system world selection.
  - [`034 — Isolation multi-monde des données joueur`](./034-fix-world-scoped-player-data.md) — endpoints/hooks world-scoped.
  - [`072 — Stats joueur sur les cartes royaumes`](../../archive/072-worlds-player-stats.md) — stats personnelles optionnelles par monde rejoint.
- **Déjà résolu** : aucun.
- **Keywords scannés** : `world`, `worlds`, `royaume`, `details`, `sélection`, `design-system`, `lifecycle`, `tempo`.

## Points d'attention

- `GET /worlds/public` est la source la plus saine pour un détail léger ; `GET /world/:worldId/details` est legacy et moins aligné avec le nouveau contrat public.
- Ne pas brancher la page directement sur `GET /world/:worldId/config` sans cadrage : la config brute runtime n'est pas un contrat UI.
- La maquette est une source visuelle, pas une source de vérité de données. Toute donnée non sourcée doit être retirée ou remplacée par un équivalent contracté.
- Si le détail devient trop riche, segmenter en deux runs : contrat public détail puis UI détail.
