# Run #036 — feature-scripted-onboarding-runtime

> **Statut** : DONE
> **Démarré** : 2026-05-26 10:52 CEST
> **Terminé** : 2026-05-26 11:37 CEST

## Cible

- **Phase roadmap** : Phase 8 — Onboarding
- **Spec source** : [`docs/gameplay/15-onboarding.md`](../../../docs/gameplay/15-onboarding.md) + [`tasks/00-mvp-roadmap.md`](../../00-mvp-roadmap.md#phase-8--onboarding)
- **Type** : `feature`
- **Modules backend** : `world/join-world`, nouveau module `onboarding`, `event/outbox`, `resources`, `crowns`
- **Modules frontend** : `pixi/api`, `pixi/ws-bindings`, nouveau `features/onboarding`, intégration HUD/village/world/armée selon CTA

## Dépendances

- **Bloquant** : le run [`035-fix-early-barbarian-reachability`](./035-fix-early-barbarian-reachability.md) doit être `DONE` avant de démarrer ce run. L'onboarding scripté dépend de l'invariant "Watchtower niveau 1 révèle au moins un T1 attaquable".
- Runs gameplay déjà livrés à consommer sans les réimplémenter : conquête/attaque barbare [`018`](./018-feature-barbarian-conquest-backend-shared.md) / [`019`](./019-feature-barbarian-conquest-frontend-ui.md), Caserne [`028`](./028-barracks-training-speed-bonus.md), Watchtower [`45`](../../archive/45-watchtower-finite-vision.md), Château visuel [`030`](./030-feature-world-map-village-sprites-by-castle-level.md).
- Ticket [`71`](../../archive/71-fix-starting-resources-defaults.md) déjà résolu : ne pas confondre stock initial `1000/1000/1000` et récompense onboarding `+850/+850/+850 +100 couronnes`.

## Critère de fin (acceptance)

- [x] À la création du premier village d'un user/world, un état onboarding est créé une seule fois et la récompense initiale `+850 bois`, `+850 pierre`, `+850 fer`, `+100 couronnes` est appliquée une seule fois.
- [x] Une API server-authoritative expose l'étape courante, les étapes terminées, la récompense initiale appliquée et le statut `ACTIVE|COMPLETED`.
- [x] Le parcours scripté suit les étapes validées : upgrade Château niveau 2 -> créer Caserne -> créer des troupes -> créer Tour de guet -> attaquer un village barbare.
- [x] La progression avance uniquement depuis des faits gameplay serveur : `building.completed` pour Château/Caserne/Watchtower, `unit.trained` pour les troupes, `battle.resolved` pour l'attaque barbare.
- [x] La projection est idempotente : rejouer deux fois le même event ne double ni progression ni récompense.
- [x] Les events existants rafraîchissent l'état onboarding côté frontend sans reload manuel.
- [x] Le frontend affiche une guidance visible pour l'étape courante avec CTA vers l'écran/action pertinente.
- [x] Un compte frais peut terminer le parcours guidé en session courte cible `<= 10 min` sous tempo MVP standard.
- [x] Une fois `COMPLETED`, l'onboarding ne se recrée pas au prochain login/join du même world.
- [x] Les smokes retention/daily cards restent verts et ne confondent pas progression daily card et progression onboarding.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Cartographie backend/shared/frontend : join world, events gameplay, resources/crowns, Outbox, API Pixi, WS bindings, HUD.
- [x] Refinement : découper les changements en tranches ≤ 5 fichiers avec critères observables.
- [x] Backend/shared : modèle/projection onboarding, récompense idempotente, API server-authoritative, events.
- [x] Frontend : client API, cache/WS invalidation, guidance HUD visible avec CTA.
- [x] Tests/QA : tests ciblés, smokes backend, static-check, checklist IG.
- [x] Review/docs/archive/commit : review indépendante obligatoire, docs impact, archive run et commit unique.

## Progress (rempli pendant le run)

- 2026-05-26 10:52 CEST — Préflight validé : worktree clean, run 035 archivée `DONE`, règles/specs/skills chargés. Plan initial inscrit dans `tasks/todo.md`.
- 2026-05-26 11:07 CEST — Implémentation backend/shared/frontend livrée. Tests ciblés verts : unit backend onboarding, Vitest onboarding/ws-bindings, smokes ciblés onboarding/world-membership/daily-retention. Migration appliquée sur DB dev et smoke.
- 2026-05-26 11:37 CEST — Review indépendante passée de `BLOCK` à `GO` après corrections ; `static-check`, smoke backend complet et suite Pixi complète verts.

## Décisions prises

- État onboarding dédié `userId × worldId`, distinct des daily cards, avec projection depuis Outbox plutôt qu'une logique client.
- Récompense initiale appliquée dans la transaction de création du premier village et capée par le stockage.
- Invalidation frontend onboarding limitée aux faits qui peuvent progresser le script (`building.completed`, `unit.trained`, `battle.resolved`) pour éviter les refetchs sur ticks ressources/couronnes.
- Le budget `<= 10 min` inclut le prérequis runtime Château 3 nécessaire à la Tour de guet, même si l'étape de progression reste "Tour de guet construite".

## Rapport final

Livré :

- Backend/shared : modèles Prisma `OnboardingState`, `OnboardingStepProgress`, `OnboardingProgressEvent`, endpoint `GET /onboarding`, DTO/Zod shared, projection Outbox idempotente et récompense initiale `+850/+850/+850 +100`.
- Frontend Pixi : query onboarding, invalidations WS ciblées, guidance HUD avec CTA sur village, armée et world map.
- Docs : gameplay onboarding, modules backend, data model, realtime et invariant SPEC V4 alignés.
- Aucun ticket follow-up ouvert.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] État onboarding + récompense unique — `rtk yarn workspace battleforthecrown-backend test:smoke:run onboarding.smoke.spec.ts world-membership.smoke.spec.ts daily-retention.smoke.spec.ts` -> 3 suites, 4 tests passés.
  - [x] API onboarding server-authoritative — `onboarding.smoke.spec.ts` appelle `GET /onboarding` et vérifie statut, étape courante et récompense.
  - [x] Progression sur `building.completed`, `unit.trained`, `battle.resolved` — `onboarding.smoke.spec.ts` rejoue les facts Outbox et observe `COMPLETED`.
  - [x] Idempotence projection — `onboarding.smoke.spec.ts` rejoue `battle.resolved` et vérifie un seul progress `ATTACK_BARBARIAN`.
  - [x] Frontend guidance + invalidations WS — `rtk yarn workspace battleforthecrown-pixi test --run src/api/ws-bindings.test.ts src/features/onboarding/onboardingViewModel.test.ts` -> 2 fichiers, 29 tests passés.
  - [x] Parcours complet compte frais <= 10 min — `onboarding.smoke.spec.ts` calcule le chemin critique avec constantes runtime, y compris le prérequis Château 3, et vérifie `<= 10 min`.
