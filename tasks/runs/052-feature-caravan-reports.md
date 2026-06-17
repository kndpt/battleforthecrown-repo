# Run #052 — feature-caravan-reports

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 2 — Inbox & rapports (extension MVP après la caravane de ressources).
- **Spec source** :
  - [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) — contrat inbox persistant.
  - [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) — caravane de ressources entre villages possédés.
  - [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) — expéditions, retours et rappel.
- **Type** : `feature`
- **Modules backend** : `combat`, `reports`, `event`, `prisma`
- **Modules frontend** : `pixi/api`, `pixi/features/combat`, inbox/messages
- **Modules shared/docs** : `packages/shared/src/combat`, `docs/gameplay`, `docs/architecture`, `SPEC.md` si invariant global à backpropager
- **REVIEW_INDÉPENDANT_REQUIS** : oui

## Dépendances

- Run [`050 — Caravane de ressources entre villages`](./050-feature-resource-caravan.md) merged/appliqué avant démarrage. Sur `origin/main`, ce run est déjà archivé après merge ; sur certains checkouts locaux il peut encore apparaître `PLANNED`.
- Migration run 050 appliquée : `ExpeditionKind.CARAVAN` disponible, route `POST /combat/caravan`, workers arrivée/retour et events `caravan.*`.
- Décision user 2026-06-10 : créer des rapports pour l'arrivée de caravane et le retour d'une caravane rappelée ; ne pas créer de rapport `SENT` par défaut sauf découverte contraire au refinement.

## Critère de fin (acceptance)

- [ ] Une arrivée de caravane nominale crée un `CaravanReport` persistant avec origine, destination, ressources transportées, ressources créditées, ressources perdues par overflow, timestamp, et au moins une entrée inbox `CARAVAN` adressée au propriétaire concerné. _(auto : smoke + SQL)_
- [ ] Le retour d'une caravane rappelée crée le rapport persistant documenté avec ressources restituées/perdues à l'origine, porteurs libérés et statut rappelé, sans double création si le worker/retry rejoue. _(auto : smoke + SQL)_
- [ ] Aucun rapport n'est créé au simple envoi `SENT`, sauf si le refinement documente explicitement un changement produit. _(auto : smoke/SQL + grep)_
- [ ] `GET /combat/caravan-reports` retourne uniquement les rapports du joueur connecté dans le monde courant, triés du plus récent au plus ancien. _(auto : REST/smoke)_
- [ ] `GET /combat/caravan-report/:id`, `PATCH /combat/caravan-report/:id/read` et `DELETE /combat/caravan-report/:id` sont scopés user+world ; lecture et suppression modifient uniquement l'`InboxEntry` du destinataire courant. _(auto : REST/smoke)_
- [ ] Supprimer un rapport caravane masque l'entrée inbox sans supprimer le fait métier ni casser retour, population ou ressources. _(auto : smoke + SQL)_
- [ ] `/game/messages` agrège combat, scout, renfort et caravane dans une liste triée, et le badge messages inclut les rapports caravane non lus. _(auto : tests Pixi)_
- [ ] Les handlers `caravan.arrived` et `caravan.returned` invalident les queries d'inbox caravane ou l'agrégat messages, sans dépendre d'un toast volatile. _(auto : test `ws-bindings`)_
- [ ] Le détail frontend d'un rapport caravane affiche villages origine/destination, ressources envoyées/créditées/perdues/restaurées et état arrivé/rappelé, sans UUID brut ni visuel victoire/défaite. _(auto helper + visuel/gameplay)_
- [ ] La documentation distingue clairement `CaravanReport`, `InboxEntry` et `EventOutbox` : l'Outbox reste realtime, jamais archive métier. _(auto : grep/relecture)_

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

Draft de plan issu de `$bftc-plan`, à raffiner au lancement :

