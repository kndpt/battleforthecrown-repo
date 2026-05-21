# Run #028 — barracks-training-speed-bonus

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant
- **Spec source** : [`docs/gameplay/03-buildings.md` § Caserne](../../docs/gameplay/03-buildings.md#caserne-barracks) + [`docs/gameplay/08-units.md` § Mécanique d'entraînement](../../docs/gameplay/08-units.md#mécanique-dentraînement)
- **Type** : feature
- **Modules backend** : `gameplay/recruit-troops`
- **Modules frontend** : `pixi/features/army`

## Dépendances

- Aucune dépendance bloquante identifiée.
- Contexte à préserver : le Seigneur reste recruté à la Salle du Trône et ne doit pas consommer le bonus de Caserne.

## Critère de fin (acceptance)

- [ ] Une constante ou un helper shared expose un bonus de vitesse Caserne par niveau 1-10, monotone, avec une sémantique vitesse explicite.
- [ ] `RecruitTroopsUseCase` crée une `UnitTraining.timePerUnitMs` plus courte à Caserne niveau supérieur, à unité, quantité, tempo monde et stratégie identiques.
- [ ] Le bonus Caserne se compose avec `strategyBonus.trainingSpeedBonus` et `TempoService.applyDuration(..., 'unitTrainingSpeed')`.
- [ ] Aucune nouvelle formule inline `time / ...` n'est introduite hors helper partagé.
- [ ] `RecruitNobleUseCase` ne dépend pas de la Caserne et continue d'utiliser `lordTrainingSpeed`.
- [ ] `UnitCard` affiche un coût temps qui varie avec `barracksLevel` pour les unités de Caserne.
- [ ] Les durées de base dans `UNIT_COSTS` ne sont pas modifiées pour implémenter ce bonus.
- [ ] Les tests d'entraînement armée restent verts, notamment le smoke `army-training`.
- [ ] En jeu, améliorer la Caserne rend une nouvelle formation de troupes visiblement plus rapide que l'ancien niveau, sans changer les files déjà créées.

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
  - [ ] Helper shared bonus Caserne monotone — `test shared/backend ciblé` → à vérifier
  - [ ] `RecruitTroopsUseCase.timePerUnitMs` diminue avec le niveau de Caserne — `test backend ciblé ou smoke army-training` → à vérifier
  - [ ] Composition bonus Caserne + stratégie + tempo, sans formule inline nouvelle — `rtk grep` + tests → à vérifier
  - [ ] Noble hors bonus Caserne — `rtk grep` + tests de non-régression → à vérifier
  - [ ] `UnitCard` affiche une durée variable avec `barracksLevel` — `test pixi ciblé ou visuel` → à vérifier
  - [ ] `UNIT_COSTS` inchangé pour les temps de base — `rtk git diff packages/shared/src/army/unit.ts` → à vérifier
  - [ ] Smoke entraînement armée vert — `yarn workspace battleforthecrown-backend test:smoke -- army-training` ou commande équivalente existante → à vérifier
- **Review indépendante** : Déclenchée (raison: back+front + invariant durable + diff estimé potentiellement > 100 lignes) avec verdict à renseigner.
- **Tests automatisés** : à renseigner.
- **Smokes ajoutés/modifiés** : à renseigner.
- **QA fonctionnelle agent** : à renseigner.
- **Tests IG à faire par le user** : vérifier qu'une Caserne améliorée réduit visiblement la durée d'une nouvelle formation de troupes.

## Notes de cadrage

- Piste recommandée : ajouter un helper shared sémantique vitesse, par exemple `getBarracksTrainingSpeedMultiplier(level)`, puis le composer avec le bonus de style dans `calculateTrainingTime`.
- Ne pas imiter aveuglément `CASTLE_CONSTRUCTION_SPEED_BONUS` : sa table est un facteur de durée `< 1`, alors que le training existant attend un multiplicateur de vitesse `> 1`.
- Ne pas recalibrer les temps de base des unités ni le tempo monde : ces constantes ont été traitées par le run 027.
- Les files d'entraînement existantes stockent déjà `timePerUnitMs`; le bonus Caserne doit s'appliquer aux nouvelles formations, pas rétroactivement.

## Liens détectés

- Connexe : [`tasks/archive/05-world-config-multipliers-semantics.md`](../archive/05-world-config-multipliers-semantics.md) — `calculateTrainingTime` centralisé et piège sémantique vitesse/temps déjà traité.
- Connexe : [`tasks/archive/40-recruit-noble-throne-hall.md`](../archive/40-recruit-noble-throne-hall.md) — NOBLE séparé de la Caserne, à préserver.
- Connexe : [`tasks/archive/47-noble-training-visual-queue-missing.md`](../archive/47-noble-training-visual-queue-missing.md) — UX de progression Noble, utile pour ne pas régresser.
- Connexe : [`tasks/runs/archive/003-audit-units.md`](./archive/003-audit-units.md) — catalogue unités/déblocages Caserne déjà audités.
- Connexe : [`tasks/runs/archive/027-world-tempo-recalibrate-mvp-constants.md`](./archive/027-world-tempo-recalibrate-mvp-constants.md) — ne pas modifier les durées de base ni `tempo` sans raison.
