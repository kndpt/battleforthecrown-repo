# Run #028 — barracks-training-speed-bonus

> **Statut** : DONE
> **Démarré** : 2026-05-21
> **Terminé** : 2026-05-21

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

- [x] T1 — Shared : ajouter `BARRACKS_TRAINING_SPEED_MULTIPLIER` + `getBarracksTrainingSpeedMultiplier(level)` dans `packages/shared/src/village/buildings.ts`, niveau 1 neutre, niveaux 2-10 monotones, sémantique vitesse `> 1`.
- [x] T2 — Backend : composer `strategyBonus.trainingSpeedBonus * getBarracksTrainingSpeedMultiplier(barracks.level)` dans `RecruitTroopsUseCase`, sans toucher `RecruitNobleUseCase`.
- [x] T3 — Frontend : utiliser le helper shared dans l'estimation de durée `UnitCard` et `UnitDetailModal`, via un petit helper Pixi testable.
- [x] T4 — Tests : couvrir le helper shared côté backend pure-logic, l'effet réel dans `army-training.smoke.spec.ts`, et le helper d'affichage Pixi.
- [x] T5 — Vérification : build shared, tests ciblés backend/pixi, smokes backend obligatoires, `yarn static-check`, grep final.

## Progress (rempli pendant le run)

- [x] Préflight : worktree clean, fiche `PLANNED`, specs `03-buildings`/`08-units`, rules, `SPEC.md`, briefings backend/pixi et `bftc-tests-policy` lus.
- [x] Clarification : aucune question bloquante, la spec et la fiche tranchent le scope.
- [x] Cartographie : `code_mapper` confirme l'écart spec/code et les points d'affichage `UnitCard` + `UnitDetailModal`.
- [x] Implémentation : helper shared Caserne, application `RecruitTroopsUseCase`, helper Pixi et affichage `UnitCard`/`UnitDetailModal` ajoutés.
- [x] Tests écrits : pure-logic bâtiment, smoke training REST/DB et test helper Pixi ajoutés.
- [x] Review indépendante cycle 1 : `BLOCK` sur alignement frontend/backend du clamp/arrondi final ; mineur sur query bâtiments du modal.
- [x] Fix review cycle 1 : helper Pixi aligné sur `Math.max(MS_PER_SECOND, Math.round(...))`, `barracksLevel` passé au modal depuis `ArmyScreen`, test limite tempo rapide ajouté.
- [x] Retest : build shared, tests ciblés backend/pixi, preflight smoke, smokes backend complets et `static-check` verts.
- [x] Review indépendante cycle 2 : `GO`, aucun finding bloquant/majeur.
- [x] Documentation : docs gameplay déjà sourcées vers les constantes shared ; aucune doc canonique à modifier.

## Décisions prises

- **Bonus Caserne** : table de multiplicateurs de vitesse par niveau dans shared (`1.00 → 1.36`, +4 % par niveau). Le niveau 1 reste neutre ; la sémantique est volontairement `> 1 = plus rapide` pour se composer directement avec `calculateTrainingTime`.
- **Noble hors scope** : le bonus Caserne ne s'applique pas au Seigneur. `RecruitNobleUseCase` reste branché sur `lordTrainingSpeed` et la Salle du Trône.
- **Files existantes** : pas de recalcul rétroactif ; les nouvelles formations stockent leur `timePerUnitMs` effectif au moment du lancement.

## Rapport final

Run livré : la Caserne porte maintenant un vrai multiplicateur de vitesse d'entraînement par niveau pour les troupes de Caserne. Le bonus est défini dans shared, appliqué côté backend lors de la création des nouvelles files `BARRACKS`, et repris côté Pixi pour les estimations avant lancement. Le Seigneur reste hors bonus Caserne et continue d'utiliser le flux Salle du Trône + `lordTrainingSpeed`.

### Fichiers touchés

