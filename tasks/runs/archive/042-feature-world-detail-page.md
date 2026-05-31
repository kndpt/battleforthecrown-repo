# Run #042 — feature-world-detail-page

> **Statut** : DONE
> **Démarré** : 2026-05-31
> **Terminé** : 2026-05-31

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle
- **Spec source** :
  - [`docs/gameplay/19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md) — paramètres MVP, cycle de transition, wipe et récompenses.
  - [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) — catalogue des mondes, multipliers, garde-fous.
  - [`battleforthecrown-design-system/project/world-views.jsx`](../../battleforthecrown-design-system/project/world-views.jsx) — maquettes `WorldDetailLight` et `WorldArtboardC`.
- **Type** : feature
- **Modules backend** : `world` (`public-worlds.controller.ts`, `world.controller.ts`, `world.service.ts`, DTO public detail si retenu)
- **Modules frontend** : `pixi/features/worlds`, `pixi/features/design-system/worlds`, `pixi/api`, route `/worlds`

## Dépendances

- Run [`032 — Lifecycle backend foundation + identité monde`](./archive/032-world-lifecycle-foundation-and-identity.md) ✅ DONE : `GET /worlds/public`, `identity`, `lifecycle`, `tempoProfile`, `joinedCount`.
- Run [`033 — Écran sélection royaumes Pixi`](./archive/033-feature-worlds-selection-screen.md) ✅ DONE : écran `/worlds`, cards, CTA et preview design-system.
- Run [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md) ✅ DONE : hooks/endpoints world-scoped.
- Ticket [`072 — Stats joueur sur les cartes royaumes`](../archive/072-worlds-player-stats.md) ✅ DONE : stats personnelles par monde rejoint.
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
- [x] QA navigateur : depuis `/worlds`, ouvrir le détail d'un monde `OPEN`, `PLANNED`, `LOCKED` et d'un monde déjà rejoint ; retour vers la liste OK ; layout mobile sans overlap. Preuve : visuel/gameplay.
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

- Frontend design-system : créer `WorldDetailDesign` props-first + config labels, brancher preview `/design-system`, ajouter tests de rendu/non-rendu.
- Frontend runtime : ajouter route `/worlds/:worldId`, bouton secondaire `Détails`, hook partagé `useWorldCardModels`, retour liste et CTA existants.
- Backend/shared : enrichir `PublicWorld` avec `map` et durées lifecycle d'inscription réellement configurées.
- Tests/docs : couvrir navigation, contrat public, non-fixtures, stats conditionnelles, smoke public worlds et documentation lifecycle.

## Progress (rempli pendant le run)

- Préflight terminé : branche `run/042-feature-world-detail-page`, docs/specs/skills chargés, PR obligatoire confirmée.
- Migration design-system appliquée : composant détail générique sans shell prototype, preview ajoutée.
- Contrat retenu : enrichissement contrôlé de `PublicWorld`, pas de DTO détail dédié et pas de consommation brute de `/world/:worldId/config`.
- Runtime branché : `Détails` sur les cards `/worlds`, route `/worlds/:worldId`, hook partagé pour stats et CTA.
- Review indépendante initiale : `BLOCK` sur lifecycle hardcodé et preuves QA/tests à finaliser.
- Correction review : `PublicWorld.lifecycle` expose `inscriptionMainDays` / `inscriptionLateDays`, backend smoke adapté, UI consomme ces champs.
- Vérifications automatiques passées : build shared, tests Pixi ciblés, type-check Pixi, smoke backend ciblé, suite Pixi complète, build Pixi, `rtk yarn static-check`.
- QA navigateur arrêtée sur demande user : validation faite par le user dans l'in-app browser, OK.

## Décisions prises

- `GET /worlds/public` reste la source de vérité pour la page détail légère. Le run n'introduit pas de `PublicWorldDetail` séparé parce que les champs nécessaires tiennent dans le contrat public existant.
- `/world/:worldId/config` n'est pas consommé par l'UI : config brute runtime non stable pour une page joueur.
- Les dimensions de carte sont contractées publiquement via `map.width` / `map.height`, dérivées de `world.gridWidth` / `world.gridHeight`.
- Les durées `inscriptionMainDays` / `inscriptionLateDays` sont contractées dans `PublicWorld.lifecycle` pour éviter tout hardcode frontend.
- Les données maquette non sourcées restent exclues du runtime ; elles ne sont autorisées que dans les assertions de non-rendu.
- Dérogation process validée le 2026-05-31 : re-review indépendante stoppée à la demande explicite du user après QA navigateur faite par lui et validée OK.

## Rapport final

Run livré : les cards `/worlds` ont un bouton secondaire `Détails` qui ouvre `/worlds/:worldId` sans déclencher la mutation join. La page détail réutilise le contrat public enrichi, affiche uniquement identity/status/lifecycle/tempo/joinedCount/tier/sigil/theme/map/stats personnelles conditionnelles, et garde les CTA existants.

Fichiers principaux touchés : `packages/shared/src/world/dtos.ts`, `battleforthecrown-backend/src/modules/world/world.service.ts`, `battleforthecrown-backend/test/worlds-public.smoke.spec.ts`, `battleforthecrown-pixi/src/features/worlds/*`, `battleforthecrown-pixi/src/features/design-system/worlds/*`, `battleforthecrown-pixi/src/App.tsx`, `docs/gameplay/19-world-lifecycle.md`.

Aucun ticket follow-up ouvert. Risque résiduel accepté : `useWorldCardModels` centralise liste et détail, donc le détail partage les requêtes de puissance publique déjà utilisées par la sélection ; c'est volontaire pour éviter deux modèles divergents.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] `bftc-design-system-migration` appliqué — `rtk grep -n "StatusBar|phone|Phone|Seigneur fondateur|PvP|Coalitions|Pillage|Densité|capitale|classement|récompense|region|région" battleforthecrown-pixi/src/features/design-system/worlds/WorldDetailDesign.tsx battleforthecrown-pixi/src/features/worlds/WorldDetailScreen.tsx` → 0 résultat runtime ; preview `/design-system` ajoutée.
  - [x] Bouton `Détails` et navigation — `rtk yarn workspace battleforthecrown-pixi test WorldsSelectionDesign.test.tsx WorldDetailDesign.test.tsx worldsViewModel.test.ts GameEntryTransition.test.tsx GameHeader.test.tsx` → 5 files / 37 tests passés.
  - [x] Contrat public détail ou décision `PublicWorld` suffisante — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- worlds-public.smoke.spec.ts` → 1 suite / 2 tests passés ; décision tracée : `PublicWorld` enrichi suffit.
  - [x] Non-rendu des fixtures non sourcées — `rtk yarn workspace battleforthecrown-pixi test WorldDetailDesign.test.tsx` + grep runtime ci-dessus → les termes maquette non sourcés ne sont pas rendus.
- **Review indépendante** : déclenchée (raison: back+front/shared, diff > 100 lignes, écran visible, contrat durable). Verdict initial `BLOCK`; finding lifecycle hardcodé résolu par contrat `inscriptionMainDays` / `inscriptionLateDays`. Re-review stoppée sur demande explicite du user après QA navigateur validée OK.
- **Tests automatisés** :
  - `rtk yarn workspace @battleforthecrown/shared build` → passé.
  - `rtk yarn workspace battleforthecrown-pixi test WorldsSelectionDesign.test.tsx WorldDetailDesign.test.tsx worldsViewModel.test.ts` → 3 files / 19 tests passés.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → passé.
  - `rtk yarn workspace battleforthecrown-pixi test WorldsSelectionDesign.test.tsx WorldDetailDesign.test.tsx worldsViewModel.test.ts GameEntryTransition.test.tsx GameHeader.test.tsx` → 5 files / 37 tests passés.
  - `rtk yarn workspace battleforthecrown-pixi test` → 48 files / 240 tests passés ; warning jsdom connu `HTMLCanvasElement.getContext()` non implémenté.
  - `rtk yarn workspace battleforthecrown-pixi build` → passé.
  - `rtk yarn static-check` → passé.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/worlds-public.smoke.spec.ts` couvre maintenant `map.width` / `map.height` et les durées lifecycle d'inscription du contrat public.
- **Smokes lancés** :
  - `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` → passé.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run -- worlds-public.smoke.spec.ts` → 1 suite / 2 tests passés.
- **QA fonctionnelle agent** : worktree QA démarré sur DB temporaire `battleforthecrown_ab54`, backend `http://localhost:15002/health` OK, frontend `http://localhost:5174/` OK, `GET /worlds/public` vérifié avec `map` et lifecycle enrichi ; navigateur ouvert sur `/worlds` puis `/worlds/fresh-open`. DB temporaire supprimée après arrêt.
- **Tests IG à faire par le user** : aucun restant ; le user a explicitement validé la QA navigateur le 2026-05-31.

## Liens détectés

- **À faire avant** : aucun.
- **À faire après** : aucun identifié.
- **Doublon potentiel** : aucun.
- **Connexe** :
  - [`032 — Lifecycle backend foundation + identité monde`](./archive/032-world-lifecycle-foundation-and-identity.md) — contrat public world lifecycle/identity.
  - [`033 — Écran sélection royaumes Pixi`](./archive/033-feature-worlds-selection-screen.md) — écran `/worlds`, cards et design-system world selection.
  - [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md) — endpoints/hooks world-scoped.
  - [`072 — Stats joueur sur les cartes royaumes`](../archive/072-worlds-player-stats.md) — stats personnelles optionnelles par monde rejoint.
- **Déjà résolu** : aucun.
- **Keywords scannés** : `world`, `worlds`, `royaume`, `details`, `sélection`, `design-system`, `lifecycle`, `tempo`.

## Points d'attention

- `GET /worlds/public` est la source la plus saine pour un détail léger ; `GET /world/:worldId/details` est legacy et moins aligné avec le nouveau contrat public.
- Ne pas brancher la page directement sur `GET /world/:worldId/config` sans cadrage : la config brute runtime n'est pas un contrat UI.
- La maquette est une source visuelle, pas une source de vérité de données. Toute donnée non sourcée doit être retirée ou remplacée par un équivalent contracté.
- Si le détail devient trop riche, segmenter en deux runs : contrat public détail puis UI détail.
