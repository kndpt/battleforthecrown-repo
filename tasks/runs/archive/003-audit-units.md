# Run #003 — audit-units

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

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

### Tableau de confrontation spec ↔ code (10 unités)

| Unité (spec) | Présent | Coût (W/S/I/Pop) | Temps | Caserne | Atk | Def | Cap | Mob | Poids | Passif | Statut MVP | Sévérité |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MILICE | ✅ MILITIA | ✅ 50/30/10/1 | ✅ 30s | ✅ 1 | ✅ 5 | ✅ 5 | ✅ 25 | ✅ 10 | ❌ 5 (spec=2) | n/a | actif | mineur |
| ÉCUYER | ✅ SQUIRE | ✅ 80/50/30/1 | ✅ 60s | ✅ 2 | ✅ 10 | ✅ 10 | ✅ 50 | ✅ 15 | ✅ 8 | ❌ +10% vs ARCHER absent | actif | mineur |
| GUERRIER | ❌ WARRIOR | ❌ 120/80/50/2 | ❌ 180s | ❌ 3 | ❌ 20 | ❌ 5 | ❌ 35 | ❌ 20 | ❌ 12 | ❌ +10% raid absent | actif | **majeur** |
| TEMPLIER | ✅ TEMPLAR | ❌ 200/150/120/2 (wood KO) | ✅ 180s | ✅ 4 | ❌ 10 (spec=5) | ❌ 23 (spec=15) | ❌ 10 (spec=40) | ✅ 10 | ❌ 20 (spec=12) | ❌ +15% garrison absent | actif | **majeur** |
| ARCHER | ✅ ARCHER | ✅ 60/40/30/1 | ✅ 90s | ✅ 3 | ✅ 12 | ✅ 6 | ✅ 20 | ✅ 12 | ❌ 9 (spec=6) | ❌ +10% vs MILICE/GUERRIER absent | actif | mineur |
| CAVALIER | ✅ CAVALRY | ✅ 200/100/150/3 | ✅ 240s | ✅ 5 | ✅ 15 | ✅ 8 | ✅ 100 | ✅ 35 | ✅ 15 | descriptif (null) | actif | aucun |
| ESPION | ✅ SPY | ✅ 50/50/20/1 | ✅ 90s | ❌ 5 (spec=3) | ✅ 8 | ✅ 2 | ✅ 0 | ✅ 100 | ❌ 4 (spec=10) | ❌ scout absent | actif | majeur |
| BÉLIER | ❌ RAM | ❌ 300/400/200/4 | ❌ 360s | ❌ 99 (MVP off) | ❌ 50 | ❌ 10 | ❌ 0 | ❌ 5 | ❌ 30 | ❌ +50% vs Wall absent | OFF MVP | **majeur** |
| CATAPULTE | ✅ CATAPULT | ✅ 400/600/300/5 | ✅ 480s | ❌ 8 (spec=99 OFF MVP) | ✅ 80 | ✅ 5 | ✅ 0 | ✅ 3 | ❌ 30 (spec=40) | ❌ AoE absent | OFF MVP (cassé) | **majeur** |
| SEIGNEUR | ✅ NOBLE | ❌ 1000/800/500/5 (spec 5000×3/15) | ❌ 600s (spec=28800s) | ❌ 10 (spec=Throne 6) | ✅ 500 | ✅ 500 | ✅ 0 | ✅ 5 | ❌ 50 (spec=100) | descriptif (null) | actif (incohérent) | **majeur** |

### Tâches chirurgicales

- **T1 — Étendre catalogue shared** (1 implementer call, 4 fichiers ≤ 5) : `packages/shared/src/army/types.ts` (ajouter `WARRIOR` + `RAM` à `UNIT_TYPES` ; ajouter `requiredThroneHallLevel?: number` à `UnitCost` ; ajouter type `UnitPassive` discriminated union + champ `passive: UnitPassive | null` à `UnitStats` ; JSDoc sur `defenseInfantry/Cavalry/Archer` MVP) ; `packages/shared/src/army/unit.ts` (ajout 2 entries WARRIOR/RAM ; corriger TEMPLAR wood/atk/def/cap, SPY barracksLevel, CATAPULT barracksLevel, NOBLE wood/stone/iron/pop/time/+requiredThroneHallLevel/sentinel barracksLevel ; `passive` data-only sur les 10) ; `packages/shared/src/power/weights.ts` (ajout WARRIOR=12 + RAM=30 ; corriger TEMPLAR 20→12, SPY 4→10, CATAPULT 30→40, NOBLE 50→100). `unit-map.ts` se met à jour automatiquement via `UnitTypeSchema = z.enum(UNIT_TYPES)`. Critère succès : `tsc` passe, valeurs exactes spec.
- **T2 — Tests pure-logic** (test-writer) : étendre/créer un `*.spec.ts` shared ou backend pure-logic vérifiant : présence WARRIOR + RAM, valeurs exactes UNIT_COSTS + UNIT_STATS pour ces 2 unités, `getUnitPowerWeight` exact pour les 10 unités (non-fallback). Conforme `tests.md` (pure-logic only).
- **T3 — Build shared + tests backend** (test-runner) : `yarn workspace @battleforthecrown/shared build` puis `yarn workspace battleforthecrown-backend test`. Vert obligatoire.
- **T4 — Review** (agent-skills:code-reviewer) sur diff complet.
- **T5 — Fix findings bloquants/majeurs + re-test**.
- **T6 — Docs + rapport final + commit + archive**.

