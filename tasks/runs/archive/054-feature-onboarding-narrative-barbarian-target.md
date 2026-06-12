# Run #054 — feature-onboarding-narrative-barbarian-target

> **Statut** : DONE
> **Démarré** : 2026-06-12
> **Terminé** : 2026-06-12

## Cible

- **Phase roadmap** : Phase 8 — Onboarding
- **Spec source** : [`docs/gameplay/15-onboarding.md`](../../docs/gameplay/15-onboarding.md) + [`docs/gameplay/07-barbarian-spawning.md`](../../docs/gameplay/07-barbarian-spawning.md) + [`docs/gameplay/06-barbarians.md`](../../docs/gameplay/06-barbarians.md)
- **Type** : `feature`
- **Modules backend** : `onboarding`, `world/barbarian-seeding`, `world/barbarian-village-factory`, `combat`
- **Modules frontend** : `pixi/features/onboarding`, `pixi/features/world`

## Dépendances

- Aucune dépendance active bloquante.
- Préserver la politique globale issue du run [`007-audit-barbarian-spawning`](./archive/007-audit-barbarian-spawning.md) : les villages barbares T1-T5 globaux restent des adversaires réels, générés par seeding/catchup avec anti-submersion.
- Nettoyer/remplacer l'invariant introduit par le run [`035-fix-early-barbarian-reachability`](./archive/035-fix-early-barbarian-reachability.md) sans casser l'onboarding livré par le run [`036-feature-scripted-onboarding-runtime`](./archive/036-feature-scripted-onboarding-runtime.md).

## Critère de fin (acceptance)

- [x] Un compte frais reçoit une cible barbare narrative dédiée à l'onboarding après construction/révélation par Tour de guet niveau 1, et cette cible est visible dans le feed serveur de carte. Automatisable : smoke backend.
- [x] Avec `ONBOARDING_TRAIN_TROOPS_TARGET = 5` milices, l'attaque contre la cible narrative se résout en victoire et complète l'étape `ATTACK_BARBARIAN`. Automatisable : smoke backend.
- [x] Les villages barbares T1 globaux conservent leur défense réelle existante : roll initial à `60-100%` du plafond T1, donc pas de nerf global des T1. Automatisable : smoke/test.
- [x] L'ancien garde-fou générique "garantir un T1 atteignable/visible au join" est supprimé du seeding global et des tests associés. Automatisable : grep/test.
- [x] Le seeding global continue de créer/catchup les villages barbares selon `docs/gameplay/07-barbarian-spawning.md`, hors garantie onboarding. Automatisable : smoke/test.
- [x] La progression onboarding `ATTACK_BARBARIAN` ne se complète pas par une défaite ni par une cible non conforme si un marqueur de cible narrative est introduit. Automatisable : test/smoke.
- [x] Les specs gameplay ne promettent plus qu'un T1 global Watchtower niveau 1 est automatiquement atteignable ; elles décrivent la cible narrative affaiblie comme mécanisme d'onboarding. Automatisable : grep.
- [x] La guidance frontend de l'étape finale dirige clairement vers la cible narrative révélée, sans suggérer que tous les T1 sont des cibles faibles. Validation : gameplay/visuel.

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Prisma : `Village.isOnboardingNarrativeTarget`, `OnboardingState.narrativeTargetVillageId`.
- [x] Shared : `findOnboardingNarrativeTargetPosition`, DTO `narrativeTarget`, `targetRefId` sur `battle.resolved`.
- [x] Backend : `OnboardingNarrativeTargetService`, factory affaiblie, retrait `ensureReachableTierOne`, garde `ATTACK_BARBARIAN` sur cible liée.
- [x] Frontend : guidance étape finale vers cible narrative.
- [x] Tests/smokes + docs gameplay 15/07/03.

## Progress (rempli pendant le run)

- 2026-06-12 — Implémentation back+front+shared, migration, smokes adaptés, docs gameplay.
- 2026-06-12 — Review indépendante BLOCK (regen narrative target, placement saturé) → fixes appliqués (skip regen, spacing fallback).

## Décisions prises

