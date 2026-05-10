# Run #011 — fix-return-worker-decouple-report

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (fix d'écart code/spec sur le flow combat, post-archive du run 004-audit-combat).
- **Spec source** :
  - [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) — flow combat/return (pas d'exigence explicite « report persistant pour le retour » ; le rapport est un artefact UX destiné à l'inbox, pas un prérequis au retour des troupes).
  - [`docs/architecture/realtime.md`](../../docs/architecture/realtime.md) — pattern Outbox + transaction unique resolve.
  - [`docs/architecture/smoke-tests.md`](../../docs/architecture/smoke-tests.md) — procédure smoke pour orchestration worker.
- **Type** : `fix`
- **Modules backend** : `combat` (`combat.worker.ts`, `return.worker.ts`), `prisma/schema.prisma` + migration.
- **Modules frontend** : —

## Dépendances

Aucune. Run autonome.

Les 4 expéditions actuellement bloquées en DB (`cmp0768ps0000vdxlh3zv0zj3`, `cmoxg1k8l0000vd5mfg9loln0`, `cmox6bs4x0003vd0mmhsm9nv9`, `cmou8vwkw0003vdrif8y42s60`) **ne sont pas** une dépendance — hors-scope explicite, à traiter dans un run de cleanup séparé si nécessaire.

## Critère de fin (acceptance)

- [ ] Migration Prisma `prisma migrate dev` ajoute deux colonnes nullables `surviving_units jsonb` et `loot jsonb` sur `expedition`, sans rétro-remplissage.
- [ ] `combat.worker.ts` (handleResolve) écrit `survivingUnits` (UnitMap encodé) et `loot` (LootResult encodé) sur `expedition` dans la **même transaction** que la création du `CombatReport` et le passage en `RETURNING`.
- [ ] `return.worker.ts` (handleReturn) ne contient **plus** `include: { report: true }` et ne lit **plus** `expedition.report.*`. Calcul des survivants et du butin via `expedition.survivingUnits` + `expedition.loot`.
- [ ] Si l'user supprime le `CombatReport` via `DELETE /combat/reports/:id` pendant le voyage retour, le `ReturnWorker` exécute jusqu'au bout : `expedition` supprimée, `UnitInventory` incrémenté des survivants, `ResourceStock` incrémenté du butin, event `battle.returned` émis.
- [ ] L'event `battle.returned` reste fonctionnel côté frontend : payload `{ expeditionId, reportId, villageId, survivingUnits, loot }` (avec `reportId` possiblement null désormais).
- [ ] La branche `expedition.recalled === true` (run 010) reste inchangée : aucun report produit, survivants lus depuis `expedition.units`.
- [ ] Smoke ajouté qui reproduit le scénario bug : attack → resolve → DELETE report → return → expédition disparue, inventaire correct, event émis. **Doit échouer sur main** (preuve d'utilité), passer après fix.
- [ ] `yarn workspace battleforthecrown-backend test` (unit pure-logic) vert.
- [ ] `yarn workspace battleforthecrown-backend test:smoke` vert (incluant le nouveau scénario).
- [ ] `yarn static-check` (racine) vert.

## Règles à respecter

- Tests : @.agents/rules/tests.md
- QA : @.agents/rules/qa.md
- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

1. **T1 — Schema + migration**. Ajouter `survivingUnits Json?` + `loot Json?` sur `Expedition` (mapping snake_case). Migration `decouple_expedition_from_report` via `yarn prisma migrate dev`. Vérifier que le `onDelete` implicite de `Expedition.report` reste bien `SetNull` (c'est la cascade qui cause le bug actuel — elle ne change pas, c'est le **consommateur** qui se découple).
2. **T2 — combat.worker.ts (resolve)**. Lignes 314-371 : après création du `CombatReport`, dans la même `tx.expedition.update`, remplir `survivingUnits` (calcul `originalUnits - lossesAttacker` avec `encodeUnitMap`) et `loot` (`encodeLootResult(resolution.loot)`). Garder `reportId: report.id` pour conserver le lien d'affichage côté UI.
3. **T3 — return.worker.ts (return)**. Lignes 38-172 : retirer `include: { report: true }` ; lire `expedition.survivingUnits` et `expedition.loot` via `parseUnitMap` / `parseCombatLoot`. Conserver la branche `expedition.recalled === true` à l'identique. Préserver `reportId` dans le payload `battle.returned` en le lisant depuis `expedition.reportId` (peut être null).
4. **T4 — Smoke**. Ajouter dans `battleforthecrown-backend/test/smoke.spec.ts` un `it()` « combat: report deleted in-flight → troops still return ». Pattern : seedSmokeWorld → registerUser → joinWorld → train → POST attack → waitFor resolve → DELETE report → waitFor return → asserter (a) expédition supprimée, (b) UnitInventory incrémenté, (c) event `battle.returned` dispatché. **Vérifier que le smoke échoue sur main** avant d'appliquer le fix.
5. **T5 — Documentation**. Selon impact réel : note dans `docs/architecture/realtime.md` ou `docs/gameplay/04-combat.md` — « le retour des troupes ne dépend plus du CombatReport ; la suppression du report par l'user pendant le voyage retour est sans effet sur le worker de retour ». Vérification d'impact doc obligatoire (cf. `.agents/rules/docs.md`).
6. **T6 — QA**. Backend (agent, port 15002) : créer 1 attaque player→barbare, attendre resolve, `DELETE /combat/reports/:id`, attendre return, vérifier DB (`expedition` gone, `unit_inventory` + `resource_stock` corrects). Nettoyer fixtures (`email LIKE 'qa-%'`). User IG (3 cases) : lancer une attaque, supprimer le rapport dans l'inbox dès qu'il apparaît, vérifier que les troupes reviennent quand même au village.

## Points d'attention

- **Backward compat sur les 4 expés bloquées** : leurs colonnes `surviving_units` et `loot` resteront NULL. Si le fix est déployé sans cleanup, le `ReturnWorker` les rencontrera et `parseUnitMap(null, …)` va probablement throw. **À trancher en refinement** : (a) ajouter un guard « si NULL → log warn + return sans throw » pour ne pas spammer pg-boss en retry infini, ou (b) accepter que ces 4 cas restent stuck jusqu'à un run cleanup. Recommandation par défaut : (a) — fail-safe peu coûteux.
- **Front robuste à `reportId: null`** dans `battle.returned` : vérifier `battleforthecrown-pixi/src/api/ws-bindings.ts` au moment du fix. Si la cascade `SET NULL` se déclenche entre le `findUnique` du return worker et l'envoi de l'event, `reportId` peut être null.
- **Smoke timing** : forcer `gameSpeed.travel` au minimum (clamp 1s) dans le `WorldConfig` du seed smoke pour que la fenêtre « DELETE entre resolve et return » soit observable en < 5s. Vérifier `test/fixtures/smoke-world-config.ts`.
- **`combat.service.ts:deleteReport`** (ligne ~650) reste inchangé — c'est la cascade Prisma qui met `reportId` à null. Confirmer en T1 que `Expedition.report` a bien `onDelete: SetNull` implicite (relation optionnelle Prisma) — sinon le diagnostic root-cause est faux.
- L'event `battle.resolved` n'est pas modifié dans ce run. On pourrait y ajouter `survivingUnits` pour cohérence mais hors-scope.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, QA résiduelle qui revient à toi, méta-évaluation si applicable.)_