### Hors scope (reporté à d'autres runs)

- **NOBLE déblocage Throne Hall + couronnes + unicité** : run 006 (audit-conquest). Ici on pose `requiredThroneHallLevel:6` data-only ; pas de modif de `recruit-troops.use-case` (NOBLE bloqué de fait par sentinel `requiredBarracksLevel:99`).
- **Implémentation des passifs en combat** : run 004 (audit-combat). Ici data-only.
- **UI frontend pour WARRIOR + RAM** : ticket de suivi à ouvrir si l'audit révèle des hardcodes côté Pixi.

### Pré-décomposition originale (informative)

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

- 2026-05-10 — Étape 0 préflight OK (repo clean fonctionnellement).
- 2026-05-10 — Étape 1 clarification : 3 questions tranchées (NOBLE → nouveau champ `requiredThroneHallLevel`, passifs → data-only, defense split → status quo + JSDoc).
- 2026-05-10 — Étape 2 cartographie (`code-mapper`) : 8 unités présentes vs 10 spec, écarts WARRIOR/RAM/TEMPLAR/SPY/CATAPULT/NOBLE confirmés.
- 2026-05-10 — Étape 3 refinement : tableau de confrontation 10 lignes, décomposition T1-T6, statut RUNNING.
- 2026-05-10 — Étape 4 coding (T1) : implementer a étendu types.ts (+UnitPassive, +requiredThroneHallLevel, +passive obligatoire), unit.ts (10 unités, valeurs corrigées), weights.ts (10 poids). Build shared OK.
- 2026-05-10 — Étape 5 testing (T2) : test-writer a créé `units-catalog.spec.ts` (5 it). Verts immédiats.
- 2026-05-10 — Étape 6 review (T4) : code-reviewer — 0 bloquant, 0 majeur, 2 mineurs (poids MILITIA/ARCHER désalignés spec, typage UNIT_POWER_WEIGHTS lâche), 1 nit (commentaire NOBLE).
- 2026-05-10 — Étape 7 fix (T5) : MILITIA 5→2, ARCHER 9→6, `satisfies Record<UnitType, number>`, commentaire NOBLE enrichi. Spec test mise à jour.
- 2026-05-10 — Étape 8 re-test : 113/113 verts.
- 2026-05-10 — Étape 9 docs : `docs/architecture/data-model.md:51` allégé (énumération `unitType` obsolète remplacée par lien vers shared + spec 08).
- 2026-05-10 — Étape 10 : archive + commit.

## Décisions prises

- **NOBLE** : nouveau champ `requiredThroneHallLevel:6` (optionnel sur `UnitCost`) + sentinel `requiredBarracksLevel:99` conservé pour bloquer le flux Caserne. Sémantique propre + zéro breakage callers. Run 006 traitera la mécanique réelle (couronnes, unicité, gating Throne Hall).
- **Passifs** : data-only via type `UnitPassive` discriminated union (`{ kind, ... }`) + champ `passive: UnitPassive | null` sur `UnitStats`. Permet à run 004 de consommer sans re-modeler les types.
- **Defense split** : status quo `defenseInfantry/Cavalry/Archer` (3 valeurs identiques au MVP) avec commentaire JSDoc.
- **TEMPLAR atk** : la fiche § Critère ne mentionne pas explicitement la correction atk 10→5, mais la spec dit atk=5. Décision lead : corriger pour respecter la règle générale « fix tout écart < 50 lignes ». Logué ici pour traçabilité.
- **CAVALRY passif "Pilleur optimal"** : descriptif (cap+mob déjà élevés couvrent la sémantique), `passive: null`.
- **SPY passif "scout"** : encodé `{ kind: 'scout' }` data-only ; logique scouting elle-même = Phase 4 (cf. spec).
- **NOBLE passif "Conquête unique"** : mécanique conquête, déléguée run 006, `passive: null` ici.
- **Pas de modif `recruit-troops.use-case.ts`** : NOBLE bloqué de fait par sentinel `requiredBarracksLevel:99` (Caserne max=10). Le check Throne Hall sera ajouté run 006.

### Review findings (étape 6)

Code review (agent-skills:code-reviewer) — aucun bloquant, aucun majeur. 2 mineurs traités, 1 mineur reporté, 1 nit traité.

