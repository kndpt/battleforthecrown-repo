# Run #035 — fix-early-barbarian-reachability

> **Statut** : DONE
> **Démarré** : 2026-05-25 22:54 CEST
> **Terminé** : 2026-05-25 22:54 CEST

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

- [x] `WATCHTOWER_VISION_LEVELS` donne une portée niveau 1 suffisante pour une première cible barbare T1 atteignable ; piste recommandée : niveau 1 = 10 cases, puis décaler les niveaux suivants (`10, 15, ..., 55`) en gardant une vision finie.
- [x] Les specs `03-buildings.md` et `07-barbarian-spawning.md` documentent l'invariant : un joueur fraîchement arrivé doit pouvoir révéler au moins un village barbare T1 avec une Watchtower niveau 1.
- [x] Le seeding à l'arrivée garantit au moins un village barbare T1 dans le rayon Watchtower niveau 1 du village joueur, même si le sampling chunk normal ne tombe pas dans cette portée.
- [x] La garantie reste idempotente : relancer le seeding/catchup ne crée pas de doublon proche si un T1 atteignable existe déjà.
- [x] Le seeding conserve l'anti-submersion et l'anti-saturation pour le reste des villages barbares ; la garantie proche doit être bornée à la première cible jouable, pas devenir un reseed local infini.
- [x] Un smoke backend prouve le flux compte frais : join monde -> seeding -> Watchtower niveau 1 -> au moins un T1 dans la vision -> attaque autorisée par `CombatService`.
- [x] Les tests pure-logic de géométrie/vision couvrent la nouvelle portée Watchtower et la sélection/garantie d'une cible T1 proche.
- [x] `yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Shared : décaler `WATCHTOWER_VISION_LEVELS` vers `10, 15, ..., 55`.
- [x] Shared/backend : ajouter une sélection pure et déterministe de position T1 proche, consommée par le seeding après les chunks normaux.
- [x] Backend : garantir au plus un T1 dans le rayon Watchtower L1 si aucun T1 atteignable n'existe déjà.
- [x] Tests : ajouter unitaires géométrie/vision/portée et smoke join -> seeding -> vision -> attaque.
- [x] Docs : aligner les specs gameplay sur la nouvelle portée et l'invariant onboarding.

## Progress (rempli pendant le run)

- 2026-05-25 22:54 CEST — Implémentation, tests ciblés, smoke complet et `static-check` exécutés. Review indépendante initiale `BLOCK` : preuve `static-check` non reportée + anciennes valeurs Watchtower dans `00-game-flow.md`/`01-overview.md`.
- 2026-05-25 22:54 CEST — Findings review corrigés : `tasks/todo.md` coche les gates, `00-game-flow.md` et `01-overview.md` indiquent L1=10 / L10=55.

## Décisions prises

- Garantie proche bornée à une seule cible T1 jouable : elle s'exécute après le seeding chunk normal, vérifie d'abord l'existence d'un T1 dans le rayon Watchtower L1, puis crée au plus un T1 sur une position valide.
- Pas de bypass combat : `CombatService` continue de refuser les cibles hors vision ; l'invariant est géométrique et visible côté carte.
- Review indépendante déclenchée (raison : invariant durable + diff > 100 lignes). Verdict initial `BLOCK`, findings corrigés puis re-review demandée.

## Rapport final

Run terminé.

Changements principaux :
- `WATCHTOWER_VISION_LEVELS` passe de `5..50` à `10..55`, en gardant une vision finie.
- `BarbarianSeedingService` ajoute une garantie post-seeding : si aucun T1 n'est déjà dans le rayon Watchtower L1, il crée au plus une cible T1 sur une position valide.
- `findReachableBarbarianSeedPosition` couvre la sélection pure de position, avec respect `minSpacing`, `playerExclusion`, bornes monde et anneau T1.
- Docs gameplay alignées : `00-game-flow.md`, `01-overview.md`, `03-buildings.md`, `07-barbarian-spawning.md`.
- Tests ajoutés/adaptés : unitaires bâtiments/vision/géométrie + smoke `barbarians` join -> seeding -> vision -> attaque.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Watchtower niveau 1 portée augmentée et niveaux décalés — `rtk yarn workspace battleforthecrown-backend test --runInBand src/modules/village/buildings.spec.ts src/modules/world/vision.service.spec.ts src/modules/world/barbarian-geometry.spec.ts` -> 3 suites passed, 63 tests passed.
  - [x] T1 proche garanti au join — `rtk yarn workspace battleforthecrown-backend test:smoke:run barbarians.smoke.spec.ts vision.smoke.spec.ts` -> 2 suites passed, 7 tests passed.
  - [x] Attaque autorisée sur le T1 visible — `rtk yarn workspace battleforthecrown-backend test:smoke:run barbarians.smoke.spec.ts vision.smoke.spec.ts` -> smoke `barbarian seeding: fresh join guarantees...` passed.
  - [x] Docs alignées — `rtk grep -n "lvl 1 =|Lvl 1 =|lvl 10|WATCHTOWER_VISION_LEVELS\\[1\\]|visibilityRadius: 5|visibilityRadius: 50" docs/gameplay packages/shared/src/village/buildings.ts tasks/todo.md` -> anciennes valeurs L1=5/L10=50 absentes des docs gameplay ; runtime L9=50/L10=55 attendu.
  - [x] Static check — `rtk yarn static-check` -> exit 0 après re-review fix.
- **Review indépendante** : Déclenchée (raison : invariant durable + diff > 100 lignes), verdict initial `BLOCK`, findings résolus, re-review `GO`.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-backend test --runInBand src/modules/village/buildings.spec.ts src/modules/world/vision.service.spec.ts src/modules/world/barbarian-geometry.spec.ts` -> 3 suites passed, 63 tests passed.
  - `rtk yarn static-check` -> backend type-check, pixi type-check, backend eslint quiet, pixi eslint quiet OK.
- **Smokes lancés** : `rtk yarn test:smoke` -> preflight OK, 24 suites passed, 50 tests passed. Logs PgBoss/Prisma de fermeture observés sans échec Jest.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/barbarians.smoke.spec.ts` ajoute le scénario compte frais -> seeding garanti -> Watchtower L1 -> T1 visible -> attaque autorisée. `vision.smoke.spec.ts` adapte les rayons attendus.
- **QA fonctionnelle agent** : couverte par le smoke backend réel (`joinWorld`, `/world/:id/entities`, `POST /combat/attack`) avec DB smoke, sans mock Prisma.
- **Tests IG à faire par le user** : Aucun test IG nécessaire, raison : aucun fichier rendu Pixi/React modifié ; le comportement visible est prouvé côté payload serveur et gate combat par smoke backend réel.

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
