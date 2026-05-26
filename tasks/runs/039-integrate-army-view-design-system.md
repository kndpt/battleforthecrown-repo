# Run #039 — integrate-army-view-design-system

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap
- **Spec source** : [`docs/gameplay/08-units.md`](../../docs/gameplay/08-units.md) § Mécanique d'entraînement ; [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md) § Caserne
- **Type** : feature
- **Modules backend** : —
- **Modules frontend** : `pixi/features/army`, `pixi/features/design-system/components`

## Dépendances

- Aucune dépendance bloquante.
- Contexte à préserver :
  - [`028 — Bonus de vitesse d'entraînement de la Caserne`](./archive/028-barracks-training-speed-bonus.md) — conserver les durées effectives avec `barracksLevel` + tempo.
  - [`031 — Sélecteur multi-village en bottom sheet`](./archive/031-feature-multi-village-bottom-sheet-selector.md) — exemple d'intégration design-system runtime avec données réelles uniquement.
  - [`51 — Standardiser les bottom sheets`](../archive/51-bottom-sheet-design-system-base.md) — cohérence visuelle des bottom sheets.
  - [`44 — Crash armée : migration unit_training.building`](../archive/44-army-training-schema-drift.md) — rappel des smokes endpoints armée.
  - [`47 — Queue visuelle de formation du Noble`](../archive/47-noble-training-visual-queue-missing.md) — ne pas régresser le Noble, qui reste hors Caserne.
  - [`audit 11 — Optimistic UI training`](../../docs/architecture/audit/11-pixi-optimistic-ui-asymmetric.md) — préserver l'apparition instantanée de la file.
  - [`audit 21 — Décalage visuel training`](../../docs/architecture/audit/21-pixi-training-completion-visual-lag.md) — préserver la progression extrapolée et le refetch de fin.

## Critère de fin (acceptance)

- [ ] `/game/army` rend la vue armée design-system avec des données issues de `useArmyInventoryQuery`, `useArmyTrainingQuery`, `useGarrisonQuery`, ressources et population réelles, sans fixtures du preview.
- [ ] Les unités verrouillées restent verrouillées selon `requiredBarracksLevel`; `NOBLE` n'est pas proposé au recrutement Caserne.
- [ ] Le max recrutable tient compte des ressources et de la population réelle, puis appelle `useTrainUnitsMutation({ villageId, unitType, quantity })`.
- [ ] Après lancement d'un entraînement, l'optimistic training apparaît immédiatement dans la file et les invalidations existantes restent actives.
- [ ] Les durées affichées utilisent `getEffectiveUnitTrainingDurationSeconds` avec `worldTempo` + `barracksLevel`.
- [ ] Pendant un vrai drag, la drop zone de recrutement devient active ; au drop, le bottom sheet de recrutement s'ouvre pour la troupe glissée.
- [ ] Aucun état drag actif n'est ajouté comme route/vue séparée ; l'URL reste `/game/army`.
- [ ] Les données `alliés` / `envoyés` du preview ne sont pas inventées ; seules les lignes disponibles via `useGarrisonQuery` sont affichées ou explicitement neutralisées.
- [ ] Sur mobile, le bottom sheet de recrutement est lisible, scrollable, et ne masque pas de façon incohérente la navigation.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`
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
  - [ ] Vue runtime sans fixtures preview — `test/grep` → à remplir.
  - [ ] `NOBLE` hors recrutement Caserne et locked states corrects — `test` → à remplir.
  - [ ] Max recrutable réel + mutation `useTrainUnitsMutation` — `test` → à remplir.
  - [ ] Optimistic training et progression conservés — `test/smoke` → à remplir.
  - [ ] Durées effectives `worldTempo` + `barracksLevel` — `test` → à remplir.
  - [ ] Drag réel vers drop zone, URL inchangée `/game/army` — `visuel/gameplay + test/grep` → à remplir.
  - [ ] Pas de données alliés/envoyés inventées — `test/grep` → à remplir.
  - [ ] Bottom sheet mobile lisible et scrollable — `visuel` → à remplir.
- **Review indépendante** : `Déclenchée (raison: diff estimé > 100 lignes + invariant durable UX/data)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : à remplir.
- **Smokes ajoutés/modifiés** : à remplir.
- **QA fonctionnelle agent** : à remplir.
- **Tests IG à faire par le user** : à remplir.

## Notes de cadrage

- Le preview `ArmyDraggingOverlay` est une démonstration visuelle. En runtime, le drag actif doit devenir un état transitoire déclenché par une vraie interaction drag & drop sur `/game/army`, pas une route ni une view dédiée.
- Piste recommandée : créer une couche d'adaptation runtime qui mappe les DTO/hooks existants vers `ArmyViewDesign`, puis brancher `ArmyRecruitPopup` sur `useTrainUnitsMutation`.
- Le composant `ArmyViewDesign` embarque un HUD, une village bar et une bottom nav de preview. Le refinement doit décider s'il faut étendre son API runtime ou conserver certains wrappers runtime existants pour éviter de dupliquer le shell.
- Les positions fixes du preview drag doivent être remplacées par un état d'interaction réel.
- `ArmyRecruitStock.population` doit être mappé prudemment à la sémantique runtime `available / used / max`.
- Ne pas inventer les données `alliés` / `envoyés` visibles dans le prototype : mapper uniquement ce que `useGarrisonQuery` expose réellement ou neutraliser explicitement.
- Le run doit rester une intégration production-usable : données réelles, mutation réelle, progression réelle, pas seulement un remplacement visuel.

## Liens détectés

- À faire avant : Aucun.
- À faire après : Aucun.
- Doublon potentiel : Aucun.
- Connexe (contexte) :
  - [`tasks/runs/archive/028-barracks-training-speed-bonus.md`](./archive/028-barracks-training-speed-bonus.md) — conserver les durées effectives avec `barracksLevel` + tempo.
  - [`tasks/runs/archive/031-feature-multi-village-bottom-sheet-selector.md`](./archive/031-feature-multi-village-bottom-sheet-selector.md) — intégration design-system runtime avec données réelles uniquement.
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) — cohérence des bottom sheets.
- Déjà résolu (archive) :
  - [`tasks/archive/44-army-training-schema-drift.md`](../archive/44-army-training-schema-drift.md) — endpoints armée à garder smokeables.
  - [`tasks/archive/47-noble-training-visual-queue-missing.md`](../archive/47-noble-training-visual-queue-missing.md) — Noble à ne pas régresser, hors Caserne.
  - [`docs/architecture/audit/11-pixi-optimistic-ui-asymmetric.md`](../../docs/architecture/audit/11-pixi-optimistic-ui-asymmetric.md) — optimistic training à préserver.
  - [`docs/architecture/audit/21-pixi-training-completion-visual-lag.md`](../../docs/architecture/audit/21-pixi-training-completion-visual-lag.md) — progression training à préserver.
- Keywords scannés : `army`, `armee`, `recruit`, `recrutement`, `training`, `caserne`, `barracks`, `drag`, `drop`, `bottom-sheet`.