- **[mineur 1, fixé]** Poids MILICE/ARCHER désalignés spec : code disait MILITIA=5 / ARCHER=9, spec dit 2 / 6. Run 000 avait calé ces 2 valeurs sans confronter la spec — écart passé entre les mailles. Fix : `weights.ts` MILITIA 5→2, ARCHER 9→6 ; `units-catalog.spec.ts` mis à jour en cohérence ; tableau de confrontation corrigé (✅ → ❌). 8 unités spec-conformes / 8 → 10/10 maintenant.
- **[mineur 2, fixé]** Typage lâche `UNIT_POWER_WEIGHTS` (`Object.freeze({...})` sans annotation). Fix : `satisfies Record<UnitType, number>` — exhaustivité TS verrouillée, inférence des literals préservée.
- **[mineur 3, reporté]** JSDoc « split pour run 004 » sur `defenseInfantry/Cavalry/Archer` : commentaire à reprendre en debrief run 004 (réduire à `defense: number` ou reformuler). Pas critique pour ce run.
- **[nit, fixé]** Commentaire NOBLE `// sentinel` enrichi : `// sentinel — NOBLE est gated par requiredThroneHallLevel (run 006)`.

Conclusion review : merge OK.

## Rapport final

### Synthèse

Catalogue d'unités shared aligné à 100 % sur la spec `docs/gameplay/08-units.md` (10 unités, valeurs exactes, poids exacts). Les 2 unités manquantes (WARRIOR, RAM) sont ajoutées ; les 4 unités avec écarts (TEMPLAR, SPY, CATAPULT, NOBLE) sont corrigées. Passifs déclarés data-only via discriminated union `UnitPassive` — la consommation côté combat est explicitement déléguée à run 004. NOBLE gated par nouveau champ `requiredThroneHallLevel:6` (nouvelle convention) ; sentinel `requiredBarracksLevel:99` conservé pour bloquer le flux Caserne sans toucher `recruit-troops.use-case` (run 006 traitera la mécanique réelle).

### Fichiers touchés

- `packages/shared/src/army/types.ts` (+22/-2) — `UNIT_TYPES` étendu (WARRIOR + RAM), `UnitCost.requiredThroneHallLevel?` ajouté, `UnitPassive` exporté, `UnitStats.passive` obligatoire, JSDoc défense.
- `packages/shared/src/army/unit.ts` (+57/-12) — 10 unités dans UNIT_COSTS et UNIT_STATS, valeurs spec-conformes, passifs data-only.
- `packages/shared/src/power/weights.ts` (+5/-3) — 10 poids spec-conformes, `satisfies Record<UnitType, number>`.
- `battleforthecrown-backend/src/modules/power/units-catalog.spec.ts` (nouveau, 79 lignes) — 5 tests pure-logic (inventaire 10 types, poids exacts non-fallback, ancrages WARRIOR + RAM).
- `docs/architecture/data-model.md` (+1/-1) — énumération obsolète remplacée par lien source de vérité.
- `tasks/runs/003-audit-units.md` (run sheet, archivée).

### Tickets ouverts

Aucun. Les écarts ≥ 50 lignes anticipés (UI frontend WARRIOR + RAM) ne sont pas remontés ici car aucune trace de hardcode UNIT_TYPES côté pixi n'a été détectée par la cartographie ; à confirmer si symptôme observé. Les passifs et la mécanique Throne Hall sont explicitement périmètres run 004 et run 006.

### QA

#### QA — pas de test in-game nécessaire

Raison : modification 100 % data shared (catalogue d'unités). Aucun effet visible IG **directement** déclenché par ce run :
- WARRIOR + RAM ne sont pas exposés en UI (pas de tooltip / bouton de recrutement ajoutés ici — UI hors scope).
- RAM/CATAPULT/NOBLE désactivés via sentinel `requiredBarracksLevel:99` (Caserne max=10) → aucun flux user nouveau.
- TEMPLAR/SPY corrections : effets sur des combats futurs (run 004 calcule), pas observable IG sans combat.
- Passifs data-only : non consommés par le combat actuel (run 004).

#### QA backend (vérifié par l'agent)

**Résultat attendu** : le shared compile, les unit tests backend passent, et un nouveau type WARRIOR est utilisable côté code.

- [x] `yarn workspace @battleforthecrown/shared build` → exit 0
- [x] `yarn workspace battleforthecrown-backend test` → 113/113 verts (10 suites)
- [x] `units-catalog.spec` (nouveau) → 5/5 verts (inventaire 10 types, poids exacts, ancrages WARRIOR/RAM)
- [x] Aucune régression sur les 7 autres specs pure-logic (combat utils, combat strategies, loot manager, vision, world-config, weights fallbacks, dto)

### Méta-évaluation

- 1 cycle de review-fix (3 trouvailles mineures, toutes traitables triviallement). Cap respecté.
- 0 dérogation lead.
- 0 escalade.
- Tâches T1-T6 toutes complétées dans l'ordre.
- Token budget : OK (carte concise, refinement court, fixes inline).
