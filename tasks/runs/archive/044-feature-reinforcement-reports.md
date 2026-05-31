# Run #044 — feature-reinforcement-reports

> **Statut** : DONE
> **Démarré** : 2026-05-31
> **Terminé** : 2026-05-31

## Cible

- **Phase roadmap** : Phase 2 — Inbox & rapports
- **Spec source** :
  - [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) — renforts, garnison, rappel/renvoi.
  - [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) — inbox persistante, source de vérité, read/delete.
- **Type** : feature
- **Modules backend** : `combat` (`combat.worker.ts`, `combat.service.ts`, controller/report endpoints), Prisma reports/inbox, `event-outbox.service.ts` si invalidation nécessaire
- **Modules frontend** : `pixi/features/combat`, `pixi/api/queries.ts`, `pixi/api/ws-bindings.ts`
- **Modules shared/docs** : `packages/shared/src/combat`, `packages/shared/src/events`, `docs/gameplay/17-inbox-and-reports.md`, `docs/architecture/data-model.md`, `docs/architecture/realtime.md`
- **REVIEW_INDÉPENDANT_REQUIS** : oui

## Décision architecture retenue

Implémenter la solution propre suivante, pas un quickwin :

- Créer un modèle métier dédié `ReinforcementReport` pour les faits de renfort :
  - type d'événement : `STATIONED` / `RETURNED` ;
  - village d'origine, village hôte, unités, timestamp ;
  - acteur du rappel/renvoi quand applicable.
- Créer une couche inbox générique par destinataire, par exemple `InboxEntry` :
  - `userId`, `worldId`, `kind`, `reportId`, `isRead`, `hidden`, `timestamp` ;
  - une ligne par destinataire unique ;
  - si l'origine et l'hôte appartiennent au même joueur, une seule entrée.
- Garder `EventOutbox` comme canal temps réel uniquement, jamais comme archive métier.
- Ne pas forcer les renforts dans `CombatReport` : un renfort n'a ni attaquant/défenseur, ni pertes, ni loot, ni issue victoire/défaite.
- Ne pas introduire une table `Report` transverse fourre-tout portée par du JSON métier. Le contenu métier reste typé par domaine.
- Ne pas migrer destructivement combat/scout dans ce run. Le run peut poser `InboxEntry` pour les renforts et documenter la trajectoire de migration progressive si elle est pertinente.

## Dépendances

- Run [`010 — Implémentation frontend renforts`](./archive/010-implementation-frontend-reinforcements.md) ✅ DONE : actions `Renforcer`, `Rappeler`, `Renvoyer`, endpoint garnison et events WS.
- Ticket [`68 — Renvoyer un renfort étranger`](../archive/68-send-back-foreign-reinforcement-no-return-trip.md) ✅ DONE : renvoi hôte -> origine fonctionnel.
- Run [`012 — Inbox combat reports`](./archive/012-feature-inbox-combat-reports.md) ✅ DONE : inbox combat persistante avec read/delete par participant.
- Ticket [`53 — Rapport défenseur manquant quand une capture est attaquée`](../archive/53-capture-occupation-defense-report-missing.md) ✅ DONE : précédent invariant similaire, une défense par troupes non propriétaires doit laisser une trace inbox.

## Critère de fin (acceptance)

