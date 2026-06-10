# Run #052 — feature-caravan-reports

> **Statut** : DONE
> **Démarré** : 2026-06-10 20:09 CEST
> **Terminé** : 2026-06-10 20:37 CEST

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

- **T1 — Prisma/shared/backend REST** : ajouter `CaravanReport`, `InboxKind.CARAVAN`, `InboxEntry.caravanReportId`, migration additive, DTO shared, presenter/service/endpoints `/combat/caravan-report(s)`.
- **T2 — Backend workers/smokes** : créer les rapports dans `handleCaravanArrival` et dans `handleCaravanReturn` uniquement si `recalled`, avec garde idempotente par `expeditionId + type`, puis couvrir list/detail/read/delete et absence de `SENT` en smoke.
- **T3 — Front API/realtime/inbox** : ajouter hooks/query keys/mutations caravane, invalidations WS `caravan.arrived`/`caravan.returned`, liste + tabs + badge + détail modal.
- **T4 — Docs/SPEC** : documenter la catégorie caravane, la matrice `ARRIVED` / retour rappelé / pas `SENT`, et rappeler que l'Outbox realtime n'est pas une archive métier.
- **T5 — QA/review** : static-check, tests ciblés backend/front, smoke backend, review indépendante obligatoire, finalisation fiche + commit + PR.

## Progress (rempli pendant le run)

- 2026-06-10 20:09 CEST — Préflight OK : branche `run/052-feature-caravan-reports` créée depuis `origin/main`, fiche 052 appliquée, `PR_REQUIRED: oui`, specs/rules/SPEC et skills spécialisés lus. Cartographie backend/frontend lancée via `code_mapper`.
- 2026-06-10 20:16 CEST — Refinement tranché : rapports persistants uniquement sur arrivée nominale et retour rappelé ; pas de rapport `SENT`, pas de rapport sur retour normal post-livraison. Mapping code terminé, implémentation lancée par zones backend/front.
- 2026-06-10 20:22 CEST — Docs/SPEC alignés : `CaravanReport` documenté comme fait métier typé, `InboxEntry` comme état par destinataire, `EventOutbox` comme canal realtime/invalidation.
- 2026-06-10 20:37 CEST — Implémentation, tests, smoke ciblé, static-check et review indépendante terminés. Finding enum Prisma/shared résolu par compile-check `CaravanReportType`.

## Décisions prises

- `CaravanReport` reste un modèle métier typé, relié à `InboxEntry` via `InboxKind.CARAVAN`; pas de table `Report` générique JSON.
- `EventOutbox` reste réservé au realtime/invalidation (`caravan.arrived`, `caravan.returned`) et ne sert jamais d'historique consultable.
- Les caravanes MVP sont intra-joueur : un rapport est adressé au propriétaire des villages concernés, avec déduplication défensive si origine/destination pointent vers le même utilisateur.
- L'idempotence worker passe par une contrainte logique `expeditionId + type`, pour éviter les doublons en cas de retry sans bloquer une éventuelle évolution future des types.

## Rapport final

Livré : `CaravanReport` persistant typé, `InboxEntry.CARAVAN`, endpoints REST list/detail/read/delete, création idempotente des rapports à l'arrivée nominale et au retour rappelé, intégration `/game/messages` avec tab `Caravanes`, badge unread, détail modal et invalidations WS `caravan.arrived` / `caravan.returned`.

Docs : mises à jour dans `17-inbox-and-reports.md`, `02-economy-and-progression.md`, `data-model.md`, `realtime.md` et `SPEC.md` pour figer la frontière `CaravanReport` / `InboxEntry` / `EventOutbox`.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Rapport arrivée nominale — `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke" yarn workspace battleforthecrown-backend test:smoke:run -- caravan.smoke.spec.ts` → 1 suite, 6 tests pass ; assertion `CaravanReport ARRIVED` + `InboxEntry.CARAVAN`.
  - [x] Rapport retour rappelé — `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke" yarn workspace battleforthecrown-backend test:smoke:run -- caravan.smoke.spec.ts` → 1 suite, 6 tests pass ; assertion `CaravanReport RETURNED`, ressources restituées/perdues, porteurs.
  - [x] Pas de rapport `SENT` par défaut — `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke" yarn workspace battleforthecrown-backend test:smoke:run -- caravan.smoke.spec.ts` → assertion count `0` après envoi actif avant arrivée.
  - [x] REST list/detail/read/delete scopés — `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke" yarn workspace battleforthecrown-backend test:smoke:run -- caravan.smoke.spec.ts` → endpoints `/combat/caravan-report(s)` pass, read/delete masquent l'`InboxEntry` sans supprimer `CaravanReport`.
  - [x] Inbox Pixi + badge + invalidations — `yarn workspace battleforthecrown-pixi test src/features/combat/caravanReportView.test.ts src/features/combat/ReportDetailModal.test.tsx src/api/ws-bindings.test.ts` → 3 fichiers, 38 tests pass.
  - [x] Docs report/inbox/outbox — `yarn static-check` → pass ; relecture docs/SPEC effectuée.
- **Review indépendante** : `Déclenchée (raison: back+front, SPEC.md, diff > 100 lignes, invariant durable)`. Verdict `GO`; findings résolus : fichiers untracked inclus au staging final, compile-check `CaravanReportType` ajouté dans `prisma-shared-enums.ts`.
- **Tests automatisés** :
  - `yarn static-check` → pass.
  - `yarn workspace battleforthecrown-pixi test src/features/combat/caravanReportView.test.ts src/features/combat/ReportDetailModal.test.tsx src/api/ws-bindings.test.ts` → 3 fichiers, 38 tests pass.
  - `git diff --check` → pass.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/caravan.smoke.spec.ts` couvre arrivée nominale, absence de rapport avant arrivée, REST list/detail/read/delete, suppression logique, retour normal sans second rapport, retour rappelé avec rapport.
- **Smokes lancés** : Ciblés — `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke" yarn workspace battleforthecrown-backend test:smoke:run -- caravan.smoke.spec.ts` → 1 suite, 6 tests pass.
- **QA fonctionnelle agent** : Non exécutée en navigateur ; comportement data/REST/worker couvert par smoke automatisé, rendu Pixi couvert par tests composants/helpers. Une validation IG reste demandée pour le ressenti visuel.
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