- `packages/shared/src/village/buildings.ts` — table/helper `BARRACKS_TRAINING_SPEED_MULTIPLIER`.
- `battleforthecrown-backend/src/modules/gameplay/recruit-troops.use-case.ts` — composition bonus style × bonus Caserne.
- `battleforthecrown-backend/src/modules/village/buildings.spec.ts` — tests pure-logic du helper.
- `battleforthecrown-backend/test/army-training.smoke.spec.ts` — smoke REST/DB Caserne L1 vs L5.
- `battleforthecrown-pixi/src/features/army/trainingDuration.ts` — helper d'affichage aligné backend.
- `battleforthecrown-pixi/src/features/army/trainingDuration.test.ts` — tests durée effective, tempo et clamp 1s.
- `battleforthecrown-pixi/src/features/army/UnitCard.tsx` — estimation coût temps avec bonus Caserne.
- `battleforthecrown-pixi/src/features/army/UnitDetailModal.tsx` / `ArmyScreen.tsx` — détail unité alimenté avec `barracksLevel`.

### Tickets ouverts

Aucun.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Helper shared bonus Caserne monotone — `rtk yarn workspace battleforthecrown-backend test buildings.spec.ts` → 25/25 tests verts.
  - [x] `RecruitTroopsUseCase.timePerUnitMs` diminue avec le niveau de Caserne — `rtk yarn workspace battleforthecrown-backend test:smoke:run` → `army-training.smoke.spec.ts` couvre Caserne L1 vs L5, suite complète verte.
  - [x] Composition bonus Caserne + stratégie + tempo, sans formule inline nouvelle — `rtk grep -n "time /|calculateTrainingTime\\(|getBarracksTrainingSpeedMultiplier|RecruitNobleUseCase|lordTrainingSpeed|BARRACKS_TRAINING_SPEED" packages/shared/src battleforthecrown-backend/src battleforthecrown-pixi/src -g '*.ts' -g '*.tsx'` → helper partagé localisé, pas de formule `time /` ajoutée.
  - [x] Noble hors bonus Caserne — `rtk grep -n "RecruitNobleUseCase|lordTrainingSpeed|getBarracksTrainingSpeedMultiplier" battleforthecrown-backend/src/modules/gameplay packages/shared/src/village/buildings.ts` → `RecruitNobleUseCase` reste sur `lordTrainingSpeed`, aucun helper Caserne.
  - [x] `UnitCard` affiche une durée variable avec `barracksLevel` — `rtk yarn workspace battleforthecrown-pixi test trainingDuration.test.ts` → 3/3 tests verts.
  - [x] `UNIT_COSTS` inchangé pour les temps de base — `rtk git diff -- packages/shared/src/army/unit.ts` → diff vide.
  - [x] Smoke entraînement armée vert — `rtk yarn workspace battleforthecrown-backend test:smoke:run` → 23 suites / 46 tests verts.
- **Review indépendante** : Déclenchée (raison: back+front + invariant durable + diff > 100 lignes). Cycle 1 `BLOCK` (alignement arrondi/clamp frontend/backend), finding résolu ; cycle 2 `GO`.
- **Tests automatisés** :
  - `rtk yarn workspace @battleforthecrown/shared build` → OK.
  - `rtk yarn workspace battleforthecrown-backend test buildings.spec.ts` → OK, 25 tests.
  - `rtk yarn workspace battleforthecrown-pixi test trainingDuration.test.ts` → OK, 3 tests après fix review.
  - `rtk yarn static-check` → OK.
- **Smokes lancés** :
  - `rtk yarn test:smoke:preflight` → OK.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run` → OK, 23 suites / 46 tests. Logs PgBoss/Outbox de fermeture observés, exit 0.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/army-training.smoke.spec.ts` ajoute un scénario REST/DB comparant `UnitTraining.timePerUnitMs` à Caserne L1 vs L5.
- **QA fonctionnelle agent** : non nécessaire au-delà du smoke REST/DB/worker/Outbox complet ; le comportement autoritatif est vérifié en base via `UnitTraining.timePerUnitMs`.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir l'écran Armée avec une Caserne niveau 1 puis niveau 5+ et vérifier que les durées affichées avant entraînement diminuent pour la même troupe.
  - [ ] Lancer une nouvelle formation après upgrade de Caserne et vérifier visuellement que la durée/progression est plus courte qu'avant.

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