- [ ] À l'arrivée d'un renfort stationné, un `ReinforcementReport` persistant est créé avec origine, hôte, unités, type `STATIONED` et timestamp. Preuve : test/smoke + SQL.
- [ ] À l'arrivée d'un renfort stationné, une entrée inbox non lue existe pour l'expéditeur et une entrée inbox non lue existe pour le receveur/hôte. Preuve : test/smoke + SQL.
- [ ] Lors d'un `Rappeler` ou `Renvoyer`, l'arrivée au village d'origine crée un rapport type `RETURNED` avec les unités revenues et l'acteur du rappel/renvoi quand connu. Preuve : test/smoke + SQL.
- [ ] Le retour crée une entrée inbox non lue pour chaque joueur concerné, sans doublon quand origine et hôte appartiennent au même user. Preuve : test/smoke.
- [ ] Chaque joueur ne voit que ses propres entrées de renfort dans l'inbox ; lecture et suppression modifient uniquement son entrée. Preuve : test REST/curl.
- [ ] L'inbox frontend affiche les rapports de renfort dans la liste, triés avec combat/scout, avec un tag distinct et un wording clair `Arrivé en soutien` vs `Retour au village`. Preuve : test Pixi + inspection visuelle.
- [ ] Le détail frontend d'un rapport renfort affiche unités, village origine, village hôte, sens métier et timestamp, sans réutiliser les composants victoire/défaite combat. Preuve : test Pixi + inspection visuelle.
- [ ] Le badge messages et les queries inbox se rafraîchissent après arrivée stationnée et retour, sans dépendre uniquement d'un toast volatile. Preuve : test `ws-bindings` ou invalidation ciblée + smoke.
- [ ] Les rapports combat et scout existants restent listés, lisibles, marquables lus et supprimables sans régression. Preuve : tests existants + smoke inbox.
- [ ] Supprimer un rapport renfort ne bloque jamais la restitution des unités ni le traitement du worker. Preuve : smoke retour avec entrée supprimée si faisable, sinon test service ciblé + justification.
- [ ] La documentation explique clairement la frontière : `ReinforcementReport` = fait métier, `InboxEntry` = état par destinataire, `EventOutbox` = temps réel. Preuve : docs mises à jour.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma`
- Workers/Outbox : skill `bftc-workers-outbox`
- React HUD : skill `bftc-react-hud`

## Décomposition initiale (rempli par le lead à l'étape 3)

Architecture retenue (confirmée par cartographie) :

- **`ReinforcementReport`** = fait métier (type `STATIONED`/`RETURNED`, origin/host village + snapshot nom/coord, units, actorUserId du rappel/renvoi, timestamp). Aucune notion de victoire/défaite/loot.
- **`InboxEntry`** = état par destinataire (`userId`, `worldId`, `kind=REINFORCEMENT`, `reinforcementReportId` FK typé, `isRead`, `hidden`, `timestamp`). Une ligne par destinataire ; dédoublonnée quand origin owner == host owner.
- **`EventOutbox`** reste temps réel : on réutilise `garrison.added` (STATIONED, → host owner) et `reinforcement.returned` (RETURNED, → origin owner) pour invalider l'inbox côté front. **Aucun nouvel event kind** (mono-user reinforce aujourd'hui ; le data-layer supporte 2 users).

Tâches chirurgicales :

- **T1 — Prisma schema + migration additive** (`prisma/schema.prisma`, migration, `prisma-shared-enums.ts`). Enums `ReinforcementReportType`, `InboxKind` ; models `ReinforcementReport`, `InboxEntry` ; colonne nullable `Expedition.reinforcementRecallActorUserId`. Critère : `migrate deploy` + `generate` clean, compile check enum OK.
- **T2 — Shared DTO** (`packages/shared/src/combat/dtos.ts` + `index.ts`). `ReinforcementReportType` union + `ReinforcementReportResponse`. Critère : build shared OK.
- **T3 — Worker: création report + inbox** (`combat.worker.ts` `handleReinforcementArrival`, `combat.service.ts` `initiateRecall`). STATIONED + RETURNED → `ReinforcementReport` + `InboxEntry` (dédoublonné) dans la tx ; actor renseigné via colonne. Critère : SQL montre report + 2 entrées (ou 1 si mono-user).
- **T4 — Service + endpoints REST** (`reinforcement-report.service.ts`, `reinforcement-report.presenter.ts`, `combat.controller.ts`, `combat.module.ts`). GET list/detail + PATCH read + DELETE, scoping `userId`+`worldId`, mutation only sur l'entrée du viewer. Critère : curl isolation read/delete par user.
- **T5 — Front queries + badge + ws-bindings** (`queries.ts`, `useUnreadReportsCount.ts`, `ws-bindings.ts`). queryKeys + hooks symétriques ; badge inclut renfort ; invalidation sur `garrison.added` + `reinforcement.returned`. Critère : compile + badge compte renfort.
- **T6 — Front liste + détail** (`ReportsList.tsx`, `ReportDetailModal.tsx`, `reinforcementReportView.ts`, `MessagesScreen` type). 3e kind `reinforcement`, tag distinct + wording `Arrivé en soutien` / `Retour au village` ; détail unités/origin/host/sens/timestamp sans composant combat. Critère : rendu liste + détail.
- **T7 — Tests** : back unit (dédoublonnage destinataires / presenter), smoke arrivée + retour ; front view helper. Critère : verts.
- **T8 — Docs** : `docs/gameplay/17-inbox-and-reports.md`, `docs/architecture/data-model.md`, `docs/architecture/realtime.md`. Frontière report/inbox/outbox. Critère : docs à jour.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

- **D1 — Pas de nouvel event kind WS.** Réutilisation de `garrison.added` (STATIONED → host owner) et `reinforcement.returned` (RETURNED → origin owner) pour invalider la query inbox renfort côté front. Justif : reinforce est mono-user aujourd'hui (`initiateReinforce` interdit le renfort inter-joueurs) ; le data-layer (2 `InboxEntry`) supporte déjà 2 users, et le destinataire distant rafraîchira au prochain refetch/focus/reconnexion. Évite de toucher event-types/codecs/exhaustive map pour un cas non encore ouvert.
- **D2 — `InboxEntry` à FK typée**, pas de `reportId` polymorphe JSON. `reinforcementReportId` nullable + `kind` enum extensible. Conforme à la décision archi de la fiche (contenu métier typé par domaine).
- **D3 — Acteur du rappel/renvoi** porté par une colonne nullable additive `Expedition.reinforcementRecallActorUserId` (renseignée dans `initiateRecall`), lue par le worker à l'arrivée RETURNED. Le recall en-route (`recallEnRoute`, voie `combat:return`) ne crée pas de rapport : le renfort n'a jamais stationné → hors scope rapport (documenté).
- **D4 — `:id` exposé = id du `ReinforcementReport`** ; read/delete résolvent l'`InboxEntry` du viewer via `(userId, worldId, reinforcementReportId)` (unique). Miroir du pattern combat (un id de rapport, état par participant).

## Progress

- Préflight OK (git clean, branche `claude/eager-gauss-H5dOY`, mode run, `PR_REQUIRED: oui`).
- Cartographie back + front + shared faite (2 code-mappers).
- Refinement consigné. T1→T8 livrés (schema/migration, shared DTO, worker, REST, front queries/badge/ws, front liste/détail, tests, docs).
- Tests verts : front 258, back unit 232, smokes ciblés 5/5 (`reinforcements.smoke` + `combat-reports-inbox.smoke`). `yarn static-check` vert.
- Review indépendante : VERDICT **GO** (0 bloquant / 0 majeur).
- SPEC.md : V5 ajouté (frontière report typé / InboxEntry / Outbox).

### Findings review (nits, non bloquants)

- Dédoublonnage destinataires multi-user (`new Set` worker) non exercé par smoke : renfort inter-joueurs interdit (`initiateReinforce`), donc cas non atteignable via API ; logique triviale.
- `ReinforcementReport` + `InboxEntry` créés dans la même tx que la restitution (pattern Outbox du repo : event WS aussi dans la tx). Le critère « retour indépendant du rapport » est garanti côté suppression (soft-delete `hidden`), pas côté création — acceptable.
- Report potentiellement orphelin si village sans owner (barbare) : non atteignable (renfort = villages joueurs uniquement), invisible inbox, pas de fuite.

## Rapport final

Implémentation de la solution propre : modèle métier dédié `ReinforcementReport` (STATIONED/RETURNED) + inbox générique par destinataire `InboxEntry` (FK typée, pas de table fourre-tout), `EventOutbox` gardé comme canal temps réel. Renforts non forcés dans `CombatReport`. Migration strictement additive.

**Fichiers touchés (22)** :

- Shared : `packages/shared/src/combat/dtos.ts` (type `ReinforcementReportType` + DTO `ReinforcementReportResponse`).
- Prisma : `prisma/schema.prisma` (+ enums `ReinforcementReportType`/`InboxKind`, models `ReinforcementReport`/`InboxEntry`, colonne `Expedition.reinforcementRecallActorUserId`), migration `20260531201842_reinforcement_reports_inbox`, `src/common/prisma-shared-enums.ts` (compile-check enum).
- Backend combat : `combat.worker.ts` (création report+inbox à l'arrivée STATIONED/RETURNED), `combat.service.ts` (actor du rappel/renvoi), `reinforcement-report.service.ts` + `reinforcement-report.presenter.ts` (nouveaux), `combat.controller.ts` (4 routes REST), `combat.module.ts` (provider).
- Frontend : `api/queries.ts` (queryKeys + 4 hooks), `useUnreadReportsCount.ts` (badge), `api/ws-bindings.ts` (invalidation renfort), `ReportsList.tsx` (3e kind + tag/wording), `ReportDetailModal.tsx` (détail renfort), `reinforcementReportView.ts` (nouveau).
- Tests : `test/reinforcements.smoke.spec.ts` (+1 `it`), `reinforcementReportView.test.ts` (nouveau).
- Docs : `docs/gameplay/17-inbox-and-reports.md`, `docs/architecture/data-model.md`, `docs/architecture/realtime.md`.
- SPEC : `SPEC.md` (V5).

**Tickets ouverts** : aucun. **Trajectoire migration** : `InboxEntry` posé comme fondation extensible (`kind` enum) ; migration progressive combat/scout vers `InboxEntry` non faite (hors scope, non destructif).

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Rapport `STATIONED` persistant + entrées inbox par destinataire — `test:smoke:run reinforcements.smoke` (assert `prisma.reinforcementReport` STATIONED + `prisma.inboxEntry` isRead=false) → 5/5 PASS.
  - [x] Rapport `RETURNED` persistant + actor + entrées inbox — même smoke (assert RETURNED + `actorUserId === userA`) → PASS.
  - [x] Isolation read/delete par user, delete = `hidden=true`, report physique conservé — même smoke (PATCH read → isRead=true ; DELETE → InboxEntry.hidden=true, `reinforcementReport.findUnique` toujours présent, absent du GET list) → PASS.
  - [x] Frontend liste : tag distinct + wording — `reinforcementReportView.test.ts` (`'Arrivé en soutien'`/`'Retour au village'`, tag SOUTIEN/RETOUR) → 10/10 ; rendu visuel → IG.
  - [x] Frontend détail unités/origine/hôte/sens/timestamp sans composant combat — `ReportDetailModal.tsx` `ReinforcementReportDetail` (BaseModal inline, pas de `CombatReportModal`) ; rendu visuel → IG.
  - [x] Invalidation badge/messages — `useUnreadReportsCount.ts` compte renfort + `ws-bindings.ts` `invalidateReinforcementReports` sur `garrison.added`+`reinforcement.returned` ; `yarn workspace battleforthecrown-pixi test` → 258/258 PASS.
  - [x] Non-régression combat/scout — `combat-reports-inbox.smoke` PASS + back unit `yarn workspace battleforthecrown-backend test` 232/232 PASS.
  - [x] Retour de troupe indépendant du rapport — smoke : restitution unités (étape worker en amont) + DELETE soft-delete ne touche pas la garnison/inventaire → PASS.
  - [x] Doc frontière report/inbox/outbox — `docs/gameplay/17-inbox-and-reports.md` § frontière + `data-model.md` + `realtime.md` → `git diff` (+55 lignes).
- **Review indépendante** : `Déclenchée (raison: backend + frontend, invariant durable d'inbox, diff > 100 lignes)` — VERDICT **GO**, 0 bloquant / 0 majeur ; nits logués (Décisions/Progress).
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-pixi test` → 51 fichiers, 258/258 PASS.
  - `yarn workspace battleforthecrown-backend test` → 21 suites, 232/232 PASS.
  - `yarn static-check` → vert (tsc + eslint backend + pixi).
- **Smokes lancés** : `Ciblés` — `yarn workspace battleforthecrown-backend test:smoke:run -- reinforcements.smoke combat-reports-inbox.smoke` → 2 suites, 5/5 PASS. (Migration additive + chemin worker neuf ; full smoke délégué à la CI PR.)
- **Smokes ajoutés/modifiés** : `reinforcements.smoke.spec.ts` +1 `it` « produces STATIONED/RETURNED reinforcement reports + inbox entries exposed per recipient via REST » (arrivée + rappel + REST read/delete isolation).
- **QA fonctionnelle agent** : exécutée via smoke réel (REST + worker pg-boss + Outbox + DB). Pas de curl manuel additionnel nécessaire (smoke couvre le bout-en-bout REST/DB).
- **Tests IG à faire par le user** (rendu Pixi/React modifié → IG requis) :
  - [ ] Inbox `/game/messages` : un rapport de renfort apparaît avec tag distinct (SOUTIEN/RETOUR) trié avec combat/scout.
  - [ ] Ouvrir le détail d'un rapport renfort : unités, village origine, village hôte, sens (« Arrivé en soutien » / « Retour au village ») et date lisibles, sans visuel victoire/défaite.
  - [ ] Badge « messages » : s'incrémente à l'arrivée d'un renfort et au retour, et décroît après lecture.

## Liens détectés pendant la planification

- À faire avant : Aucun.
- À faire après : Aucun identifié.
- Doublon potentiel : Aucun exact.
- Connexe :
  - [`tasks/archive/13-reinforcements-between-own-villages.md`](../archive/13-reinforcements-between-own-villages.md) — règles gameplay renfort/rappel/renvoi.
  - [`tasks/archive/33-reinforcements-inter-villages-missing.md`](../archive/33-reinforcements-inter-villages-missing.md) — backend initial `Garrison` / `REINFORCE`.
  - [`tasks/runs/archive/010-implementation-frontend-reinforcements.md`](./archive/010-implementation-frontend-reinforcements.md) — UI garnison et events WS.
  - [`tasks/archive/68-send-back-foreign-reinforcement-no-return-trip.md`](../archive/68-send-back-foreign-reinforcement-no-return-trip.md) — renvoi hôte -> origine.
  - [`tasks/runs/archive/012-feature-inbox-combat-reports.md`](./archive/012-feature-inbox-combat-reports.md) — inbox combat persistante.
  - [`tasks/archive/53-capture-occupation-defense-report-missing.md`](../archive/53-capture-occupation-defense-report-missing.md) — trace inbox pour défense par troupes non propriétaires.
- Déjà résolu : Aucun exact.
- Keywords scannés : `rapport`, `renfort`, `reinforcement`, `garrison`, `renvoyer`, `returned`.

## Points d'attention

- `initiateReinforce` interdit aujourd'hui de renforcer volontairement un village d'un autre joueur. Ce run ne doit pas ouvrir les renforts inter-joueurs sauf décision explicite pendant le refinement.
- Les garnisons étrangères peuvent déjà exister via certains flux ou données existantes ; les rapports doivent gérer le cas deux users sans supposer que tout renfort est mono-user.
- `InboxEntry` doit être conçu comme une fondation progressive, sans forcer une migration immédiate et risquée des rapports combat/scout.
- Les migrations Prisma doivent rester additives. Aucun reset DB.