- **Review indépendante** : déclenchée (raison: back+front + invariant durable + diff > 100 lignes). Verdict initial `BLOCK`, findings corrigés, re-review `GO`.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-backend test --runInBand src/modules/onboarding/onboarding.service.spec.ts` -> 1 suite, 2 tests passés.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run onboarding.smoke.spec.ts world-membership.smoke.spec.ts daily-retention.smoke.spec.ts` -> 3 suites, 4 tests passés.
  - `rtk yarn static-check` -> passé.
  - `rtk yarn workspace battleforthecrown-backend test:smoke` -> 25 suites, 52 tests passés.
  - `rtk yarn workspace battleforthecrown-pixi test` -> première passe flaky `GameHeader`, test isolé vert, relance complète verte : 35 fichiers, 191 tests passés.
- **Smokes ajoutés/modifiés** :
  - `battleforthecrown-backend/test/onboarding.smoke.spec.ts` — récompense unique, API, progression séquentielle, idempotence, rejoin post-completion, séparation daily cards, budget temps.
  - `battleforthecrown-backend/test/world-membership.smoke.spec.ts` — reset wipe onboarding puis rejoin avec récompense réappliquée une fois.
- **QA fonctionnelle agent** : backend/front locaux démarrés sur DB isolée `battleforthecrown_7e47` ; health backend `http://localhost:15003/health` OK, frontend `http://localhost:5175/` OK.
- **Tests IG à faire par le user** : vérifier en première session que la guidance est lisible, que chaque CTA mène à l'écran attendu, et que l'étape Tour de guet reste compréhensible si le Château 3 est encore requis.

## Notes de cadrage

- Le parcours retenu remplace l'esquisse précédente qui mentionnait un scout : pour ce run, le script MVP est centré sur économie -> bâtiment militaire -> troupes -> exploration Watchtower -> attaque barbare.
- La récompense onboarding est distincte du stock initial de join. Si le stock initial reste `1000/1000/1000`, le total attendu après récompense est `1850/1850/1850` sauf décision explicite contraire pendant le run.
- Ne pas implémenter l'onboarding comme une daily card déguisée. Le module peut réutiliser des patterns techniques de projection Outbox, mais l'état et les critères d'étapes doivent rester dédiés.
- Le run 035 porte l'invariant géométrique "T1 attaquable avec Watchtower L1"; ce run doit seulement le consommer.

## Liens détectés

- À faire avant : [`035-fix-early-barbarian-reachability`](./035-fix-early-barbarian-reachability.md) — garantit la cible barbare T1 atteignable requise par l'étape finale.
- À faire après : Aucun.
- Doublon potentiel : Aucun.
- Connexe : [`tasks/runs/archive/018-feature-barbarian-conquest-backend-shared.md`](./018-feature-barbarian-conquest-backend-shared.md), [`tasks/runs/archive/019-feature-barbarian-conquest-frontend-ui.md`](./019-feature-barbarian-conquest-frontend-ui.md), [`tasks/runs/archive/028-barracks-training-speed-bonus.md`](./028-barracks-training-speed-bonus.md), [`tasks/archive/45-watchtower-finite-vision.md`](../../archive/45-watchtower-finite-vision.md), [`tasks/runs/archive/030-feature-world-map-village-sprites-by-castle-level.md`](./030-feature-world-map-village-sprites-by-castle-level.md), [`tasks/archive/71-fix-starting-resources-defaults.md`](../../archive/71-fix-starting-resources-defaults.md).
- Déjà résolu : Aucun.
- Keywords scannés : `onboarding`, `reward`, `crowns`, `castle`, `barracks`, `troops`, `watchtower`, `barbarian`.
