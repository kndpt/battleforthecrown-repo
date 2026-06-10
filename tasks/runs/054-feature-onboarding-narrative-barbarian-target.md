# Run #054 — feature-onboarding-narrative-barbarian-target

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

- [ ] Un compte frais reçoit une cible barbare narrative dédiée à l'onboarding après construction/révélation par Tour de guet niveau 1, et cette cible est visible dans le feed serveur de carte. Automatisable : smoke backend.
- [ ] Avec `ONBOARDING_TRAIN_TROOPS_TARGET = 5` milices, l'attaque contre la cible narrative se résout en victoire et complète l'étape `ATTACK_BARBARIAN`. Automatisable : smoke backend.
- [ ] Les villages barbares T1 globaux conservent leur défense réelle existante : roll initial à `60-100%` du plafond T1, donc pas de nerf global des T1. Automatisable : smoke/test.
- [ ] L'ancien garde-fou générique "garantir un T1 atteignable/visible au join" est supprimé du seeding global et des tests associés. Automatisable : grep/test.
- [ ] Le seeding global continue de créer/catchup les villages barbares selon `docs/gameplay/07-barbarian-spawning.md`, hors garantie onboarding. Automatisable : smoke/test.
- [ ] La progression onboarding `ATTACK_BARBARIAN` ne se complète pas par une défaite ni par une cible non conforme si un marqueur de cible narrative est introduit. Automatisable : test/smoke.
- [ ] Les specs gameplay ne promettent plus qu'un T1 global Watchtower niveau 1 est automatiquement atteignable ; elles décrivent la cible narrative affaiblie comme mécanisme d'onboarding. Automatisable : grep.
- [ ] La guidance frontend de l'étape finale dirige clairement vers la cible narrative révélée, sans suggérer que tous les T1 sont des cibles faibles. Validation : gameplay/visuel.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

### Pré-découpage recommandé

- Clarifier le modèle de cible narrative : marqueur DB dédié, variante de village barbare, ou metadata onboarding ; lister impacts Prisma/API/tests avant codage.
- Backend onboarding : créer ou révéler la cible narrative au bon moment et la rattacher à l'état onboarding du premier village, de façon idempotente.
- Backend combat/progression : valider `ATTACK_BARBARIAN` sur victoire contre la cible attendue, avec loot positif et défense faible.
- Cleanup seeding global : retirer `ensureReachableTierOne`, `findReachableBarbarianSeedPosition` et adapter les tests de seeding.
- Frontend guidance : ajuster le texte/action de l'étape finale pour guider vers la cible narrative révélée.
- Specs/docs : backprop `15-onboarding`, `07-barbarian-spawning`, `06-barbarians` et éventuellement `03-buildings` pour séparer cible onboarding et barbares globaux.
- Tests/smokes : couvrir compte frais -> Tour de guet -> cible narrative visible -> attaque victorieuse ; couvrir la non-régression T1 global réel.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Cible narrative visible après Tour de guet L1 — `<commande smoke/test>` → <résultat observé>
  - [ ] `5` milices gagnent contre la cible narrative et complètent `ATTACK_BARBARIAN` — `<commande smoke/test>` → <résultat observé>
  - [ ] T1 globaux conservés comme adversaires réels — `<commande smoke/test>` → <résultat observé>
  - [ ] Ancienne garantie T1 atteignable supprimée du seeding global — `<commande grep/test>` → <résultat observé>
  - [ ] Specs alignées sur cible narrative vs seeding global — `<commande grep>` → <résultat observé>
- **Review indépendante** : `Déclenchée (raison: back+front + invariant durable + diff estimé > 100 lignes + specs gameplay modifiées)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : vérifier que la dernière étape du tutoriel guide bien vers une cible affaiblie/narrative et ne laisse pas croire qu'un T1 standard est trivial.

## Notes de cadrage

- Le problème actuel est un conflit de design : le tutoriel demande `5` milices, mais un T1 global naît avec `9-15` milices et reste un adversaire réel.
- Ne pas résoudre par un nerf global des T1 : `docs/gameplay/06-barbarians.md` pose les villages barbares comme des adversaires, pas comme des coffres gratuits.
- La promesse "première victoire garantie" appartient à l'onboarding, pas au seeding global.
- Attention à l'idempotence : un rejoin/login ne doit pas créer plusieurs cibles narratives ni doubler loot/récompense.
- Si un champ persistant est ajouté pour typer la cible narrative, prévoir migration + backfill neutre pour les villages existants.

## Liens détectés

- À faire avant : Aucun.
- À faire après : Aucun.
- Doublon potentiel : Aucun.
- Connexe :
  - [`035-fix-early-barbarian-reachability`](./archive/035-fix-early-barbarian-reachability.md) — système actuel à supprimer/remplacer.
  - [`036-feature-scripted-onboarding-runtime`](./archive/036-feature-scripted-onboarding-runtime.md) — runtime onboarding à adapter.
  - [`007-audit-barbarian-spawning`](./archive/007-audit-barbarian-spawning.md) — politique globale de seeding à préserver.
- Déjà résolu : Aucun.
- Keywords scannés : `onboarding`, `barbare`, `barbarian`, `T1`, `watchtower`, `seeding`, `garantie`, `tutorial`, `tutoriel`, `campement`.
