# Run #003 — audit-units

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md)). 3ᵉ sous-run sur 7 (suit [`001`](./001-audit-economy-progression.md) et [`002`](./002-audit-buildings.md)).
- **Spec source** : [`docs/gameplay/08-units.md`](../../docs/gameplay/08-units.md) (intégralité)
  - § Catalogue (10 unités : MILICE, ÉCUYER, GUERRIER, TEMPLIER, ARCHER, CAVALIER, ESPION, BÉLIER, CATAPULTE, SEIGNEUR)
  - § Légende (sémantique colonnes : Pop, Temps, Caserne, Mobilité, Capacité, Poids)
  - § Archétypes et contre-relations (passifs)
  - § Mécanique d'entraînement (file unique MVP, consommation pop, annulation, déblocage progressif)
  - ⚠️ Note MVP : Bélier/Catapulte désactivés via `requiredBarracksLevel: 99` ; Seigneur recruté à la Salle du Trône
  - Renvois : [`04-combat.md`](../../docs/gameplay/04-combat.md) (résolution — run 004), [`09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) § poids (run 000), [`03-buildings.md`](../../docs/gameplay/03-buildings.md) § Caserne (run 002), [`10-conquest.md`](../../docs/gameplay/10-conquest.md) § Seigneur (run 006), [`11-scouting.md`](../../docs/gameplay/11-scouting.md) (passif ESPION — Phase 4)
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/army/army.service.ts`
  - `battleforthecrown-backend/src/modules/army/army.controller.ts`
  - `battleforthecrown-backend/src/modules/gameplay/recruit-troops.use-case.ts`
  - `battleforthecrown-backend/src/modules/gameplay/cancel-recruitment.use-case.ts`
  - `battleforthecrown-backend/src/workers/training.worker.ts` (à confirmer en cartographie)
- **Modules frontend** : —
- **Modules transverses** :
  - `packages/shared/src/army/types.ts` (`UNIT_TYPES`, `UnitCost`, `UnitStats`, `UnitsConfig`)
  - `packages/shared/src/army/unit.ts` (`UNIT_COSTS`, `UNIT_STATS`, `UNIT_CATALOG`, `getUnitStats`)
  - `packages/shared/src/army/unit-map.ts` (`UnitMapSchema` Zod)
  - `packages/shared/src/power/weights.ts` (`UNIT_POWER_WEIGHTS` — déjà audité run 000)
  - `packages/shared/src/logic/training-time.ts`, `packages/shared/src/logic/travel-time.ts`

## Dépendances

- **Run 000** (DONE, archivé) — `UNIT_POWER_WEIGHTS` déjà calé pour les 8 unités présentes côté code. Ce run **consomme** ce travail. Si WARRIOR/RAM ajoutés, leurs poids manquent → écart dérivé à fixer ici.
- **Run 002** [`audit-buildings`](./002-audit-buildings.md) (PLANNED) — § Caserne § Salle du Trône traités en 002. Ce run **ne re-touche pas** les bâtiments ; consomme `requiredBarracksLevel`. Si 002 pas DONE, acter dans `Décisions prises`.
- **Run 004** [audit-combat] (à venir) — la **résolution** combat (formule, application des passifs, conquête) est explicitement déléguée à 004. 003 confronte uniquement le **catalogue** (stats brutes, coûts, temps, passifs *déclarés*).
- **Run 006** [audit-conquest] — la **mécanique** de recrutement Seigneur (Throne Hall, couronnes, unicité) est déléguée à 006. 003 confronte uniquement les valeurs catalogue du Seigneur.

## Critère de fin (acceptance)

- [ ] Tableau de confrontation spec ↔ code **exhaustif** : 1 ligne par unité (10 lignes — MILICE, ÉCUYER, GUERRIER, TEMPLIER, ARCHER, CAVALIER, ESPION, BÉLIER, CATAPULTE, SEIGNEUR). Colonnes : `Unité | Présent code | Coût (bois/pierre/fer/pop) OK | Temps OK | Caserne unlock OK | Atk/Def OK | Capacité OK | Mobilité OK | Poids OK | Passif déclaré OK | Statut MVP OK | Sévérité écart`.
- [ ] **WARRIOR** ajouté à `UNIT_TYPES` + `UNIT_COSTS` + `UNIT_STATS` + `UNIT_POWER_WEIGHTS` selon spec (120/80/50/2pop/180s, requiredBarracksLevel:3, atk20/def5/cap35/spd20, poids 12).
- [ ] **RAM** ajouté à `UNIT_TYPES` + `UNIT_COSTS` + `UNIT_STATS` + `UNIT_POWER_WEIGHTS` (300/400/200/4pop/360s, désactivé MVP via `requiredBarracksLevel:99`, atk50/def10/cap0/spd5, poids 30).
- [ ] **CATAPULT** : confronter `requiredBarracksLevel` (passer à 99 si pas désactivé MVP), valider atk/def/cap/spd vs spec.
- [ ] **NOBLE** : valeurs catalogue alignées spec (5000/5000/5000/15pop/8h=28800s, atk500/def500/cap0/spd5, poids 100). `requiredBarracksLevel` à reconsidérer (sentinel 99 OU nouveau champ `requiredThroneHallLevel` — clarification au démarrage).
- [ ] **TEMPLIER** : coût bois corrigé (200→80), défense corrigée (23→15), capacité corrigée (10→40).
- [ ] **ESPION** : `requiredBarracksLevel` corrigé (5→3).
- [ ] MILICE / ÉCUYER / ARCHER / CAVALIER : confrontation cellule par cellule, fix tout écart < 50 lignes.
- [ ] **Passifs** : status quo acté (data-only ici OU report total run 004 — clarification au démarrage).
- [ ] **`UnitStats.defenseInfantry/Cavalry/Archer`** split : décision actée (status quo + commentaire OU simplification — clarification).
- [ ] Pour chaque écart < 50 lignes : fix appliqué dans la même run.
- [ ] Pour chaque écart ≥ 50 lignes : ticket créé dans `tasks/`.
- [ ] Mécanique d'entraînement confrontée : file unique (`unitTraining.findFirst` guard), annulation = remboursement complet, déblocage progressif.
- [ ] Tests pure-logic vérifiés : `getUnitStats`, `UNIT_CATALOG.costs[type]`, `getUnitPowerWeight`, `calculateTrainingTime`, `findSlowestUnitSpeed`. Ajout uniquement si manquant. Conformes à `.claude/rules/tests.md`.
- [ ] Tests pure-logic ajoutés pour WARRIOR et RAM : présence dans `UNIT_TYPES`, `UNIT_COSTS`/`UNIT_STATS` exacts, poids exact (≠ fallback).
- [ ] `yarn workspace battleforthecrown-backend test` vert.
- [ ] `yarn workspace @battleforthecrown/shared build` vert.
- [ ] `docs/gameplay/08-units.md` reste source unique.
- [ ] Section `## Rapport final` remplie + commit final `<type>(<scope>): <subject>` + QA.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

Pré-décomposition indicative (10 tâches) :

- T1 — Lire spec 08 et extraire invariants (1 ligne par unité × {présence, coût, pop, temps, requiredBarracksLevel, atk, def, cap, mobilité, poids, passif, statut MVP}).
- T2 — Cartographier `UNIT_TYPES`, `UNIT_COSTS`, `UNIT_STATS`, `UNIT_CATALOG`, `getUnitStats`, `UNIT_POWER_WEIGHTS`, callers (`recruit-troops.use-case`, `cancel-recruitment`, `combat/strategies/*`, `loot.manager`). Confirmer absence WARRIOR + RAM.
- T3 — Tableau de confrontation exhaustif (10 lignes).
- T4 — Lot **éco/infanterie de base** (MILICE, ÉCUYER, ARCHER) : fix écarts < 50 lignes.
- T5 — Lot **militaires offensifs** (GUERRIER ajout + TEMPLIER fix + CAVALIER) : ajouter WARRIOR ; corriger TEMPLIER.
- T6 — Lot **spéciaux** (ESPION, BÉLIER ajout, CATAPULTE désactivation MVP, SEIGNEUR alignement) : trancher sentinel 99 vs nouveau champ pour SEIGNEUR (TODO référencé run 006).
- T7 — Lot **passifs** (status quo) : data-only ici OU report run 004 (à trancher).
- T8 — Mécanique d'entraînement : confronter file unique, annulation, déblocage. Fixer ou ticketer.
- T9 — Tests pure-logic : étendre pour WARRIOR + RAM (poids exact, pas « > 0 »).
- T10 — `yarn test` + build shared + rapport final + QA + commit.

## Points d'attention

- **WARRIOR absent du code** : 9 unités spec / 8 unités code. Ajout obligatoire.
- **RAM absent du code** : ajout enveloppe ici (catalogue + poids 30 + requiredBarracksLevel:99). Bonus +50 % vs Wall = run 004.
- **NOBLE coût catalogue désaligné** : code=1000/800/500/5pop/600s ; spec=5000/5000/5000/15pop/28800s. À trancher : corriger ici (valeurs pures) ou laisser à run 006. Recommandation : corriger ici, 006 ajoutera la mécanique. Ne **pas** traiter le coût en couronnes ici (renvoi run 006).
- **NOBLE.requiredBarracksLevel:10** : sémantiquement faux (Throne Hall, pas Caserne). Options : (a) sentinel 99 ; (b) nouveau champ `requiredThroneHallLevel:6`. À trancher.
- **Passifs non modélisés** : 5 boucles spec absentes. data-only ici OU report 004.
- **`UnitStats.defenseInfantry/Cavalry/Archer`** : split à 3 défenses identiques via helper `defense()`. Garder split (compat run 004) OU simplifier en `defense: number`. À trancher.
- **Bâtiments désactivés MVP** : RAM/CATAPULT bloqués via `requiredBarracksLevel:99`. Vérifier que `recruit-troops.use-case.ts` bloque bien (level Caserne max = 10).
- **Power weights manquants masqués par fallback** : `DEFAULT_UNIT_POWER_WEIGHT = 1` masque l'absence. Tester poids exact.
- **Overlap run 002** : `requiredBarracksLevel` côté unités est la source de vérité ; vérifier cohérence avec spec 03 § Caserne.
- **Frontend hors scope** : ticket de suivi `frontend-units-warrior-ram` si UI à mettre à jour.
- **Mécanique combat / passifs / conquête** : run 004 (formule combat) et run 006 (Throne Hall + couronnes + unicité). Ne **PAS** coder ici.

## Notes — segmentation Phase 1

3ᵉ sur 7. Suite : 004 combat → 005 barbarians → 006 conquest → 007 spawning.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage.)_

## Rapport final

_(Vide au démarrage.)_
