# Run #035 — fix-early-barbarian-reachability

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 8 — Onboarding (pré-requis gameplay transversal)
- **Spec source** : [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md#tour-de-guet-watchtower) + [`docs/gameplay/07-barbarian-spawning.md`](../../docs/gameplay/07-barbarian-spawning.md) + [`docs/gameplay/15-onboarding.md`](../../docs/gameplay/15-onboarding.md)
- **Type** : `fix`
- **Modules backend** : `world/barbarian-seeding`, `world/vision`, `combat`
- **Modules frontend** : `pixi/features/world`, si les libellés de portée Watchtower sont affichés

## Dépendances

- Runs barbares déjà livrés : [`018`](./archive/018-feature-barbarian-conquest-backend-shared.md) et [`019`](./archive/019-feature-barbarian-conquest-frontend-ui.md).
- Ticket Watchtower déjà clos : [`45`](../archive/45-watchtower-finite-vision.md), à préserver : la Watchtower reste finie, jamais globale.
- Ce run est un pré-requis obligatoire du run [`036-feature-scripted-onboarding-runtime`](./036-feature-scripted-onboarding-runtime.md).

## Critère de fin (acceptance)

- [ ] `WATCHTOWER_VISION_LEVELS` donne une portée niveau 1 suffisante pour une première cible barbare T1 atteignable ; piste recommandée : niveau 1 = 10 cases, puis décaler les niveaux suivants (`10, 15, ..., 55`) en gardant une vision finie.
- [ ] Les specs `03-buildings.md` et `07-barbarian-spawning.md` documentent l'invariant : un joueur fraîchement arrivé doit pouvoir révéler au moins un village barbare T1 avec une Watchtower niveau 1.
- [ ] Le seeding à l'arrivée garantit au moins un village barbare T1 dans le rayon Watchtower niveau 1 du village joueur, même si le sampling chunk normal ne tombe pas dans cette portée.
- [ ] La garantie reste idempotente : relancer le seeding/catchup ne crée pas de doublon proche si un T1 atteignable existe déjà.
- [ ] Le seeding conserve l'anti-submersion et l'anti-saturation pour le reste des villages barbares ; la garantie proche doit être bornée à la première cible jouable, pas devenir un reseed local infini.
- [ ] Un smoke backend prouve le flux compte frais : join monde -> seeding -> Watchtower niveau 1 -> au moins un T1 dans la vision -> attaque autorisée par `CombatService`.
- [ ] Les tests pure-logic de géométrie/vision couvrent la nouvelle portée Watchtower et la sélection/garantie d'une cible T1 proche.
- [ ] `yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

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
  - [ ] Watchtower niveau 1 portée augmentée et niveaux décalés — `rtk yarn workspace battleforthecrown-backend test buildings.spec.ts` ou test ciblé équivalent -> résultat observé.
  - [ ] T1 proche garanti au join — `rtk yarn workspace battleforthecrown-backend test:smoke:run <smoke>` -> résultat observé.
  - [ ] Attaque autorisée sur le T1 visible — `rtk yarn workspace battleforthecrown-backend test:smoke:run <smoke>` -> résultat observé.
  - [ ] Docs alignées — `rtk grep -n "Watchtower\\|Tour de guet\\|T1\\|onboarding" docs/gameplay/03-buildings.md docs/gameplay/07-barbarian-spawning.md docs/gameplay/15-onboarding.md` -> résultat observé.
- **Review indépendante** : `Déclenchée (raison: back+front possible + invariant durable + diff estimé > 100 lignes)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : smoke backend réel join/seeding/vision/attaque ; compléter par curl/API si le smoke ne couvre pas toute la chaîne.
- **Tests IG à faire par le user** : vérifier visuellement qu'un compte frais avec Watchtower niveau 1 voit au moins un village barbare T1 attaquable.

## Notes de cadrage

- Root cause actuelle : `WATCHTOWER_VISION_LEVELS[1].visibilityRadius = 5`, alors que le seeding T1 commence à `rMin = 8` et peut placer les T1 jusqu'à `20` cases. Le tutoriel peut donc demander une attaque barbare sans cible légalement attaquable.
- Ne pas résoudre par un bypass du fog-of-war dans `CombatService` : l'invariant doit être géométrique et visible côté carte.
- La garantie proche peut être implémentée comme une étape dédiée après le seeding normal : si aucun T1 n'existe dans le rayon Watchtower L1, créer une cible T1 sur une position valide dans ce rayon, en respectant collisions, `playerExclusion`, unicité `(worldId, x, y)` et idempotence.
- Le run [`036-feature-scripted-onboarding-runtime`](./036-feature-scripted-onboarding-runtime.md) ne doit pas démarrer avant que ce run ait prouvé l'invariant.

## Liens détectés

- Avant : Aucun autre que les runs archivés déjà `DONE`.
- Après : [`036-feature-scripted-onboarding-runtime`](./036-feature-scripted-onboarding-runtime.md) dépend de cet invariant.
- Doublon potentiel : Aucun.
- Connexe : [`tasks/archive/45-watchtower-finite-vision.md`](../archive/45-watchtower-finite-vision.md), [`tasks/runs/archive/018-feature-barbarian-conquest-backend-shared.md`](./archive/018-feature-barbarian-conquest-backend-shared.md), [`tasks/runs/archive/019-feature-barbarian-conquest-frontend-ui.md`](./archive/019-feature-barbarian-conquest-frontend-ui.md), [`tasks/runs/archive/007-audit-barbarian-spawning.md`](./archive/007-audit-barbarian-spawning.md).
- Déjà résolu : Aucun.
- Keywords scannés : `watchtower`, `vision`, `barbarian`, `T1`, `onboarding`, `seeding`, `attack`.
