# Run #083 — feature-world-inscription-phase-changed-event

> **Statut** : DONE
> **Démarré** : 2026-06-24
> **Terminé** : 2026-06-24

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (complément runtime serveur, suit run 032 + run 069 + run 064)
- **Spec source** : [`docs/gameplay/19-world-lifecycle.md` § Bascule cohorte principale → retardataires](../../docs/gameplay/19-world-lifecycle.md)
- **Type** : feature
- **Modules** : backend `workers/world-lifecycle.worker.ts` (nouvel axe `handlePhaseTransitions`) + `event/event-outbox-notification-planner.ts` + `prisma/schema.prisma` (colonne `world.inscriptionPhaseTransitionedAt`) | shared `packages/shared/src/events/{schemas,types}.ts` (nouvel event `world.inscription-phase.changed`) | frontend `api/ws-bindings.ts` (handler) + `features/worlds/*` (invalidation `/worlds/public` au signal)

## Dépendances

- Run 032 ✅ DONE (lifecycle foundation, `inscriptionMainDays`/`inscriptionLateDays` exposés via `WorldConfig.lifecycle`).
- Run 069 ✅ DONE (UI bandeau « lancé il y a {N} j » côté sélection mondes — consommateur principal du signal serveur).
- Run 064 ✅ DONE (worker spawner — réutilise le même tick `WORLD_LIFECYCLE_QUEUE`, pas de nouveau cron).
- Aucune dépendance sur le système de notifications push (spec 16 reste post-MVP, esquisse seulement).

## Symptôme / Objectif

La spec 19 § Bascule cohorte principale → retardataires tranche MVP qu'à `startedAt + inscriptionMainDays` (default 7 j), le monde doit émettre une **notification serveur** (« La cohorte principale est complète. Inscription encore possible 3 jours en mode retardataires. »). Actuellement :

- `WorldLifecycleWorker.handleLifecycleTick` n'a que 3 axes (`openPlannedWorlds`, `lockExpiredRegistrationWindows`, `endExpiredWorlds`) — aucun ne détecte la traversée de la frontière `main → late`.
- Aucun event Outbox `world.inscription-phase.changed` (ou équivalent) n'est défini dans `packages/shared/src/events/`.
- Le front dérive la phase **live** côté client via `deriveInscriptionPhase`, donc le bandeau apparaît au prochain refetch `/worlds/public`, **pas en temps réel**. Sans signal serveur, un joueur déjà sur l'écran de sélection au moment de la bascule ne voit le bandeau qu'à l'actualisation manuelle.
- Aucune persistance du moment de transition (`inscriptionPhaseTransitionedAt`) — empêche l'idempotence (un worker qui retombe en arrière sur le tick ré-émettrait l'event à chaque exécution).

Conséquence : la promesse spec « Notification serveur » est rompue, et l'UX du bandeau retardataires dépend du timing du refetch front, pas du fait métier serveur.

## Cause racine probable

Run 032 a livré la foundation lifecycle mais n'a pas traité la bascule de **phase d'inscription** comme un fait métier distinct (le monde reste `OPEN`, pas de transition `WorldStatus`). Run 069 a livré le rendu UI mais s'est appuyé sur la dérivation client-side existante, sans demander de signal serveur en retour.

## Comportement attendu