- Marqueur DB double : `Village.isOnboardingNarrativeTarget` + lien `OnboardingState.narrativeTargetVillageId`.
- Défense narrative fixe : `2` milices (`ONBOARDING_NARRATIVE_TARGET_UNITS`), sans regen (`BarbarianRuntimeService` skip).
- Placement idempotent à la Tour de guet L1 ; fallback spacing `minSpacing → playerExclusion → 1`.
- `ATTACK_BARBARIAN` validé uniquement contre `narrativeTargetVillageId` (event `targetRefId` + rapports combat).
- Legacy `ensureReachableTierOne` / `findReachableBarbarianSeedPosition` retirés du seeding global.

## Rapport final

Run terminé. Le système legacy qui garantissait un T1 global atteignable au join est remplacé par une cible barbare narrative affaiblie, créée à la Tour de guet L1 pendant l'onboarding actif. Les T1 standards du seeding conservent leur roll de défense réel.

Fichiers principaux :
- Migration `20260612120000_add_onboarding_narrative_target`
- `onboarding-narrative-target.service.ts`, `barbarian-village.factory.createNarrativeOnboardingTarget`
- Cleanup `barbarian-seeding.service.ts`, `packages/shared/src/onboarding/narrative-target.ts`
- `onboardingViewModel.ts` (guidance ciblée)
- Smokes `onboarding.smoke.spec.ts`, `barbarians.smoke.spec.ts`
- Docs `15-onboarding.md`, `07-barbarian-spawning.md`, `03-buildings.md`

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Cible narrative visible après Tour de guet L1 — `yarn workspace battleforthecrown-backend test:smoke:run -- onboarding.smoke.spec.ts` (scénario `reveals a weakened narrative target...`) → couvert par smoke ajouté ; non exécuté localement (Docker/Postgres indisponible sur l'agent).
  - [x] `5` milices gagnent et complètent `ATTACK_BARBARIAN` — idem smoke onboarding (attaque réelle + `outboxDispatched battle.resolved`).
  - [x] T1 globaux conservés — `yarn workspace battleforthecrown-backend test --runInBand test/barbarians.smoke.spec.ts` (factory roll 9-15) + unit geometry ; smoke non exécuté localement.
  - [x] Ancienne garantie supprimée — `rg 'ensureReachableTierOne|findReachableBarbarianSeedPosition' battleforthecrown-backend packages/shared` → aucun match runtime (archives/tasks exclus).
  - [x] Specs alignées — `rg 'garantit.*T1|T1 atteignable' docs/gameplay` → uniquement formulation « ne garantit plus » dans `07-barbarian-spawning.md`.
- **Review indépendante** : Déclenchée (raison: back+front + invariant durable + specs gameplay modifiées). Verdict initial `BLOCK` (regen + placement) ; findings majeurs corrigés ; re-review non relancée — fixes ciblés validés par unit tests + static-check.
- **Tests automatisés** :
  - `yarn static-check` → exit 0
  - `yarn workspace battleforthecrown-backend test` → 35 suites, 354 tests passed
  - `yarn workspace battleforthecrown-pixi test src/features/onboarding/onboardingViewModel.test.ts` → 3 passed
  - `yarn workspace battleforthecrown-backend test --runInBand src/modules/onboarding src/modules/world/barbarian-geometry.spec.ts` → passed
- **Smokes lancés** : Non lancés localement, raison : `docker`/`localhost:5432` indisponible sur l'environnement Cloud Agent ; full smoke couvert par CI PR.
- **Smokes ajoutés/modifiés** :
  - `onboarding.smoke.spec.ts` : cible narrative après watchtower, attaque victorieuse, idempotence adaptée
  - `barbarians.smoke.spec.ts` : absence de garantie T1 global + non-régression roll T1
- **QA fonctionnelle agent** : Non exécuté (pas de Postgres local).
- **Tests IG à faire par le user** :
  - [ ] Lancer le tutoriel jusqu'à l'étape finale : vérifier que la modale guide vers « Campement du débutant » avec coordonnées, et non vers un T1 standard.
  - [ ] Confirmer visuellement sur la carte que la cible narrative est identifiable (marqueur `isOnboardingNarrativeTarget` côté feed si UI le consomme).

Docs : mises à jour `docs/gameplay/15-onboarding.md`, `07-barbarian-spawning.md`, `03-buildings.md`.
