# Run #042 — feature-world-detail-page

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

- [ ] `bftc-design-system-migration` est appliqué en première étape et produit un composant détail world générique typé, props-first, sans fixture hardcodée dans le composant final. Preuve : grep + preview `/design-system` + QA visuelle.
- [ ] Le composant migré ne contient pas `StatusBar`, phone shell, barre de notif, ni faux chrome prototype. Preuve : grep + inspection visuelle.
- [ ] Les cards `/worlds` affichent un bouton secondaire `Détails` à gauche du CTA principal, sans modifier les comportements `Entrer dans le royaume` / `Rejoindre le royaume` / `Me prévenir` / `Inscription close`. Preuve : test Pixi.
- [ ] Cliquer `Détails` navigue vers une route détail dédiée, par exemple `/worlds/:worldId`, sans déclencher la mutation join. Preuve : test route/component.
- [ ] Le backend/shared expose un contrat public stable pour les champs détail réellement affichables, ou la fiche documente explicitement que `PublicWorld` suffit et que `/world/:worldId/config` n'est pas consommé brut par l'UI. Preuve : Zod/test backend ou décision tracée.
- [ ] La page détail affiche uniquement les données disponibles sûres : identity, status, lifecycle, tempoProfile, joinedCount, tier/sigil/theme, et dimensions carte seulement si contractées. Preuve : test Pixi.
- [ ] Les stats personnelles `villageCount` + puissance ne s'affichent que si le monde est rejoint et si les données sont chargées ; aucune valeur `0` placeholder. Preuve : test Pixi.
- [ ] Les fixtures non sourcées de la maquette ne sont pas affichées : région, coord de capitale, seigneur fondateur, coalitions max, PvP level, pillage, densité qualitative, mini-map réelle, récompenses fin de saison, classements figés. Preuve : grep/test de non-rendu.
- [ ] QA navigateur : depuis `/worlds`, ouvrir le détail d'un monde `OPEN`, `PLANNED`, `LOCKED` et d'un monde déjà rejoint ; retour vers la liste OK ; layout mobile sans overlap. Preuve : visuel/gameplay.
- [ ] `rtk yarn static-check` et tests ciblés Pixi/backend passent. Preuve : commandes exactes dans le rapport final.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- React/Zustand/TanStack : skill `bftc-react-hud`
- Design-system migration : skill `bftc-design-system-migration`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] `bftc-design-system-migration` appliqué — `<commande/grep/visuel>` → <résultat observé>
  - [ ] Bouton `Détails` et navigation — `<commande test>` → <résultat observé>
  - [ ] Contrat public détail ou décision `PublicWorld` suffisante — `<commande test/Zod ou décision>` → <résultat observé>
  - [ ] Non-rendu des fixtures non sourcées — `<commande test/grep>` → <résultat observé>
- **Review indépendante** : `Déclenchée (raison: back+front/shared probable, diff > 100 lignes, écran visible, contrat durable)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : navigateur `/worlds` + `/worlds/:worldId`, résultats observables.
- **Tests IG à faire par le user** : vérifier visuellement les détails `OPEN`, `PLANNED`, `LOCKED`, monde rejoint, et l'absence de données inventées.

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
