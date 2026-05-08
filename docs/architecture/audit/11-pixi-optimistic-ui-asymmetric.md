# 11 — Optimistic UI appliqué de manière asymétrique côté frontend

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : ux, optimistic-ui, consistency

## Symptôme

Certaines mutations frontend utilisent le pattern optimistic UI (snapshot + apply local + rollback), d'autres non, sans logique apparente. Le ressenti UX varie d'une feature à l'autre : feedback instantané sur l'upgrade de bâtiment, latence visible sur le démarrage d'entraînement.

## Localisation

- `src/api/queries.ts:527-572` — `useUpgradeBuildingMutation()` : optimistic complet (snapshot queue + resources, applique optimistic entry, rollback en `onError`).
- `src/features/army/UnitCard.tsx:134-150` — `useTrainUnitsMutation()` : aucune `onMutate`. Mutation classique, le user attend la réponse du serveur avant de voir l'unit dans la file.
- À auditer : autres mutations (`useChangeStrategyMutation`, `useCancelBuildingMutation`, `useInitiateAttackMutation`, `useMarkReportReadMutation`).

Côté error handling, aussi asymétrique :
- `BuildingDetailModal.tsx:162-166` : `setState(error)` + display inline.
- `UnitCard.tsx:142-148` : `pushToast(error)`.

## Détail technique

L'optimistic UI a un coût :
1. **Snapshot** des données potentiellement affectées.
2. **Mutation locale** du cache TanStack Query.
3. **Rollback** en cas d'erreur (restaurer le snapshot).
4. **Validation logique** côté client : vérifier que la mutation est plausible avant de l'appliquer (sinon on roll back tout le temps).

Quand c'est rentable :
- Mutation rapide (< 500ms typique côté backend).
- Feedback visuel immédiat important (UX).
- Risque d'erreur faible.

Quand c'est superflu :
- Mutation lente / rare.
- Affichage déjà géré par WS event qui arrive vite.
- Risque d'erreur élevé (rollback fréquent = clignotement UI).

Sur le projet :
- **Upgrade bâtiment** : ~quelques 100 ms backend, optimistic justifié → latence d'apparition de l'entry queue cachée.
- **Train units** : devrait être pareil (mutation rapide), mais pas optimistic. Pourquoi ? Documentation manquante. Hypothèses : inquiétude sur le calcul de la file complexe, oubli, ou décision conscient (latence acceptable).

