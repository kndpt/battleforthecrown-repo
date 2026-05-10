# Run #005 — audit-barbarians

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md)). 5ᵉ sous-run sur 7.
- **Spec source** : [`docs/gameplay/06-barbarians.md`](../../docs/gameplay/06-barbarians.md) (intégralité, périmètre limité ci-dessous)
  - § Identité (5 tiers, pas d'initiative, pas de riposte, pas de style)
  - § Blueprint d'armée (diversité progressive T1→T5, proportions 60/25/10/5, totaux 15/35/70/110/150)
  - § Génération > sous-section création village barbare (rolls troupes 60-100 %, ressources 30-100 %, cap stockage par tier, indépendance des deux rolls, absence de puissance tant que barbare)
  - § Régénération (troupes %/h par tier, ressources %/h par tier, vidage total, pas de suppression auto)
  - § Lisibilité joueur (rapport de combat — observabilité côté défenseur barbare uniquement)
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/world/barbarian-tier-templates.ts` (catalogue templates)
  - `battleforthecrown-backend/src/modules/world/barbarian-tier-templates.spec.ts` (test pure-logic existant à étendre)
  - `battleforthecrown-backend/src/modules/world/barbarian-village.factory.ts` (création village + roll initial)
  - `battleforthecrown-backend/src/modules/combat/strategies/barbarian-village.strategy.ts` (résolution PvE — défense barbare, pertes attaquant, blueprint troupes côté défense)
  - `battleforthecrown-backend/src/modules/combat/loot/loot.manager.spec.ts`
  - `battleforthecrown-backend/src/modules/combat/strategies/combat-strategies.spec.ts`
  - **Régénération** : à localiser (worker dédié probablement absent — point d'attention majeur)
- **Modules frontend** : — (frontend hors scope)
- **Modules transverses** :
  - `packages/shared/src/world/barbarian-templates.ts` (source de vérité templates)
  - `packages/shared/src/army/` (`UNIT_TYPES`, `UNIT_STATS` pour MILITIA/ARCHER/SQUIRE/TEMPLAR)
  - `packages/shared/src/resources/` (`getWarehouseStorageLimit` consommé via worldConfig)

## Dépendances

- **Run 001** [`audit-economy-progression`](./001-audit-economy-progression.md) : peut nécessiter alignement sur `getWarehouseStorageLimit`. Si 001 PLANNED non DONE, 005 consomme l'état actuel et signale tout drift résiduel.
- **Run 002** [`audit-buildings`](./002-audit-buildings.md) : pose le catalogue bâtiments shared. 005 consomme — ne touche pas les définitions joueur.
- **Run 004** [`audit-combat`](./004-audit-combat.md) : zone partagée sur la résolution combat barbare. 005 limite ses interventions à `BarbarianVillageStrategy` (blueprint défense + pertes attaquant) et notifie les écarts cross-strategy à 004.
- **Hors scope, renvoyé à 006** [`audit-conquest`] : flow conquête barbare (Seigneur, période capture, transfert ressources). Le commit récent `e84436f fix(backend/conquest): clear Watchtower on barbarian conquest` est noté mais **non re-ouvert** ici.
- **Hors scope, renvoyé à 007** [`audit-barbarian-spawning`] : algorithme de seeding/distribution carte (chunks, anneaux, densité, backfill, `BarbarianSeedingService`, `BarbarianBackfillWorker`, `village-placement.service`).

## Critère de fin (acceptance)

- [ ] Tableau de confrontation spec ↔ code **exhaustif** : 1 ligne par tier (T1→T5). Colonnes : `Tier | Template présent | Total troupes spec/code | Compo (types) spec/code | Cap stockage spec/code | Roll initial troupes 60-100 % | Roll initial ressources 30-100 % | Régen troupes %/h | Régen ressources %/h | Sévérité écart`.
- [ ] T4 et T5 ajoutés au catalogue shared `BARBARIAN_TIER_TEMPLATES` (actuellement T1-T3 uniquement) — buildings + populationMax + diversité d'armée correspondante. Si scope > 50 lignes ou impact data migration runtime non trivial, ticket dédié créé.
- [ ] Champ unités du blueprint exposé par tier dans le template (MILITIA/ARCHER/SQUIRE/TEMPLAR par tier, totaux 15/35/70/110/150, proportions 60/25/10/5 normalisées) **OU** ticket dédié si la révision du contrat `BarbarianVillageStrategy` (qui considère aujourd'hui `units: {}`) dépasse 50 lignes.
- [ ] `BarbarianVillageStrategy` confrontée à la spec : pertes attaquant calculées contre le blueprint barbare. L'implémentation actuelle « MVP: No losses for attacker » est documentée comme écart explicite, soit fixée, soit ticketée avec justification design (lien vers run 004 si chevauchement).
- [ ] `BarbarianVillageFactory.generateResources` confrontée : fourchette 30-60 % observée vs 30-100 % spec, ratio iron 0.7 non spécifié → écart fixé ou ticketé.
- [ ] Roll initial troupes (spec 60-100 %) implémenté ou ticket explicite.
- [ ] Régénération troupes + ressources : présence d'un mécanisme côté backend confirmée (worker ou tick lazy au scout/attaque). Si absent → ticket dédié avec design (worker pg-boss + EventOutbox vs lazy-on-read).
- [ ] Tests pure-logic étendus sur `barbarian-tier-templates.spec.ts` : 1 cas par tier (T1→T5 exhaustif), assertion sur total troupes par tier, proportions par tier, niveau Entrepôt par tier, `populationMax`. Conformes à `.claude/rules/tests.md` (aucun mock Prisma).
- [ ] `yarn workspace battleforthecrown-backend test` vert.
- [ ] `yarn workspace @battleforthecrown/shared build` vert.
- [ ] `docs/gameplay/06-barbarians.md` reste source unique (pas de duplication). Si écart de chiffrage entre code et doc, **doc gagne** ; modifier le code sauf décision design contraire tracée.
- [ ] Section `## Rapport final` remplie + commit final + QA hybride.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

### Tableau de confrontation spec ↔ code (Phase 1, état au démarrage)

| Tier | Template | Total troupes spec/code | Compo spec/code | Cap stockage spec/code | Roll troupes 60-100% | Roll ress 30-100% | Régen troupes | Régen ress | Sévérité |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | ✅/✅ | 15/0 | MILITIA / ∅ | 3000 (W=1) / 3970 (W=3) | spec / ❌ | spec / 30-60% | 0,5%/h / ❌ | 1%/h / ❌ | majeur |
| T2 | ✅/✅ | 35/0 | MILITIA+ARCHER / ∅ | 3000 (W=1) / 6040 (W=6) | spec / ❌ | spec / 30-60% | ~0,6%/h / ❌ | ~1,25%/h / ❌ | majeur |
| T3 | ✅/✅ | 70/0 | +SQUIRE / ∅ | 3450 (W=2) / 10570 (W=10) | spec / ❌ | spec / 30-60% | ~0,75%/h / ❌ | ~1,5%/h / ❌ | majeur |
| T4 | ✅/❌ | 110/— | +TEMPLAR / — | 3970 (W=3) / — | spec / — | spec / — | ~0,9%/h / — | ~1,75%/h / — | bloquant |
| T5 | ✅/❌ | 150/— | (idem T4) / — | 4565 (W=4) / — | spec / — | spec / — | 1%/h / — | 2%/h / — | bloquant |

### Décomposition exécutable (Phase 1, scope chirurgical)

- **T-A** — Élargir fourchette roll ressources de 30-60 % à 30-100 % dans `BarbarianVillageFactory.generateResources`. Conserver ratio iron 0.7 (justifié économie iron — run 001) + commentaire explicatif. (Lead direct, ≤ 10 lignes)
- **T-B+C** — `packages/shared/src/world/barbarian-templates.ts` : (1) ajouter `units?: UnitMap` au type `TierTemplate` ; (2) aligner Warehouse levels (T1=1, T2=1, T3=2) ; (3) étendre T4 + T5 (populationMax + buildings + Warehouse 3/4) ; (4) populer `units` par tier conformément spec (15 / 25-10 / 44-18-8 / 66-28-11-5 / 90-38-15-7) ; (5) helper `getUnits(tier)`. Data-only — la factory ne consomme pas (TICKET X1). (Implementer)
- **T-D** — Étendre `barbarian-tier-templates.spec.ts` : T1→T5 totaux/proportions/populationMax/warehouseLevel exhaustifs. Aucun mock Prisma. (Test-writer)
- **T-E** — Créer 4 tickets de follow-up (X1 troupes runtime / X2 régen / X3 strategy combat barbare / X4 rapport asymétrique).

### Hors scope 005 (tickets X1-X4)

- **X1** : persistance troupes barbares au runtime + roll initial 60-100 % du blueprint (table `ArmyUnit` ou champ JSON sur `Village`). Cascade impact : factory + strategy + scout + rapport combat. Périmètre estimé > 50 lignes.
- **X2** : régénération barbare troupes (0,5-1 %/h) + ressources (1-2 %/h). Design : worker pg-boss périodique vs lazy-on-read au scout/attaque. Aucun code n'existe aujourd'hui (grep négatif sur `regen`).
- **X3** : `BarbarianVillageStrategy.lossesAttacker` — calcul réel via blueprint barbare. Dépend de X1. Frontière run 004 (résolution combat générique).
- **X4** : rapport combat asymétrique victoire/défaite (spec § Lisibilité joueur > Rapport de combat). Impacte l'inbox — Phase 2.

## Points d'attention

- **Écart majeur — Tiers** : code définit T1/T2/T3 ; spec définit T1→T5. À confirmer en refinement si report MVP intentionnel. La doc 06 ne mentionne aucune limitation MVP des tiers ; donc écart à fixer.
- **Écart majeur — Troupes barbares** : `BarbarianVillageStrategy` commente *"Barbarians have no troops"* et `barbarian-tier-templates.ts` documente *"Barbarians own no troops at runtime — combat reads units: {}"*. La spec § Blueprint d'armée définit explicitement des troupes par tier. Soit la doc 06 est aspirationnelle, soit le code est un raccourci MVP qui doit être fixé. Le delta est gros — possiblement à segmenter en sous-ticket dédié.
- **Écart majeur — Régénération absente** : aucun fichier ne mentionne `regen` côté barbarian (grep négatif). La spec donne des chiffrages précis (1 %/h ressources T1 → 2 %/h T5, troupes 0,5 %/h T1 → 1 %/h T5). Probablement non implémenté → ticket avec design pattern à trancher.
- **Écart mineur — Roll initial** : spec dit 60-100 % troupes / 30-100 % ressources, code dit 30-60 % ressources (et pas de troupes). Iron ratio 0.7 du code n'a pas de pendant dans la spec.
- **Frontière 005 vs 004** : `BarbarianVillageStrategy.lossesAttacker = {}` recoupe la mécanique de combat globale (run 004). Trancher en refinement où l'écart est fixé.
- **Frontière 005 vs 007** : `BarbarianBackfillWorker.handleBackfill` réseed les villages détruits/conquis — c'est du spawning, pas de régen. **Strict hors-scope 005**.
- **Frontière 005 vs 006** : `conquest.service.ts` lignes 168-176 (filtre `isBarbarian`) sont du flow conquête → 006. Ne pas re-toucher.
- **Mécanique d'observabilité** : la spec § Rapport de combat (asymétrie victoire/défaite) impacte l'inbox (Phase 2). En Phase 1, on **constate** l'écart sans fixer — ticket à créer pour Phase 2.
- **Lecture du tier sur la carte** (sprite/couleur) : front, hors scope 005.
- **Initiative barbare OFF au MVP** : décision design stable. Confirmer simplement qu'aucun code n'attaque sortant depuis `isBarbarian: true`.

## Notes — segmentation Phase 1

5ᵉ sur 7. L'enjeu central est de **délimiter chirurgicalement** ce qui est fixable in-run vs ce qui devient ticket. Avant l'implémentation, lead doit trancher en refinement : (a) fix-in-run l'extension T4/T5 + roll resources, (b) ticket dédié pour l'introduction des troupes barbares au runtime, (c) ticket dédié pour la régen.

Confirmer en refinement que l'écart « blueprint troupes manquant » n'est pas une décision MVP retenue ailleurs (chercher dans ADRs `docs/architecture/decisions.md` avant de ticketter).

## Progress (rempli pendant le run)

- 2026-05-10 — Étape 0/1/2 : préflight OK (1 modif memory file mineure tolérée), spec lue, ADR scanné (aucune décision MVP "barbares sans troupes" tracée), code-mapper exécuté.
- 2026-05-10 — Étape 3 : refinement → décomposition T-A/T-B+C/T-D/T-E + 4 tickets follow-up. Statut RUNNING.
- 2026-05-10 — Étape 4 T-A (lead direct) : factory roll resources 30-60→30-100, ratio iron 0.7 conservé + commentaire.
- 2026-05-10 — Étape 4 T-B+C (implementer) : `barbarian-templates.ts` étendu (T4/T5), Warehouse levels alignés (1/1/2/3/4), `units` ajouté au type, helper `getUnits`. Diff +48/-9.
- 2026-05-10 — Étape 5 T-D (test-writer) : `barbarian-tier-templates.spec.ts` réécrit T1→T5 paramétré (totaux/compo/populationMax/warehouseLevel + fallbacks). 26/26 vert.
- 2026-05-10 — Étape 6 review : APPROVE, 0 bloquant/majeur, 3 mineurs.
- 2026-05-10 — Étape 7 fix mineurs (lead direct) : `units` rendu non-optionnel, `getUnits` simplifié (`??` + suppression `|| {}` redondant), commentaire iron clarifié sur le plancher 21 %.
- 2026-05-10 — Étape 8 re-test : 134/134 vert, build shared OK.
- 2026-05-10 — Étape 9 docs : aucun changement nécessaire (alignement code↔spec, spec inchangée, pas de nouvelle convention).
- 2026-05-10 — Étape 10 : tickets #36-39 créés, archive + commit.

## Décisions prises

- **Troupes barbares = data-only au niveau du template** (pas de persistance runtime in-run). La spec est explicite (15/35/70/110/150 par tier, proportions 60/25/10/5), mais introduire la persistance touche la factory + la table `ArmyUnit` + la strategy combat — > 50 lignes, dépassement scope. Trace : ticket #36.
- **Niveaux Warehouse alignés stricts spec** (T1=1, T2=1, T3=2, T4=3, T5=4). Conséquence : les nouveaux villages barbares spawnent avec un cap stockage **plus bas** que les villages legacy (3000-4565 vs anciens 3970-10570). Aucun impact sur les villages déjà seedés (DB conservée). Cohérent avec spec § Cap stockage (« niveau modeste des bâtiments barbares »).
- **Niveaux des autres bâtiments T4/T5** non contraints par la spec → progression naturelle au-dessus de T3 (Castle 13/16, Barracks 9/11, etc.). À revoir si le run 006 (conquête) ou un audit gameplay révèle un drift sur la matérialisation.
- **Ratio iron 0.7 conservé** dans la factory : la spec n'impose pas de ratio par ressource ; l'écart est tracé au commentaire (plancher iron à 21 % du cap, sous le 30 % spec) et justifié par l'équilibre économique iron (run 001 audit-economy).
- **`units` rendu non-optionnel** dans `TierTemplate` (review mineure adoptée) — force tout futur tier à fournir un blueprint, durcit le contrat shared.
- **Régénération barbare laissée hors run** — aucun mécanisme aujourd'hui. Design (worker pg-boss vs lazy-on-read) tracé dans le ticket #37.
- **`BarbarianVillageStrategy` non touchée** : `lossesAttacker = {}` et `lossesDefender = null` restent en place jusqu'à #36. Frontière run 004 respectée.

### Review findings (5 axes — agent-skills:code-reviewer)

- **Correctness** : 0 bloquant. 1 mineur (plancher iron 21 % sous 30 % spec) adressé via clarification du commentaire. 1 nit (`|| {}` redondant) adressé via simplification.
- **Readability** : APPROVE.
- **Architecture** : APPROVE — séparation shared (pure) / backend (orchestration) respectée, `units` data-only aligné sur le pattern existant.
- **Security** : RAS — pas de surface d'attaque sur ce diff.
- **Performance** : RAS — lookups O(1) sur record statique.

## Rapport final

### Synthèse

Run d'audit Phase 1 #5 sur 7. Code aligné sur la spec `06-barbarians.md` sur 3 axes : (1) catalogue tiers complet T1→T5, (2) blueprint chiffré data-only par tier, (3) Warehouse levels alignés (cap stockage spec). Hors scope mais identifié et tracé : persistance runtime des troupes (#36), régénération (#37), strategy combat barbare réelle (#38), rapport asymétrique défaite (#39).

### Fichiers touchés (5)

- `packages/shared/src/world/barbarian-templates.ts` (+57/-9) — T4/T5, champ `units` non-optionnel, Warehouse levels spec, helper `getUnits`.
- `battleforthecrown-backend/src/modules/world/barbarian-tier-templates.ts` (+1) — re-export `getUnits`.
- `battleforthecrown-backend/src/modules/world/barbarian-village.factory.ts` (+5/-2) — fourchette resources 30-100 % + commentaire iron 0.7.
- `battleforthecrown-backend/src/modules/world/barbarian-tier-templates.spec.ts` (+93/-55) — réécriture paramétrée T1→T5.
- `tasks/runs/005-audit-barbarians.md` (mise à jour).

Plus : 4 tickets ajoutés (`tasks/36-39.md`), `tasks/README.md` mis à jour.

### Tickets ouverts

- **#36 — Persistance runtime des troupes barbares + roll initial 60-100 %** (🟠 Majeur)
- **#37 — Régénération barbare absente** (🟠 Majeur, bloqué par #36)
- **#38 — `BarbarianVillageStrategy` : résolution combat réelle** (🟠 Majeur, bloqué par #36)
- **#39 — Rapport de combat asymétrique victoire/défaite** (🟢 Mineur, Phase 2)

### Tests

- `yarn workspace @battleforthecrown/shared build` ✅
- `yarn workspace battleforthecrown-backend test` ✅ 134/134.

### QA backend (vérifié par l'agent)

**Résultat attendu** : un nouveau village barbare T1-T5 spawn avec les niveaux de bâtiments alignés sur la spec et un stock ressources dans 30-100 % du cap (iron à 21-70 %).

- [x] Build shared vert (`tsc -p tsconfig.json`).
- [x] Tests unit pure-logic verts (10 suites, 134 tests).
- [x] Helper `getWarehouseLevel(tier)` retourne 1/1/2/3/4 → cap `getWarehouseStorageLimit` mappe à 3000/3000/3450/3970/4565 (spec).
- [x] `getUnits('T5')` retourne `{ MILITIA: 90, ARCHER: 38, SQUIRE: 15, TEMPLAR: 7 }` (somme 150).

### QA — pas de test nécessaire (raison : aucun effet observable in-game)

Les changements sont **data-only au runtime** (les villages barbares ne consomment pas encore le blueprint `units`, la factory continue de créer les mêmes entités sans `ArmyUnit`). Le seul effet observable est la fourchette de stocks ressources élargie sur les futurs spawns (impact playtest à terme, non vérifiable visuellement à coup d'œil). Visibilité réelle conditionnée à #36.

### Méta-évaluation

- **Périmètre tenu** : 5 fichiers touchés, scope chirurgical respecté, aucune dérive sur conquête/seeding.
- **Sub-agents** : 1 code-mapper + 1 implementer + 1 test-writer + 1 code-reviewer + 2 test-runner — 0 dérogation lead, 0 retry.
- **Hard gates** : 4 git diffs vérifiés, tous cohérents avec les rapports STATUS=success.
- **Tickets follow-up** : 4 tickets opérationnels créés avec dépendances claires (#37/#38 bloqués par #36).
