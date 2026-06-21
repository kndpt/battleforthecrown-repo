# Run #055 — feature-intel-notebook

> **Statut** : DONE
> **Démarré** : 2026-06-20
> **Terminé** : 2026-06-20

## Cible

- **Phase roadmap** : Phase 4 — Scouting (aide MVP léger : carnet d'intel, déclarée mais non livrée par les runs 016/017)
- **Spec source** : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md) §§ « Carnet d'intel minimal (MVP léger) » (lignes 48-80)
- **Type** : `feature`
- **Modules backend** : nouveau module `intel`, hooks dans `combat.worker.ts` + `conquest.service.ts`, `OutboxPublisher`
- **Modules frontend** : `features/world/SelectedEntityPanel`, nouveau `api/queries/useVillageIntelQuery`, binding WS `intel.updated`

## Dépendances

- Phase 4 Scouting livrée : runs [`016`](archive/016-feature-scouting-backend-shared.md) et [`017`](archive/017-feature-scouting-frontend-inbox.md) — producer `ScoutReport` + UI inbox déjà en place.
- Phase 5 Conquête barbare livrée : runs [`018`](archive/018-feature-barbarian-conquest-backend-shared.md) et [`019`](archive/019-feature-barbarian-conquest-frontend-ui.md) — combat conquête victorieux disponible comme source supplémentaire d'intel.
- Aucun prérequis bloquant.

## Critère de fin (acceptance)

- [ ] `GET /worlds/:worldId/intel/:villageId` retourne 200 avec le dernier snapshot après un scout réussi sur la cible (smoke curl : POST scout → finalize → GET intel).
- [ ] Après combat victorieux de l'attaquant sur le même village, `seenAt` est mis à jour et `sourceKind` vaut `COMBAT_WIN` avec `sourceReportId` pointant le `CombatReport`.
- [ ] Combat **perdu** ou occupation défensive ne met **pas** à jour l'intel de la cible côté attaquant (smoke de régression).
- [ ] `GET` sur une cible jamais observée renvoie une réponse binaire stable (200 + `null` ou 404 — tranché en T1).
- [ ] Contrainte unique `(userId, worldId, targetVillageId)` sur `village_intel` ; double scout produit un upsert, pas un duplicata (vérif SQL).
- [ ] Event `intel.updated` inséré dans `event_outbox` dans la même transaction que l'upsert, payload `{ userId, worldId, villageId }`.
- [ ] Aucun accès Prisma `villageIntel` depuis un controller (grep séparation Nest).
- [ ] **Visuel** — panneau d'entité (clic village ennemi sur la carte) affiche la section `Dernière intel` avec armée/stock/rempart/style + âge `il y a Xh` quand l'intel existe, et `Aucune intel` sinon.
- [ ] **Visuel** — CTA `Voir rapport source` ouvre le `ReportDetailModal` du `ScoutReport` ou `CombatReport` sourceur.
- [ ] Test Vitest `intelView` : âge `< 1h` → `il y a Xmn` ; `< 24h` → `il y a Xh` ; `≥ 24h` → `il y a Xj`.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Pré-rempli par `bftc-plan` ; le lead peut affiner à l'étape 3.)_

