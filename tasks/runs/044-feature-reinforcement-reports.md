# Run #044 — feature-reinforcement-reports

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Rapport `STATIONED` persistant + entrées inbox par destinataire — test/smoke + SQL → à remplir.
  - [ ] Rapport `RETURNED` persistant + entrées inbox par destinataire — test/smoke + SQL → à remplir.
  - [ ] Isolation read/delete par user — test REST/curl → à remplir.
  - [ ] Frontend liste + détail renfort — test Pixi + inspection visuelle → à remplir.
  - [ ] Invalidation badge/messages — test `ws-bindings` ou smoke → à remplir.
  - [ ] Non-régression combat/scout — tests existants + smoke inbox → à remplir.
  - [ ] Retour de troupe indépendant du rapport — smoke ou test service → à remplir.
- **Review indépendante** : `Déclenchée (raison: backend + frontend, invariant durable d'inbox, diff estimé > 100 lignes)`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : scénario arrivée renfort + scénario rappel/renvoi retour.
- **QA fonctionnelle agent** : REST/DB/worker/Outbox + inspection `/game/messages`.
- **Tests IG à faire par le user** : seulement si une appréciation visuelle mobile reste nécessaire après QA navigateur.

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
