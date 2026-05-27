# Run #039 — integrate-army-view-design-system

> **Statut** : DONE
> **Démarré** : 2026-05-27
> **Terminé** : 2026-05-27

## Cible

- **Phase roadmap** : Hors roadmap
- **Spec source** : [`docs/gameplay/08-units.md`](../../../docs/gameplay/08-units.md) § Mécanique d'entraînement ; [`docs/gameplay/03-buildings.md`](../../../docs/gameplay/03-buildings.md) § Caserne
- **Type** : feature
- **Modules backend** : —
- **Modules frontend** : `pixi/features/army`, `pixi/features/design-system/components`

## Dépendances

- Aucune dépendance bloquante.
- Contexte à préserver :
  - [`028 — Bonus de vitesse d'entraînement de la Caserne`](./028-barracks-training-speed-bonus.md) — conserver les durées effectives avec `barracksLevel` + tempo.
  - [`031 — Sélecteur multi-village en bottom sheet`](./031-feature-multi-village-bottom-sheet-selector.md) — exemple d'intégration design-system runtime avec données réelles uniquement.
  - [`51 — Standardiser les bottom sheets`](../../archive/51-bottom-sheet-design-system-base.md) — cohérence visuelle des bottom sheets.
  - [`44 — Crash armée : migration unit_training.building`](../../archive/44-army-training-schema-drift.md) — rappel des smokes endpoints armée.
  - [`47 — Queue visuelle de formation du Noble`](../../archive/47-noble-training-visual-queue-missing.md) — ne pas régresser le Noble, qui reste hors Caserne.
  - [`audit 11 — Optimistic UI training`](../../../docs/architecture/audit/11-pixi-optimistic-ui-asymmetric.md) — préserver l'apparition instantanée de la file.
  - [`audit 21 — Décalage visuel training`](../../../docs/architecture/audit/21-pixi-training-completion-visual-lag.md) — préserver la progression extrapolée et le refetch de fin.

## Critère de fin (acceptance)