- **T1** — Schéma + migration `VillageIntel` (`schema.prisma`, migration SQL générée). Trancher : 200 `null` vs 404 sur intel inexistante. Trancher : `observerUserId` reçoit-il aussi un upsert ?
- **T2** — Shared DTO + event : `packages/shared/src/world/dtos.ts` (`VillageIntelDto`, `IntelSource`), `packages/shared/src/world/index.ts`, `packages/shared/src/events/intel.ts`.
- **T3** — Module backend `intel/` : `intel.service.ts` (upsert + getOne), `intel.controller.ts` (`GET /worlds/:worldId/intel/:villageId` + Zod DTO), `intel.module.ts`, branchement dans `AppModule`.
- **T4** — Producer scout : hook upsert intel après `tx.scoutReport.create` dans `combat.worker.ts`, méthode `OutboxPublisher.intelUpdated()`.
- **T5** — Producer combat victorieux : hook upsert dans `combat.worker.ts` (branche victoire attaquant offensive) et `conquest.service.ts` (capture finalisée). Exclure défense + occupation défensive.
- **T6** — Tests backend : `intel.service.spec.ts` (upsert idempotent, unique constraint, exclusion combat perdu). Smoke ciblé `intel.smoke.spec.ts` couvrant le triptyque scout / combat victorieux / combat perdu.
- **T7** — Front API + view : `useVillageIntelQuery.ts`, listener WS `intel.updated` (invalidation ciblée clé `['intel', worldId, villageId]`), `intelView.ts` (mapping DTO → viewmodel + helper d'âge).
- **T8** — UI panneau : section `Dernière intel` dans `SelectedEntityPanel.tsx` + tests Vitest (`intelView.test.ts` + extension `SelectedEntityPanel.test.tsx`).

Chaque tâche reste ≤ 5 fichiers.

## Progress (rempli pendant le run)

_(git history)_

## Décisions prises

_(git history — synthèse durable dans `docs/architecture/data-model.md` § Combat `VillageIntel` et `docs/architecture/realtime.md` § `intel.updated`.)_

## Rapport final

Carnet d'intel MVP livré bout-en-bout : table `VillageIntel` (upsert privé par observateur, sémantique par-champ « si révélé »), endpoint `GET /worlds/:worldId/intel/:villageId`, producteurs scout + combat-win dans `CombatWorker`, event WS `intel.updated` (privé à l'observateur), et section « Dernière intel » + CTA rapport source dans `SelectedEntityPanel`. Review indépendante : BLOCK cycle 1 (combat écrasait wall/style du scout) → fix par-champ + régression smoke → GO cycle 2.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] GET intel 200 + dernier snapshot après scout — `yarn workspace battleforthecrown-backend test:smoke:run -- intel.smoke.spec.ts` → 8/8 (scénario scout→GET)
  - [x] Combat gagné → `seenAt` maj + `sourceKind=COMBAT_WIN` + `sourceReportId`=CombatReport — `intel.smoke.spec.ts` (scénario combat-win)
  - [x] Combat perdu / occupation défensive → pas d'upsert — `intel.smoke.spec.ts` (régression : garde `isVictory && !occupationDefense`)
  - [x] GET cible jamais observée → réponse binaire stable **200 + `null`** (tranché T1) — `intel.smoke.spec.ts` + front `client.ts` (body vide→null) + `queries.ts` (`?? null`)
  - [x] Unique `(userId, worldId, targetVillageId)` ; double scout = upsert — `intel.smoke.spec.ts` (`villageIntel.count`==1, `seenAt` croissant) + migration `@@unique`
  - [x] Event `intel.updated` même tx, payload `{userId,worldId,villageId}` — `intel.smoke.spec.ts` (`eventOutbox.findFirst kind='intel.updated'`)
  - [x] Aucun Prisma `villageIntel` depuis un controller — `rg "villageIntel" battleforthecrown-backend/src/modules/intel/intel.controller.ts` → 0 match (controller délègue au service)
  - [ ] **Visuel** panneau « Dernière intel » (armée/stock/rempart/style + âge) ou « Aucune intel » — IG Kelvin
  - [ ] **Visuel** CTA « Voir rapport source » ouvre `ReportDetailModal` du scout/combat sourceur — IG Kelvin
  - [x] Vitest `intelView` âge mn/h/j — `yarn workspace battleforthecrown-pixi test -- intelView` → vert (bascules 60mn=1h, 24h=1j)
