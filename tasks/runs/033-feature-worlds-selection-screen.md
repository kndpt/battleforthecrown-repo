# Run #033 — feature-worlds-selection-screen

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

Choix produit tranchés en clarification :
- **Pas d'indicateur d'activité** — retiré du design (les chips CALME/NAISSANT/TENDU/SATURÉ du mockup ne sont pas implémentées).
- Variantes Standard / Speed / Hardcore : Standard sélectionnable, autres affichées en pill « BIENTÔT » désactivées.
- CTA « Me prévenir à l'ouverture » : **placeholder** (toast « Disponible bientôt » ou no-op visuel).
- Wording unifié : tous les `LOCKED` affichent « Inscription close » (pas « Royaume complet », pas de cap MVP).

## Dépendances

- **Run #032** (lifecycle backend foundation + identity) — **prérequis dur**. Tant que le DTO public n'est pas exposé, l'écran ne peut pas être branché sur la vraie API.
- Design-system existant : composants `Card`, `Button`, `Tabs`, `Pill`, `ProgressBar`, font headings (cf. design-system workspace).

## Critère de fin (acceptance)

### Composants

- [ ] Nouveau composant `WorldsSelectionScreen` (route `/worlds` ou équivalent) avec :
  - Header : « Retour », titre « ROYAUMES », compteur total (« 7 ROYAUMES »), tagline (« Choisissez votre saison… »).
  - Section **Variantes de saison** : 3 chips (Standard / Speed / Hardcore). Standard active, autres `disabled` avec pill « BIENTÔT ».
  - Onglets **Inscription / Bientôt / Verrouillés** avec badge compteur. Filtre client-side sur la liste reçue.
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
- Design-system migration : skill `bftc-design-system-migration` si composants à porter

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage.)_

## Progress (rempli pendant le run)

_(Vide au démarrage.)_

## Décisions prises

_(Vide au démarrage.)_

## Rapport final

_(Vide au démarrage.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] _(à remplir)_
- **Review indépendante** : à déclencher (touche un écran d'onboarding visible, diff probablement > 100 lignes).
- **Tests automatisés** : à remplir.
- **Smokes ajoutés/modifiés** : à remplir.
- **QA fonctionnelle agent** : non applicable (UI pure, QA visuelle user).
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