- À chaque tick `handleLifecycleTick`, pour chaque monde `OPEN` dont `startedAt + inscriptionMainDays ≤ now` ET `inscriptionPhaseTransitionedAt IS NULL` : créer un event Outbox `world.inscription-phase.changed` (payload `{ worldId, from: 'main', to: 'late', at }`) dans la **même transaction** qui persiste `inscriptionPhaseTransitionedAt = now`.
- Le worker reste idempotent : un monde déjà transitionné (colonne non null) n'émet plus rien.
- L'event est routé en `directWorld('worldId')` côté `event-outbox-notification-planner` (broadcast à tous les membres du monde + tout client abonné à la room du monde — cohérent avec `world.status.changed`).
- Côté front : nouveau handler `applyWorldInscriptionPhaseChanged` qui invalide `queryKeys.worlds.public()` (refresh sélection mondes pour faire apparaître le bandeau run 069 sur la card concernée).
- Le monde reste `OPEN` après la transition (le `WorldStatus` n'est pas touché) — c'est bien un **sous-flag** distinct, conforme à la spec.

## Pistes

Une seule piste évidente — pattern aligné sur `world.status.changed`. Le seul vrai choix design : faut-il une colonne dédiée `inscriptionPhaseTransitionedAt` ou déduire de la présence d'un event Outbox passé ? Recommandation : colonne dédiée, **bool/timestamp lit directement le state, ne dépend pas du delete de l'Outbox traité.

## Scope recommandé

### Backend

- `prisma/schema.prisma` : ajouter `World.inscriptionPhaseTransitionedAt: DateTime?` + migration additive.
- `workers/world-lifecycle.worker.ts` : ajouter `handlePhaseTransitions(now)` appelé dans `handleLifecycleTick`, en transaction (updateMany conditionnel + `createOutboxEvent`).
- `event/event-outbox-notification-planner.ts` : router `world.inscription-phase.changed` en `directWorld('worldId')`.

### Shared

- `packages/shared/src/events/schemas.ts` + `types.ts` : nouveau payload `WorldInscriptionPhaseChangedPayload`.

### Frontend

- `api/ws-bindings.ts` : handler `applyWorldInscriptionPhaseChanged` qui invalide `queryKeys.worlds.public()` (et `queryKeys.worlds.detail(worldId)` si pertinent).

### Tests

- Spec worker : la transition n'est émise qu'une fois (idempotence colonne), reste OPEN, payload correct.
- Spec notification-planner : routing `directWorld`.

### Docs

- `docs/architecture/realtime.md` : ajouter ligne `world.inscription-phase.changed` dans le catalogue d'events.
- `docs/gameplay/19-world-lifecycle.md` : section Bascule — confirmer que le signal est désormais runtime côté serveur (référence vers ce run).

## Critère de fin (acceptance)

- [ ] Le schéma Prisma expose `World.inscriptionPhaseTransitionedAt: DateTime?` (migration additive, default null) — `yarn prisma migrate deploy` passe.
- [ ] `packages/shared/src/events/schemas.ts` expose `WorldInscriptionPhaseChangedPayloadSchema` (`{ worldId: string, from: 'main', to: 'late', at: string }`) — types narrowés via Zod.
- [ ] `WorldLifecycleWorker.handlePhaseTransitions` est invoqué dans `handleLifecycleTick`, et un appel sur un monde déjà transitionné (`inscriptionPhaseTransitionedAt != null`) ne crée **aucun** event Outbox supplémentaire (test spec idempotence).
- [ ] Un seul event `world.inscription-phase.changed` est émis quand le monde traverse `startedAt + inscriptionMainDays`, persisté dans la même transaction que la mise à jour de `inscriptionPhaseTransitionedAt` — automatisable via spec backend qui audite `eventOutbox.count` avant/après.
- [ ] `event-outbox-notification-planner.ts` route `world.inscription-phase.changed` en `directWorld('worldId')` — couvert par spec planner.
- [ ] Le frontend reçoit le WS et invalide la query `worlds.public` (test ws-bindings ou snapshot du dispatcher) — automatisable via test unit.
- [ ] `static-check` racine vert, `yarn test:backend` vert, smoke `world-lifecycle` (existant ou ajouté) vert.
- [ ] Visuel/gameplay : sur une session ouverte sur l'écran sélection mondes au moment de la bascule, le bandeau « Lancé il y a {N} j » apparaît **sans refresh manuel** — checklist QA IG Kelvin (1 item).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`

## Décomposition / Décisions

_(git history)_

## Rapport final

Synthèse : nouvel event Outbox `world.inscription-phase.changed` émis par `WorldLifecycleWorker.handlePhaseTransitions` à `startedAt + inscriptionMainDays` (monde reste OPEN, sous-flag distinct). Idempotence via colonne `World.inscriptionPhaseTransitionedAt` (updateMany conditionnel dans la même tx que `createOutboxEvent`). Routing `directWorld`, front invalide `worlds.public`.

### Acceptance & QA

**Critères d'acceptance vérifiés**

- [x] Colonne `World.inscriptionPhaseTransitionedAt: DateTime?` + migration additive — `yarn prisma migrate deploy` → `20260624153000_add_world_inscription_phase_transitioned_at` appliquée (nullable, non destructif).
- [x] `WorldInscriptionPhaseChangedPayloadSchema {worldId, from:'main', to:'late', at}` Zod — `schemas.ts:280` (`z.literal` + `z.string().datetime()`), type `types.ts:288` ; exhaustivité EventKind/ServerEvents/Outbox/Any couverte → `yarn static-check` vert.
- [x] `handlePhaseTransitions` invoqué dans `handleLifecycleTick` + idempotence colonne — smoke `world-inscription-phase` : `yarn workspace battleforthecrown-backend test:smoke:run -- world-inscription-phase world-lifecycle-spawner` → 6 passed (transition unique, re-tick = 0 event, hors fenêtre = 0).
- [x] Un seul event émis dans la même tx que la persistance — smoke audite `eventOutbox` filtré par kind/aggregateId → 1 event, `inscriptionPhaseTransitionedAt = now`, monde reste OPEN.
- [x] Planner route `directWorld('worldId')` — `event-outbox-notification-planner.ts:196` ; unit `yarn workspace battleforthecrown-backend test -- event-outbox-notification-planner` → 18 passed.
- [x] Front reçoit le WS et invalide `worlds.public` — `applyWorldInscriptionPhaseChanged` + binding ; `yarn workspace battleforthecrown-pixi test --run ws-bindings` → 48 passed.
- [x] `static-check` racine vert · `yarn workspace battleforthecrown-backend test` → 509 passed · smokes ciblés verts.

**Review indépendante** : Déclenchée (raison: critère a back+front ET critère c diff>100 lignes). Verdict `GO` — zéro bloquant/majeur, 4 mineurs loggés (phase+lock même tick sur monde >J+10 : métier correct ; double parse config & double invalidation front : alignés sur patterns existants ; `at`=instant du tick comme `world.status.changed`). Aucun fix requis.

**Tests automatisés** : `static-check` vert ; backend unit 509 passed ; planner 18 passed ; ws-bindings 48 passed.

**Smokes lancés** (Ciblés) : `test:smoke:run -- world-inscription-phase world-lifecycle-spawner` → 6 passed. Périmètre ciblé suffisant (worker lifecycle + nouvelle colonne) ; full smoke couvert par CI PR.

**Smokes ajoutés/modifiés** : `test/world-inscription-phase.smoke.spec.ts` — transition main→late unique, idempotence re-tick, non-transition hors fenêtre.

**QA fonctionnelle agent** : worker exercé bout-en-bout via smoke (boot app réel + Prisma + Outbox). Pas de curl/WS manuel additionnel nécessaire.

**Tests IG à faire par le user** : 1 item — sur l'écran sélection mondes ouvert au moment de la bascule (`startedAt + inscriptionMainDays`), le bandeau « Lancé il y a {N} j » apparaît **sans refresh manuel**.