- **Review indépendante** : `Déclenchée (raison : (a) back+front, (c) diff > 100 lignes, (d) invariant durable VillageIntel)` → cycle 1 `BLOCK` (1 majeur : COMBAT_WIN écrasait wall/style) → findings résolus (update par-champ + régression smoke) → cycle 2 `GO`.
- **Tests automatisés** : `yarn static-check` → vert (shared+back+pixi). `yarn workspace battleforthecrown-pixi test -- intelView SelectedEntityPanel client` → 29/29.
- **Smokes lancés** : `test:smoke:preflight` + `test:smoke:run -- intel.smoke.spec.ts` → **8/8** (Ciblés ; diff backend `src/` localisé intel + hooks combat, pas transversal).
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/intel.smoke.spec.ts` (créé) — scout→GET, never-observed→null, double scout=1 row, combat-win→COMBAT_WIN, combat-perdu→pas d'upsert (+ intel scout préalable inchangée), outbox `intel.updated`, et régression scout(wall+style)→combat-win conserve wall/style.
- **QA fonctionnelle agent** : couverte par le smoke (worker scout + worker combat réels + GET HTTP + `eventOutbox`/`villageIntel` DB). Pas de curl manuel séparé — le smoke exécute le triptyque bout-en-bout.
- **Tests IG à faire par le user** : 1) village ennemi **scouté** → panneau « Dernière intel » avec armée/stock/rempart/style + âge ; 2) village **attaqué & gagné** → intel maj, CTA ouvre le rapport combat ; 3) village **jamais observé** → « Aucune intel ».

## Points d'attention (notes du plan)

- **Privacy** : `VillageIntel.userId` = scout/attaquant ; jamais lu par un autre joueur. Vérifier que `OwnershipService` (ou guard équivalent) couvre la route `GET /worlds/:worldId/intel/:villageId`.
- **Combat révélateur** : à refinement T1, lister exactement quels `CombatReport` déclenchent l'upsert — victoire offensive `PLAYER_VILLAGE` + `BARBARIAN_VILLAGE` uniquement ; exclure défense, occupation défensive, retours de capture déjà terminés.
- **Observers** : la spec dit `privée au joueur qui a obtenu le rapport`. Trancher en refinement si `observerUserId` reçoit aussi un upsert (probablement oui, sans sharing tribu).
- **Snapshot fidélité** : utiliser `units`/`resources` du `ScoutReport` tels quels ; côté combat, `totalUnitsDefender` / `loot`. Vérifier mapping `UnitMap` vs `LossesMap`.
- **Wall / style** : `wallLevel` vient des `details` du `ScoutReport` ; côté `CombatReport`, vérifier si disponible — sinon laisser `null`.
- **Outbox** : créer `OutboxPublisher.intelUpdated()` plutôt qu'un `tx.eventOutbox.create` inline (cohérence avec `resourcesChanged`).
- **Invalidation WS frontend** : sur réception `intel.updated`, n'invalider que la query du village concerné (clé `['intel', worldId, villageId]`), pas un invalidate global.
- **Ticket lab** : `docs/gameplay/lab/tickets/11-intel-notebook.md` est conservé pour trace mais doit pointer vers ce run dans le récap final.
- **Hors scope explicite** : pas de fiche par joueur, pas d'historique multi-snapshots, pas de notes libres, pas de partage tribu, pas de Menace estimée (run séparé `après`).

## Liens

- **Après** : run « Menace estimée avant attaque » (consumer du carnet, spec [`docs/gameplay/11-scouting.md` lignes 82-118](../../docs/gameplay/11-scouting.md)) — à planifier dès que ce run est `DONE`.
- **Connexes** : [016-feature-scouting-backend-shared](archive/016-feature-scouting-backend-shared.md), [017-feature-scouting-frontend-inbox](archive/017-feature-scouting-frontend-inbox.md), [047-feature-capture-reports](archive/047-feature-capture-reports.md), [044-feature-reinforcement-reports](archive/044-feature-reinforcement-reports.md).