À noter aussi : l'optimistic upgrade ne décrémente **pas** les ressources (cf [ticket 03](./03-resources-changed-dual-path.md)). C'est probablement volontaire (éviter l'affichage de ressources négatives / incohérentes), mais pas documenté dans `.claude/rules/react-hud.md`.

## Impact

- **UX inégale** : un joueur ressent une latence sur train, pas sur upgrade. Sans raison apparente.
- **Erreur cohérence** : un nouveau dev qui ajoute une mutation ne sait pas s'il doit faire optimistic ou pas. Le pattern ne se transmet pas.
- **Documentation décollée** : `.claude/rules/react-hud.md` cite optimistic comme convention sans préciser quand l'appliquer.

## Contexte

Le pattern optimistic est plus complexe à écrire qu'une mutation simple. Probablement appliqué là où la première feature en avait besoin (BuildingDetailModal), pas systématisé ensuite.

## Pistes à explorer

- **Décision produit / UX** : est-ce que la latence training est gênante ? Tester en conditions réelles (latence prod).
- **Helper réutilisable** : extraire le pattern optimistic en un helper `createOptimisticMutation({ snapshot, apply, rollback })` qui standardise les 4 étapes. Réduit la barrière d'entrée pour appliquer le pattern.
- **Documentation décisive** : mettre à jour `.claude/rules/react-hud.md` avec une règle claire (ex : "optimistic obligatoire pour mutation avec feedback visuel direct ; pas optimistic pour mutations rares ou avec risque d'erreur élevé").
- **Audit complet** : tableau "mutation × optimistic × justification" pour toutes les mutations existantes.
- **Toast vs inline** : harmoniser le feedback erreur (peut-être : inline pour erreurs de validation, toast pour erreurs réseau).

## Décision validée

(2026-05-06, par l'utilisateur)

**Appliquer l'optimistic UI à `useTrainUnitsMutation` / `UnitCard`** pour éliminer la latence perçue à l'entraînement. Contrainte explicite : **implémentation simple, ratio coût/bénéfice maîtrisé**.

- Pattern visé : reproduire l'approche déjà utilisée dans `useUpgradeBuildingMutation` (`onMutate` snapshot training queue + apply optimistic entry, `onError` rollback, `onSettled` invalidate).
- **Pas de helper / abstraction supplémentaire** au-delà de l'usage natif TanStack Query.
- Si l'effort dépasse ~30 lignes ajoutées dans le fichier `queries.ts`, signaler et discuter avant de continuer.
- Une fois en place, documenter le pattern dans `.claude/rules/react-hud.md` (règle simple : "optimistic obligatoire pour mutation rapide à feedback visuel direct").

Reportée pour plus tard (hors scope de ce ticket) : harmonisation du feedback erreur (toast vs inline) entre `BuildingDetailModal` et `UnitCard`.

L'agent suivant doit **planifier l'implémentation** (contenu de `onMutate`, structure du context de rollback, gestion de l'`optimisticEntryId` côté file d'entraînement), pas re-explorer.

## Résolution (2026-05-08)

`useTrainUnitsMutation` (`battleforthecrown-pixi/src/api/queries.ts:313`) passe en optimistic, calé sur le pattern de `useUpgradeBuildingMutation` :

- `onMutate` : `cancelQueries` sur `armyTraining(villageId)`, snapshot de la file existante, push d'une `ArmyTrainingDto` optimistic (`id: optimistic-train-<unitType>-<ts>`, `timePerUnitMs: 60_000` placeholder remplacé à l'invalidate).
- `onError` : restore du snapshot.
- `onSettled` : invalidations existantes inchangées.

Pas de décrément ressources optimistic (cohérent avec la règle `react-hud.md` et avec `useUpgradeBuildingMutation`). Pas de helper / abstraction (contrainte du ticket). Patch ~22 lignes ajoutées dans `queries.ts`.

`battleforthecrown-pixi/.claude/rules/react-hud.md` : règle ajoutée — *optimistic obligatoire pour mutation rapide à feedback visuel direct ; pas optimistic pour mutations rares ou à risque élevé*.

### Drift constaté avec le ticket d'origine

Lecture du code à J-2 du ticket :

- `useChangeStrategyMutation` cité comme « à auditer » : **n'existe pas** dans `pixi/src/`. À retirer du scope.
- `useCancelBuildingMutation` cité comme « à auditer » : s'appelle en réalité `useCancelConstructionMutation` (queries.ts:600) et **est déjà optimistic** (snapshot + filter + rollback).
- `useMarkReportReadMutation` (437) et `useInitiateAttackMutation` (488) : toujours non-optimistic. Décision optimistic ou non à prendre au cas par cas — hors scope ici.

### Bug pré-existant trouvé en QA (corrigé dans le même commit)

`battleforthecrown-pixi/src/api/ws-bindings.ts:83-84` — le binding `unit.training.completed` invalidait les query keys `['armyTraining', villageId]` et `['armyInventory', villageId]`, mais les vraies clés produites par `queryKeys` sont `['army', 'training', villageId]` et `['army', 'inventory', villageId]`. Résultat : le toast "Entraînement terminé" se déclenchait, mais la file de training et l'inventaire **n'étaient pas rafraîchis** (la file restait à `0/3` malgré le toast). Bug masqué auparavant par le `staleTime: 2_000` de `useArmyTrainingQuery`, devenu visible avec l'optimistic UI.

Fix : passer par la factory `queryKeys.armyTraining(villageId)` / `queryKeys.armyInventory(villageId)` pour bloquer les drifts futurs (les autres bindings continuent d'utiliser des array literals partiels qui marchent par prefix-matching TanStack Query — non concernés).

### Bugs connexes corrigés en QA (UnitCard.tsx)

Trouvés en testant le ticket 11 IG, fixés dans le même commit :

- **Coût temps n'incluait pas le multiplier monde** : `totalCost.timeSeconds = cost.time * quantity` à partir de `UNIT_COSTS` brut. Affichait "1m 30s" pour 3 milices sur un monde rapide (multiplier × 30) alors que le serveur entraînait en ~3s. Fix : récupérer `multipliers.training` via `useWorldConfigQuery(worldId)` et calculer `(cost.time / trainingMultiplier) * quantity` (même pattern que `BuildingDetailModal.tsx:65-76`).
- **Progress bar figée à ~33 %** pendant l'entraînement : le serveur n'émet pas d'event WS intermédiaire (seulement `unit.training.completed` à la toute fin), donc `training.completedQty` reste à `0` jusqu'à la disparition de la file. Le calcul de progression dépendait de cette valeur. Fix : extrapoler localement via `elapsedMs = now - Date.parse(training.createdAt)` et `progress = elapsedMs / (totalQty * timePerUnitMs)`. La barre avance maintenant en continu (paliers 1 s via le `useTickingNow(1_000)` existant). Le `displayedCompletedQty` affiché reste majoré par la valeur DB (jamais d'incohérence visuelle quand l'event WS final arrive).

### Follow-up éventuel (hors scope)

`useUpgradeBuildingMutation` snapshot `previousResources` (queries.ts:532) mais ne modifie jamais le cache resources → snapshot mort, vestige d'avant la résolution du [ticket 03](./03-resources-changed-dual-path.md). Nettoyage 4 lignes possible.

### Vérification

- `yarn workspace battleforthecrown-pixi tsc --noEmit` : OK.
- `yarn workspace battleforthecrown-pixi test --run` : 57/57 tests verts.
- QA user IG : entrer dans une caserne, lancer un entraînement, vérifier que l'entry "En cours…" apparaît instantanément (pas d'attente avant que la barre de progression apparaisse).

## Tickets liés

- [13 — GameSession wrapper fragile](./13-pixi-game-session-fragile-wrapper.md) — autre exemple de pattern frontend non systématisé.
- [14 — zod non appliquée](./14-pixi-zod-not-applied.md) — convention documentée non systématique.

## Dimensions à valider en sortie

- Décision écrite sur quelles mutations doivent être optimistic (et pourquoi).
- Helper / pattern réutilisable pour appliquer optimistic uniformément.
- Documentation `.claude/rules/react-hud.md` mise à jour avec la règle claire.
- Cohérence error handling (inline vs toast) documentée.
