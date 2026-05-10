# Run #005 — audit-barbarians

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

Pré-décomposition indicative (8 tâches) :

- T1 — Cartographie écarts blueprint : confronter `BARBARIAN_TIER_TEMPLATES` (3 tiers, buildings only) vs spec § Blueprint d'armée (5 tiers, totaux + diversité). Lister tickets.
- T2 — Étendre catalogue T4/T5 dans `packages/shared/src/world/barbarian-templates.ts` (buildings + populationMax).
- T3 — Ajouter champ `units` (UnitMap par tier) au type `TierTemplate` shared, exposer le blueprint chiffré aligné sur la spec.
- T4 — Câbler `BarbarianVillageFactory` pour rouler troupes initiales 60-100 % du blueprint et **persister** les unités (table `ArmyUnit` côté Village barbare ou champ JSON — décision design dans le run).
- T5 — Aligner `BarbarianVillageFactory.generateResources` sur la fourchette spec 30-100 % et clarifier (ou supprimer) le ratio iron 0.7.
- T6 — Confronter `BarbarianVillageStrategy` à la spec : statuer sur les pertes attaquant (fix ou ticket vers run 004 si recouvre la résolution générique).
- T7 — Régénération troupes + ressources : audit présence/absence du mécanisme. Si absent → ticket dédié `tasks/3X-barbarian-regeneration.md` avec design (worker pg-boss vs lazy-on-read). **Hors run.**
- T8 — Étendre `barbarian-tier-templates.spec.ts` : test pure-logic exhaustif T1→T5 (totaux, proportions, populationMax, warehouseLevel). Aucun mock Prisma.

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

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage.)_

## Rapport final

_(Vide au démarrage.)_
