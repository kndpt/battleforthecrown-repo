# Run #036 — feature-scripted-onboarding-runtime

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 8 — Onboarding
- **Spec source** : [`docs/gameplay/15-onboarding.md`](../../docs/gameplay/15-onboarding.md) + [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md#phase-8--onboarding)
- **Type** : `feature`
- **Modules backend** : `world/join-world`, nouveau module `onboarding`, `event/outbox`, `resources`, `crowns`
- **Modules frontend** : `pixi/api`, `pixi/ws-bindings`, nouveau `features/onboarding`, intégration HUD/village/world/armée selon CTA

## Dépendances

- **Bloquant** : le run [`035-fix-early-barbarian-reachability`](./035-fix-early-barbarian-reachability.md) doit être `DONE` avant de démarrer ce run. L'onboarding scripté dépend de l'invariant "Watchtower niveau 1 révèle au moins un T1 attaquable".
- Runs gameplay déjà livrés à consommer sans les réimplémenter : conquête/attaque barbare [`018`](./archive/018-feature-barbarian-conquest-backend-shared.md) / [`019`](./archive/019-feature-barbarian-conquest-frontend-ui.md), Caserne [`028`](./archive/028-barracks-training-speed-bonus.md), Watchtower [`45`](../archive/45-watchtower-finite-vision.md), Château visuel [`030`](./archive/030-feature-world-map-village-sprites-by-castle-level.md).
- Ticket [`71`](../archive/71-fix-starting-resources-defaults.md) déjà résolu : ne pas confondre stock initial `1000/1000/1000` et récompense onboarding `+850/+850/+850 +100 couronnes`.

## Critère de fin (acceptance)

- [ ] À la création du premier village d'un user/world, un état onboarding est créé une seule fois et la récompense initiale `+850 bois`, `+850 pierre`, `+850 fer`, `+100 couronnes` est appliquée une seule fois.
- [ ] Une API server-authoritative expose l'étape courante, les étapes terminées, la récompense initiale appliquée et le statut `ACTIVE|COMPLETED`.
- [ ] Le parcours scripté suit les étapes validées : upgrade Château niveau 2 -> créer Caserne -> créer des troupes -> créer Tour de guet -> attaquer un village barbare.
- [ ] La progression avance uniquement depuis des faits gameplay serveur : `building.completed` pour Château/Caserne/Watchtower, `unit.trained` pour les troupes, `battle.resolved` pour l'attaque barbare.
- [ ] La projection est idempotente : rejouer deux fois le même event ne double ni progression ni récompense.
- [ ] Les events existants rafraîchissent l'état onboarding côté frontend sans reload manuel.
- [ ] Le frontend affiche une guidance visible pour l'étape courante avec CTA vers l'écran/action pertinente.
- [ ] Un compte frais peut terminer le parcours guidé en session courte cible `<= 10 min` sous tempo MVP standard.
- [ ] Une fois `COMPLETED`, l'onboarding ne se recrée pas au prochain login/join du même world.
- [ ] Les smokes retention/daily cards restent verts et ne confondent pas progression daily card et progression onboarding.

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
  - [ ] État onboarding + récompense unique — `rtk yarn workspace battleforthecrown-backend test <test ciblé>` ou smoke SQL/API -> résultat observé.
  - [ ] API onboarding server-authoritative — `curl` ou test controller/use-case -> résultat observé.
  - [ ] Progression sur `building.completed`, `unit.trained`, `battle.resolved` — `rtk yarn workspace battleforthecrown-backend test <test ciblé>` -> résultat observé.
  - [ ] Idempotence projection — test ciblé -> résultat observé.
  - [ ] Frontend guidance + invalidations WS — `rtk yarn workspace battleforthecrown-pixi test <tests ciblés>` -> résultat observé.
  - [ ] Parcours complet compte frais <= 10 min — smoke/backend ou QA gameplay documentée -> résultat observé.
- **Review indépendante** : `Déclenchée (raison: back+front + invariant durable + diff estimé > 100 lignes)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : scénario compte frais avec récompense, progression d'étapes et attaque barbare. Ne pas exécuter avant que le run 035 soit `DONE`.
- **Tests IG à faire par le user** : vérifier le ressenti des CTA et de la guidance visuelle en première session.

## Notes de cadrage

- Le parcours retenu remplace l'esquisse précédente qui mentionnait un scout : pour ce run, le script MVP est centré sur économie -> bâtiment militaire -> troupes -> exploration Watchtower -> attaque barbare.
- La récompense onboarding est distincte du stock initial de join. Si le stock initial reste `1000/1000/1000`, le total attendu après récompense est `1850/1850/1850` sauf décision explicite contraire pendant le run.
- Ne pas implémenter l'onboarding comme une daily card déguisée. Le module peut réutiliser des patterns techniques de projection Outbox, mais l'état et les critères d'étapes doivent rester dédiés.
- Le run 035 porte l'invariant géométrique "T1 attaquable avec Watchtower L1"; ce run doit seulement le consommer.

## Liens détectés

- À faire avant : [`035-fix-early-barbarian-reachability`](./035-fix-early-barbarian-reachability.md) — garantit la cible barbare T1 atteignable requise par l'étape finale.
- À faire après : Aucun.
- Doublon potentiel : Aucun.
- Connexe : [`tasks/runs/archive/018-feature-barbarian-conquest-backend-shared.md`](./archive/018-feature-barbarian-conquest-backend-shared.md), [`tasks/runs/archive/019-feature-barbarian-conquest-frontend-ui.md`](./archive/019-feature-barbarian-conquest-frontend-ui.md), [`tasks/runs/archive/028-barracks-training-speed-bonus.md`](./archive/028-barracks-training-speed-bonus.md), [`tasks/archive/45-watchtower-finite-vision.md`](../archive/45-watchtower-finite-vision.md), [`tasks/runs/archive/030-feature-world-map-village-sprites-by-castle-level.md`](./archive/030-feature-world-map-village-sprites-by-castle-level.md), [`tasks/archive/71-fix-starting-resources-defaults.md`](../archive/71-fix-starting-resources-defaults.md).
- Déjà résolu : Aucun.
- Keywords scannés : `onboarding`, `reward`, `crowns`, `castle`, `barracks`, `troops`, `watchtower`, `barbarian`.
