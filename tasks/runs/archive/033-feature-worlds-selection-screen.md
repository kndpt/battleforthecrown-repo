# Run #033 — feature-worlds-selection-screen

> **Statut** : DONE
> **Démarré** : 2026-05-25
> **Terminé** : 2026-05-25

## Cible

- **Phase roadmap** : Hors roadmap explicite — refonte de l'écran de sélection des royaumes pour matcher les mockups validés (cf. images Royaumes / Variantes / Onglets Inscription/Bientôt/Verrouillés).
- **Spec source** :
  - [`docs/gameplay/19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md) — § Cycle de transition, statuts visibles côté joueur.
  - [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) — § 4 (Catalogue des mondes : Standard / Speed / Hardcore).
  - Mockups validés (3 screens transmis en clarification).
- **Type** : feature frontend Pixi/React + petit câblage shared
- **Modules backend** : aucun (consomme l'endpoint exposé par Run #032)
- **Modules frontend** : `battleforthecrown-pixi/src/features/worlds/` (écran sélection), routes/screen flow, design-system tokens si manquants

## Contexte

Run #032 livre :
- DTO public enrichi `GET /worlds/public` (status, identity, lifecycle, joinedCount, tempoProfile).
- Workers de transition automatique.
- Identité monde (displayName, tagline, sigil, themeColor, tier).

Ce run livre l'**UI consommatrice** : un écran de sélection conforme aux 3 mockups validés.

### Source design-system (PRÉ-REQUIS migration)

Avant toute écriture React/Tailwind, **invoquer le skill `bftc-design-system-migration`** pour porter les prototypes :

- HTML source : [`battleforthecrown-design-system/project/Choix du Monde.html`](../../battleforthecrown-design-system/project/Choix%20du%20Monde.html) — 3 artboards mobile 360×720 (A liste + conseillé, B bannières héraldiques, C détail monde).
- JSX source : [`battleforthecrown-design-system/project/world-views.jsx`](../../battleforthecrown-design-system/project/world-views.jsx) — `WorldArtboardA/B/C` + données `WORLDS`.
- Tokens & primitives : `colors_and_type.css`, `bftc-primitives.jsx`, `design-canvas.jsx`.

Mapping cible (cf. règles `bftc-design-system-migration`) :
- Drafts dans `battleforthecrown-pixi/src/features/design-system/` puis exposés via `/design-system` pour QA visuelle avant intégration.
- Primitives stables (`PixelBtn`, `Pill`, `Glyph`, crest, lifecycle bar) promues dans `battleforthecrown-pixi/src/ui/` si réutilisables.
- Shell stateful (`WorldsSelectionScreen`) promu dans `battleforthecrown-pixi/src/features/worlds/`.

Choix de la variante à porter en priorité : **B (bannières héraldiques)** — la plus alignée avec les mockups validés (lifecycle bar, status ribbon, identité serveur). Garder A/C en preview design-system pour itérations futures, ne pas câbler sur l'API.

Choix produit tranchés en clarification :
- **Pas d'indicateur d'activité** — retiré du design (les chips CALME/NAISSANT/TENDU/SATURÉ du mockup ne sont pas implémentées).
- Variantes Standard / Speed / Hardcore : Standard sélectionnable, autres affichées en pill « BIENTÔT » désactivées.
- CTA « Me prévenir à l'ouverture » : **placeholder** (toast « Disponible bientôt » ou no-op visuel).
- Wording unifié : tous les `LOCKED` affichent « Inscription close » (pas « Royaume complet », pas de cap MVP).

## Dépendances

- **Run #032** (lifecycle backend foundation + identity) — **prérequis dur**. Tant que le DTO public n'est pas exposé, l'écran ne peut pas être branché sur la vraie API.
- Design-system existant : composants `Card`, `Button`, `Tabs`, `Pill`, `ProgressBar`, font headings (cf. design-system workspace).

## Critère de fin (acceptance)

### Migration design-system (étape 1, obligatoire avant câblage)

- [ ] Skill `bftc-design-system-migration` invoqué avec source `project/Choix du Monde.html` + `project/world-views.jsx`.
- [ ] Ports React/Tailwind créés sous `battleforthecrown-pixi/src/features/design-system/worlds/` reproduisant fidèlement les artboards (au minimum B, idéalement A et C aussi).
- [ ] Exemples ajoutés à `DesignSystemPreview.tsx` (`/design-system`) avec fixtures identiques au prototype (mondes Aubeforge, Bois-Doux, etc.).
- [ ] Composants exposent `Props` typées (pas de fixture hardcodée dans le composant final), contrat « Production-Ready » respecté (CTA = `<button>`, callbacks `onJoin`, `onNotify`, `onSelect`, etc.).
- [ ] Tokens couleur (`themeColor`) et sigils mappés via design-system, pas via hex en dur dans le screen.

### Composants

- [ ] Nouveau composant `WorldsSelectionScreen` (route `/worlds` ou équivalent) avec :
  - Header : « Retour », titre « ROYAUMES », compteur total (« 7 ROYAUMES »), tagline (« Choisissez votre saison… »).
  - Section **Variantes de saison** : 3 chips (Standard / Speed / Hardcore). Standard active, autres `disabled` avec pill « BIENTÔT ».
  - Onglets **Inscription / Bientôt / Verrouillés** avec badge compteur. Filtre client-side sur la liste reçue.
- [ ] Depuis le bottom sheet profil actuel : appui sur l'information de monde (ex. bloc « MONDE / Default World » visible dans le profil joueur) → navigation vers l'écran des mondes.
- [ ] Composant `WorldCard` :
  - Bannière colorée selon `identity.themeColor`, sigil selon `identity.sigil`, `displayName`, `tagline` (ellipsé).
  - Pill `tempoProfile` (« STANDARD »).
  - Status pill (« INSCRIPTION LIBRE » / « PLANIFIÉ » / « INSCRIPTION CLOSE »).
  - Gauge `day / totalDays` (ex. « J. 5 / 60 ») + barre de progression segmentée (main / late / locked).
  - Pour `PLANNED` : countdown « Ouvre dans Xj Yh » dérivé de `plannedOpenAt`, gauge à 0.
  - Métriques : icône joueurs + `joinedCount`, séparateur, pill `tier` (« DÉBUTANTS » / « CLASSÉ »).
  - CTA selon état :
    - `OPEN` (main ou late) → bouton vert « Rejoindre le royaume » → mutation existante.
    - `PLANNED` → bouton bleu « Me prévenir à l'ouverture » (placeholder, toast info).
    - `LOCKED` → bouton désactivé gris « Inscription close ».
- [ ] Mapping `sigil` enum → icône (asset existant ou composant SVG), `themeColor` enum → tokens couleur design-system.

### Câblage data

- [ ] Hook `useWorldsPublic()` (TanStack Query) sur `GET /worlds/public`.
- [ ] Invalidation du cache sur event WS `world.status.changed` (émis par Run #032).
- [ ] Filtre onglets via dérivation côté front (pas de paramètre URL côté API).

### Edge cases

- [ ] Liste vide pour un onglet → empty state lisible (« Aucun royaume planifié », etc.).
- [ ] Network error / loading → skeleton card.
- [ ] Bouton « Me prévenir » → toast « Disponible bientôt » (pas de mutation backend).

### Tests

- [ ] Test Pixi/Vitest : `WorldCard` rendering pour chaque combinaison status × inscriptionPhase (≥ 4 cas).
- [ ] Test Pixi/Vitest : `WorldsSelectionScreen` filtre par onglet, compteurs corrects.
- [ ] Smoke optionnel : ouverture de l'écran et clic « Rejoindre » sur un `OPEN` déclenche bien la mutation existante.

### Validation

- [ ] `yarn static-check` vert.
- [ ] Tests Pixi verts.
- [ ] QA visuelle user (les 3 mockups doivent correspondre au rendu réel ± ajustements design-system).

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- React/Zustand/TanStack : skill `bftc-react-hud`
- **Design-system migration : skill `bftc-design-system-migration` — OBLIGATOIRE, étape 1 du run.** Sources : `battleforthecrown-design-system/project/Choix du Monde.html` + `battleforthecrown-design-system/project/world-views.jsx`.

## Décomposition initiale (rempli par le lead à l'étape 3)

- Porter la variante B du prototype en composants React/Tailwind typés sous `battleforthecrown-pixi/src/features/design-system/worlds/`.
- Exposer la preview fidèle dans `/design-system` avec fixtures séparées.
- Remplacer l'ancien écran `/worlds` par un écran branché sur `GET /worlds/public`, avec onglets client-side et CTA par statut.
- Câbler le bloc monde du profil joueur vers `/worlds`.
- Couvrir le mapping et le rendu par tests Vitest, puis valider par static-check, build et QA navigateur.

## Progress (rempli pendant le run)

- [x] Préflight, rules, specs, skills `bftc-design-system-migration`, `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`.
- [x] Cartographie du prototype `Choix du Monde.html` / `world-views.jsx` et de l'existant Pixi worlds/profile.
- [x] Composants `WorldsSelectionDesign`, `WorldCard`, fixtures preview et config variantes ajoutés au design-system.
- [x] `WorldSelector` branché sur `usePublicWorldsQuery`, mutation join existante, toast notify placeholder et alerte join non bloquante.
- [x] Profil joueur : le bloc monde navigue vers `/worlds`.
- [x] Tests ajoutés pour view-model worlds, rendu `WorldCard` status × phase et navigation profil.
- [x] Review indépendante initiale BLOCK, findings corrigés, re-review GO.
- [x] Tests, static-check, build et QA navigateur réalisés.

## Décisions prises

- Mode complet : écran visible + migration design-system + route + tests, diff > 100 lignes.
- Variante production prioritaire : B bannières héraldiques. A/C restent dans la source design-system pour itérations futures, non câblées API.
- Le screen consomme directement le DTO public livré par Run #032 ; aucun changement backend/shared nécessaire.
- `world.status.changed` invalidait déjà `queryKeys.publicWorlds()` via Run #032, donc pas de nouveau binding WS.
- Une erreur de join est affichée en notice non bloquante pour garder les cartes et CTA visibles.
- La card n'affiche pas l'`inscriptionPhase` brut (`main|late|closed`) ; seules les métriques joueurs + tier sont visibles.
- Pas d'entrée SPEC : aucun invariant durable ou bug récurrent transversal nouveau.

## Rapport final

L'écran `/worlds` utilise maintenant les bannières héraldiques issues du prototype design-system, avec variantes Standard/Speed/Hardcore, onglets Inscription/Bientôt/Verrouillés, cards par statut, countdown PLANNED, CTA join/notify/locked et empty/loading/error states.

Le bloc monde du profil joueur est cliquable et ouvre `/worlds`. Les tests couvrent le mapping public-worlds, les compteurs/filtres, le rendu `WorldCard` sur 4 combinaisons status × phase, la notice join non bloquante et la navigation depuis le profil.

Docs : aucun changement nécessaire, raison : l'API/lifecycle/tempo sont déjà documentés par Run #032 et les specs `19`/`23`; ce run ajoute une UI consommatrice sans convention durable nouvelle.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Skill `bftc-design-system-migration` invoqué et sources lues — `rtk read .agents/skills/bftc-design-system-migration/SKILL.md` + `rtk read battleforthecrown-design-system/project/Choix du Monde.html` + `rtk read battleforthecrown-design-system/project/world-views.jsx` → migration cadrée.
  - [x] Ports React/Tailwind sous `src/features/design-system/worlds/` et preview `/design-system` — `rtk grep "Choix du Monde · Variante B" battleforthecrown-pixi/src/features/design-system/DesignSystemPreview.tsx` → preview ajoutée.
  - [x] `/worlds` branché sur `GET /worlds/public` et filtre onglets client-side — `rtk grep "usePublicWorldsQuery\\|filterWorldsByTab" battleforthecrown-pixi/src/features/worlds` → hook public + dérivation locale.
  - [x] CTA par statut et toast notify placeholder — `rtk grep "Me prévenir\\|Disponible bientôt\\|Inscription close" battleforthecrown-pixi/src/features` → labels/actions présents.
  - [x] Navigation profil monde vers `/worlds` — `rtk yarn workspace battleforthecrown-pixi test src/features/layout/GameHeader.test.tsx` → test navigation vert.
  - [x] `WorldCard` status × phase et compteurs/filtres — `rtk yarn workspace battleforthecrown-pixi test src/features/design-system/worlds/WorldsSelectionDesign.test.tsx src/features/worlds/worldsViewModel.test.ts` → tests verts.
  - [x] QA navigateur preview onglets — `visuel` → `/design-system` affiche variante B; clics `Bientôt` puis `Verrouillés` montrent les cartes attendues.
- **Review indépendante** : Déclenchée (raison: diff > 100 lignes + écran visible). Verdict initial `BLOCK`, findings corrigés, re-review `GO`.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-pixi test src/features/design-system/worlds/WorldsSelectionDesign.test.tsx src/features/worlds/worldsViewModel.test.ts src/features/layout/GameHeader.test.tsx` → 3 fichiers, 18 tests passés.
  - `rtk yarn workspace battleforthecrown-pixi test` → 32 fichiers, 174 tests passés. Note jsdom connue : `HTMLCanvasElement.getContext()` non implémenté, suite verte.
  - `rtk yarn workspace battleforthecrown-pixi build` → build Vite OK.
  - `rtk yarn static-check` → OK.
- **Smokes lancés** : Non applicable, raison : aucun fichier `battleforthecrown-backend/src/` touché.
- **Smokes ajoutés/modifiés** : Aucun, raison : UI frontend uniquement; couverture par Vitest + QA navigateur.
- **QA fonctionnelle agent** : `/design-system` ouvert sur Vite port 5174 via navigateur; variante B visible, onglets `Inscription`, `Bientôt`, `Verrouillés` vérifiés par DOM/screenshot.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir l'écran Royaumes, vérifier les 3 onglets (Inscription / Bientôt / Verrouillés) et leur contenu.
  - [ ] Rejoindre un monde `OPEN` → flow nominal toujours fonctionnel.
  - [ ] Cliquer un monde `LOCKED` → CTA grisé, pas d'action.
  - [ ] Cliquer un monde `PLANNED` → toast « Disponible bientôt ».
  - [ ] Vérifier rendu identité (sigil, couleur bannière, tagline tronquée si > 80 chars).
  - [ ] Vérifier countdown « Ouvre dans Xj Yh » sur un `PLANNED`.

## Points d'attention

- **Pas d'indicateur d'activité** : ne pas implémenter le chip CALME/NAISSANT/TENDU/SATURÉ vu sur le mockup.
- **Wording uniforme** : tous les `LOCKED` affichent « Inscription close ». Pas de « Royaume complet ».
- **Variantes Speed/Hardcore** : visuel only, désactivées. Aucun filtrage de liste par variante (la liste reçue est déjà filtrée serveur à Standard MVP).
- **Notif « me prévenir »** : si on a un toast design-system, l'utiliser. Sinon, no-op avec curseur disabled-look. Pas d'implémentation backend.