- [x] `/game/army` rend la vue armée design-system avec des données issues de `useArmyInventoryQuery`, `useArmyTrainingQuery`, `useGarrisonQuery`, ressources et population réelles, sans fixtures du preview.
- [x] Les unités verrouillées restent verrouillées selon `requiredBarracksLevel`; `NOBLE` n'est pas proposé au recrutement Caserne.
- [x] Le max recrutable tient compte des ressources et de la population réelle, puis appelle `useTrainUnitsMutation({ villageId, unitType, quantity })`.
- [x] Après lancement d'un entraînement, l'optimistic training apparaît immédiatement dans la file et les invalidations existantes restent actives.
- [x] Les durées affichées utilisent `getEffectiveUnitTrainingDurationSeconds` avec `worldTempo` + `barracksLevel`.
- [x] Pendant un vrai drag, la drop zone de recrutement devient active ; au drop, le bottom sheet de recrutement s'ouvre pour la troupe glissée.
- [x] Aucun état drag actif n'est ajouté comme route/vue séparée ; l'URL reste `/game/army`.
- [x] Les données `alliés` / `envoyés` du preview ne sont pas inventées ; seules les lignes disponibles via `useGarrisonQuery` sont affichées ou explicitement neutralisées.
- [x] Sur mobile, le bottom sheet de recrutement est lisible, scrollable, et ne masque pas de façon incohérente la navigation.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`
- Design-system migration : skill `bftc-design-system-migration`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Étendre le composant design-system armée pour supporter un vrai drag/drop runtime et un popup de recrutement borné par `max=0`.
  - Fichiers : `battleforthecrown-pixi/src/features/design-system/components/ArmyViewDesign.tsx`, `ArmyViewDesign.utils.ts`.
  - Critère : la drop zone lit un `troopId` de drag réel, le popup ne recrute jamais au-delà du max calculé.
- [x] Créer une couche d'adaptation runtime testable entre DTO armée/garnison/ressources/population et `ArmyViewDesign`.
  - Fichiers : `battleforthecrown-pixi/src/features/army/armyViewModel.ts`, test associé.
  - Critère : `NOBLE` exclu, locked states par `requiredBarracksLevel`, durées effectives tempo + Caserne, alliés/envoyés seulement depuis `useGarrisonQuery`.
- [x] Remplacer `/game/army` par la composition design-system branchée sur les hooks/mutations réels.
  - Fichiers : `battleforthecrown-pixi/src/features/army/ArmyScreen.tsx`.
  - Critère : `useTrainUnitsMutation({ villageId, unitType, quantity })`, optimistic queue existante visible, URL inchangée.
- [x] Vérifier type-check/test/static-check, inspecter l'écran en navigateur, puis archiver la run.

## Progress (rempli pendant le run)

- [x] Préflight repris avec caveat user : `tasks/todo.md` était déjà modifié par un diagnostic DB et doit être préservé.
- [x] Règles chargées : conventions/docs/git, `SPEC.md`, `battleforthecrown-pixi/AGENTS.md`, skills `bftc-react-hud`, `bftc-design-system-migration`, `bftc-tests-policy`, `bftc-qa`.
- [x] Spec source lue : `docs/gameplay/08-units.md` § Mécanique d'entraînement et `docs/gameplay/03-buildings.md` § Caserne.
- [x] Cartographie : `ArmyScreen` orchestre hooks runtime ; `UnitCard` contient max/resources/mutation ; `ArmyViewDesign` fournit la vue cible mais son drag preview est fixe.
- [x] Implémentation : `ArmyScreen` consomme `ArmyViewDesign` avec hooks runtime ; `armyViewModel` porte les mappings testables ; `ArmyRecruitPopup` appelle `useTrainUnitsMutation`.
- [x] Vérifications intermédiaires : `yarn workspace battleforthecrown-pixi type-check`, `yarn workspace battleforthecrown-pixi test -- armyViewModel`, `yarn workspace battleforthecrown-pixi test`, `yarn static-check`.
- [x] Correction user : le shell runtime existant (`GameHeader`, village bar, `BottomNavigationBar`) est conservé ; seul le contenu Army est remplacé.
- [x] Correction user : le recrutement utilise `GameBottomSheetPanel` avec `ArmyRecruitPopup embedded`, sans double top/handle/bordure.
- [x] Correction review : le drag actif démarre uniquement sur un vrai `dragstart`, pas sur `pointerdown`/`mousedown`.
- [x] Correction review : les actions de garnison `Renvoyer`/`Rappeler` sont conservées via un bottom sheet dédié aux troupes alliées/envoyées.
- [x] Vérifications finales : `rtk yarn workspace battleforthecrown-pixi type-check`, `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel`, `rtk yarn workspace battleforthecrown-pixi test`, `rtk yarn static-check`.

## Décisions prises

- Caveat préflight : worktree non clean accepté explicitement par le user (`tasks/todo.md` dirty avant run). Ne pas effacer ces lignes ; les inclure ou les préserver lors du commit final selon le diff réel.
- Adapter via un view-model pur plutôt que dupliquer la logique dans `ArmyScreen`, pour tester les invariants data sans snapshot DOM.
- Ne pas intégrer le prototype complet `ArmyViewDesign` dans le runtime : ses top bar/village bar/bottom nav restent preview-only. Le runtime consomme `ArmyContentDesign` sous le shell existant.
- Le popup de recrutement a un mode `embedded` pour éviter un double chrome lorsqu'il est rendu dans `GameBottomSheetPanel`; le preview conserve son chrome standalone.

## Rapport final

Intégration runtime de la vue Armée design-system limitée au contenu Army, sans remplacer le shell `/game/army` existant. Ajout d'un view-model pur pour mapper inventaire, trainings, garnison, ressources, population et tempo vers les props design-system, avec tests ciblés. Le recrutement passe par le bottom sheet design-system existant et appelle la mutation réelle. Les renforts alliés/envoyés restent pilotables via `Renvoyer`/`Rappeler`.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Vue runtime sans fixtures preview — `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel` → props issues des DTO/hooks réels, `NOBLE` exclu.
  - [x] `NOBLE` hors recrutement Caserne et locked states corrects — `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel` → 4 tests verts.
  - [x] Max recrutable réel + mutation `useTrainUnitsMutation` — `rtk yarn workspace battleforthecrown-pixi type-check` + lecture `ArmyScreen.tsx` → mutation `{ villageId, unitType, quantity }`.
  - [x] Optimistic training et progression conservés — `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel` → queue/progression extrapolée depuis `computeUnitTrainingProgress`.
  - [x] Durées effectives `worldTempo` + `barracksLevel` — `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel` → durée testée avec `unitTrainingSpeed`.
  - [x] Drag réel vers drop zone, URL inchangée `/game/army` — `rtk yarn workspace battleforthecrown-pixi type-check` + inspection browser `http://localhost:5174/game/army` → shell existant présent, pas de route drag.
  - [x] Pas de données alliés/envoyés inventées — `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel` → compteurs uniquement depuis `useGarrisonQuery`.
  - [x] Bottom sheet mobile lisible et scrollable — inspection browser + `GameBottomSheetPanel scrollable`, popup `embedded` → pas de double chrome.