- **T1 — Specs/docs** : documenter la catégorie caravane et la matrice de rapports (`ARRIVED`, retour rappelé ; pas `SENT` par défaut) dans `17-inbox-and-reports.md`, puis aligner `02-economy-and-progression.md`, `data-model.md`, `realtime.md` et `SPEC.md` si l'invariant report/inbox/outbox doit être promu.
- **T2 — Prisma/shared** : ajouter `CaravanReport`, étendre `InboxKind` avec `CARAVAN`, ajouter `InboxEntry.caravanReportId`, migration additive, DTO shared `CaravanReportResponse`.
- **T3 — Backend write path** : créer `CaravanReport` + `InboxEntry` dans les transactions worker qui finalisent l'arrivée nominale et le retour rappelé, sans utiliser `EventOutbox` comme archive métier.
- **T4 — Backend REST** : exposer list/detail/read/delete `/combat/caravan-report(s)` via service + presenter, avec accès `userId` + `worldId` et mutation limitée à l'entrée inbox du viewer.
- **T5 — Front API/realtime** : ajouter query keys/hooks/mutations caravan reports et invalidations WS sur `caravan.arrived` / `caravan.returned`.
- **T6 — Front inbox** : intégrer la 4e catégorie dans `ReportsList`, `ReportDetailModal`, unread badge et view-model de détail, avec wording clair.
- **T7 — Tests/QA** : smoke backend cycle caravane → rapport → read/delete, test idempotence/retry raisonnable, tests Pixi de mapping/invalidation/listing, static-check.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Rapport arrivée nominale — `smoke/SQL à renseigner` → —
  - [ ] Rapport retour rappelé — `smoke/SQL à renseigner` → —
  - [ ] Pas de rapport `SENT` par défaut — `smoke/SQL/grep à renseigner` → —
  - [ ] REST list/detail/read/delete scopés — `curl/smoke à renseigner` → —
  - [ ] Inbox Pixi + badge + invalidations — `tests Pixi à renseigner` → —
  - [ ] Docs report/inbox/outbox — `grep/relecture à renseigner` → —
- **Review indépendante** : `Déclenchée (raison: back+front, diff estimé > 100 lignes, invariant durable report/inbox, SPEC.md probable)`.
- **Tests automatisés** : _(rempli à l'étape 10)_
- **Smokes ajoutés/modifiés** : _(rempli à l'étape 10)_
- **QA fonctionnelle agent** : _(rempli à l'étape 10)_
- **Tests IG à faire par le user** :
  - [ ] Envoyer une caravane entre deux villages possédés, attendre l'arrivée, ouvrir `/game/messages` et vérifier le rapport de livraison.
  - [ ] Rappeler une caravane avant arrivée, attendre son retour, vérifier le rapport de retour rappelé et les ressources affichées.
  - [ ] Vérifier que l'envoi seul ne crée pas un message persistant, seulement l'activité temps réel.

## Liens détectés pendant la planification

- À faire avant :
  - [`050 — Caravane de ressources entre villages`](./050-feature-resource-caravan.md) — socle `CARAVAN` requis ; sur `origin/main`, ce run est déjà merged et archivé.
- À faire après : Aucun identifié.
- Doublon potentiel : Aucun.
- Connexe :
  - [`012 — Inbox combat reports`](./archive/012-feature-inbox-combat-reports.md) — fondation inbox combat, read/delete par participant.
  - [`016 — Feature scouting backend shared`](./archive/016-feature-scouting-backend-shared.md) — `ScoutReport` dédié + endpoints reports.
  - [`017 — Feature scouting frontend inbox`](./archive/017-feature-scouting-frontend-inbox.md) — intégration d'une nouvelle catégorie dans `/game/messages`.
  - [`044 — Rapports persistants de renforts`](./archive/044-feature-reinforcement-reports.md) — modèle de référence `ReinforcementReport` + `InboxEntry` FK typée.
  - [`047 — Rapports de capture`](./archive/047-feature-capture-reports.md) — précédent où un event realtime ne suffit pas comme archive métier.
- Déjà résolu : Aucun exact.
- Keywords scannés : `caravan`, `report`, `inbox`, `message`, `reinforcement`, `scout`, `combat`, `capture`.

## Points d'attention

- Ne pas créer de table `Report` transverse portée par du JSON métier : le contenu métier reste typé par domaine.
- Ne pas recycler `EventOutbox` comme historique : il reste le canal temps réel et d'invalidation.
- Garder le run borné : arrivée nominale + retour rappelé ; pas de rapport `SENT`, pas de marché inter-joueurs, pas de notifications push.
- Vérifier les tabs de l'inbox : l'UI actuelle filtre explicitement combat/scout et agrège déjà renfort dans `Tous`; l'ajout caravane ne doit pas rendre les renforts moins visibles.
- Le checkout de démarrage peut être en retard de `origin/main`; lancer le run seulement après avoir appliqué/mergé le run 050 localement.