- **Review indépendante** : `Déclenchée (raison: diff > 100 lignes + invariant durable UX/data)` ; premier verdict `BLOCK`, findings résolus (`dragstart` strict, actions garnison, fallback quantité, sheet embedded). Re-review finale `GO`, aucun bloquant/majeur.
- **Tests automatisés** : `rtk yarn workspace battleforthecrown-pixi type-check` ✅ ; `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel` ✅ ; `rtk yarn workspace battleforthecrown-pixi test` ✅ (41 fichiers, 211 tests) ; `rtk yarn static-check` ✅.
- **Smokes ajoutés/modifiés** : Aucun smoke backend, scope frontend runtime + view-model.
- **QA fonctionnelle agent** : backend/frontend run 039 ouverts sur `http://localhost:15002` et `http://localhost:5174`; inspection in-app browser de `/game/army` confirmant `GameHeader`/bottom nav runtime et contenu Army design-system.
- **Tests IG à faire par le user** : vérifier visuellement le drag mobile/souris et le feeling du sheet recrutement sur un vrai geste utilisateur.

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
  - [`tasks/runs/archive/028-barracks-training-speed-bonus.md`](./028-barracks-training-speed-bonus.md) — conserver les durées effectives avec `barracksLevel` + tempo.
  - [`tasks/runs/archive/031-feature-multi-village-bottom-sheet-selector.md`](./031-feature-multi-village-bottom-sheet-selector.md) — intégration design-system runtime avec données réelles uniquement.
  - [`tasks/archive/51-bottom-sheet-design-system-base.md`](../../archive/51-bottom-sheet-design-system-base.md) — cohérence des bottom sheets.
- Déjà résolu (archive) :
  - [`tasks/archive/44-army-training-schema-drift.md`](../../archive/44-army-training-schema-drift.md) — endpoints armée à garder smokeables.
  - [`tasks/archive/47-noble-training-visual-queue-missing.md`](../../archive/47-noble-training-visual-queue-missing.md) — Noble à ne pas régresser, hors Caserne.
  - [`docs/architecture/audit/11-pixi-optimistic-ui-asymmetric.md`](../../../docs/architecture/audit/11-pixi-optimistic-ui-asymmetric.md) — optimistic training à préserver.
  - [`docs/architecture/audit/21-pixi-training-completion-visual-lag.md`](../../../docs/architecture/audit/21-pixi-training-completion-visual-lag.md) — progression training à préserver.
- Keywords scannés : `army`, `armee`, `recruit`, `recrutement`, `training`, `caserne`, `barracks`, `drag`, `drop`, `bottom-sheet`.
