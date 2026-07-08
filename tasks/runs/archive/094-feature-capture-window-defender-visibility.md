# Run #094 — capture-window-defender-visibility

> **Statut** : DONE
> **Démarré** : 2026-07-06
> **Terminé** : 2026-07-06

## Cible

- **Phase roadmap** : Phase 6 — Notifications (couche **in-app** uniquement ; push FCM/APNs = Phase 6 push POST-MVP, **hors scope**, comme run 086). Volet **défenseur** de la catégorie « Fin de fenêtre de capture ».
- **Spec source** :
  - [`docs/gameplay/16-notifications.md`](../../docs/gameplay/16-notifications.md) — tableau l.20 (« Fin de fenêtre de capture », audience Attaquant + défenseur, 🔴 Critique) + § « Asymétrie attaquant ↔ défenseur » l.28-30 + § « Visibilité in-app de l'attaque entrante (livré — run 086) » l.32-40 (précédent normatif).
  - [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) — § Période de capture variable (fenêtres 4-18 h, consommateur des events de fenêtre).
- **Type** : feature
- **Modules** : backend (conquest.service + event planner + combat.service/controller) | frontend (queries + ws-bindings + KingdomActivitiesPanel/BottomSheet/viewModel) | shared (DTO fog-safe + payload `completed`)

## Objectif

Le conquérant (attaquant) voit ses captures en cours (`getOpenConquests` filtre `attackerUserId`, `combat.service.ts:1245` + onglet « Captures » du bottom sheet Activités du royaume). **Le défenseur / propriétaire original d'un village PvP en cours de capture n'a AUCUNE surface in-app live** : ni event WS routé vers lui, ni endpoint « captures qui ciblent mes villages », ni feed HUD avec compte à rebours « fenêtre jusqu'à T — ré-attaque pour interrompre ». C'est l'équivalent défenseur de ce que le run 086 a livré pour l'attaque entrante.

Objectif : livrer la couche in-app défenseur, **calquée sur 086** — les 3 events lifecycle de fenêtre atteignent le propriétaire original, un endpoint « captures ciblant mes villages » (ownership service-side, fog-safe), et une surface HUD avec compte à rebours vivant.

**Mécanique confirmée (lecture code)** : pendant la fenêtre `OPEN`, `Village.userId` reste le **propriétaire original** ; le transfert n'a lieu qu'à `finalizeCaptureWindow → conquerVillageInTx` (`conquest.service.ts:339-410`). Le défenseur est donc résoluble **à la volée** via `PendingConquest.targetVillageId → Village.userId` (zéro migration, Piste B du run 086). Un village barbare (`isBarbarian` / `userId null`) n'a pas de défenseur → jamais routé ni listé.

**Preuves de gap (vérifiées)** :
- `battleforthecrown-backend/src/modules/combat/combat.service.ts:1239-1246` — `getOpenConquests` filtre `attackerUserId: userId` uniquement ; aucune requête symétrique côté cible/défenseur.
- `battleforthecrown-backend/src/modules/event/event-outbox-notification-planner.ts:144-162` — `planCaptureWindowOpened` / `planCaptureWindowInterrupted` ne routent que vers `attackerUserId`. Ligne 193 — `'village.capture-window-completed': directUser('newOwnerUserId')` = le nouvel occupant, pas l'ancien propriétaire.
- `packages/shared/src/events/types.ts:156-177` — `VillageCaptureWindowOpenedPayload` et `...InterruptedPayload` ne portent que `attackerUserId` (pas de champ propriétaire cible) ; `...CompletedPayload` porte `newOwnerUserId` (pas l'ancien propriétaire).
- `battleforthecrown-pixi/src/features/combat/KingdomActivitiesBottomSheet.tsx` — sources = `useOpenConquestsQuery` (mes captures, attaquant) + `useIncomingAttacksQuery` (attaques entrantes pré-combat). `rg -ni "beingCaptured|underCapture|captureTargetingMe|villagesUnderCapture|defender.*capture" battleforthecrown-pixi/src` → **0 match**.
- Nuance : le marqueur de capture sur la carte est public (`WorldMapScene captureMarker`), donc le défenseur peut *repérer* la fenêtre en scrutant la carte, mais il n'a aucun countdown/feed HUD que la catégorie 🔴 « Critique » exige.

## Dépendances

- Base fenêtre de capture existante : runs archivés 041 (data-model), 046 (tracker), 042 (conquest hook), 047 (capture reports).
- Précédent in-app à calquer : run 086 (attaque entrante) — template quasi-copiable (planner scrub fog, endpoint fog-safe, onglet HUD countdown).
- Pas de doublon fonctionnel (cf. Liens détectés).

## Critère de fin (acceptance)

Automatisables (curl / SQL / smoke / test / grep) :

- [ ] `GET /combat/captures/targeting-me?worldId=` (appelant propriétaire d'un village PvP sous capture `OPEN`) retourne la fenêtre avec `captureUntil` ; 200.
- [ ] Appelant **non** propriétaire du village cible → n'obtient jamais la fenêtre (filtre `targetVillage.userId = userId` service-side, jamais `@Public`) ; 403/404 sur accès direct.
- [ ] Fog : la réponse ET les copies event défenseur ne contiennent **aucune** compo de garnison d'occupation ni identité/origine de l'attaquant (pas de `attackerUserId` / `attackerVillageId` / `attackerVillageName`). Whitelist ≈ `{pendingConquestId, targetVillageId, targetX/Y, targetCastleLevel, captureUntil}`.
- [ ] À l'ouverture d'une fenêtre sur un village joueur, le défenseur reçoit `capture-window-opened` ; l'attaquant continue de recevoir sa copie (full) inchangée.
- [ ] Interruption **et** complétion routent aussi le défenseur / propriétaire original (`capture-window-interrupted` défenseur ; `capture-window-completed` → `previousOwnerUserId` + `newOwnerUserId`).
- [ ] Cible barbare (`isBarbarian` / `userId null`) : jamais routée ni listée côté défenseur.
- [ ] Une fenêtre `COMPLETED` / `INTERRUPTED` disparaît de `captures/targeting-me` (filtre `status = OPEN`).
- [ ] **Idempotence WS (at-least-once)** : une livraison **dupliquée** de `capture-window-opened` (retry Outbox, ~1 s) ne crée pas de doublon dans le feed défenseur et ne redémarre pas le countdown — dédup stable par `pendingConquestId` côté consumer front (invariant `docs/architecture/decisions.md:41` + `realtime.md:213`). Couvert par un test unit mapper/consumer.
- [ ] `DefenderCaptureDto` défini dans shared + rebuild + DTO partagé consommé côté front (pas de duplication) ; `previousOwnerUserId` typé sur le payload `completed`.
- [ ] `yarn static-check` + `test:backend` + `test:pixi` verts ; smoke `capture-defender` ajouté.

Visuels (checklist Kelvin IG, ≤5) :

- [ ] La surface défenseur affiche un compte à rebours vivant « fenêtre jusqu'à T » par village assiégé + badge compteur.
- [ ] Le WS actualise la surface sans reload (ouverture, interruption, complétion).
- [ ] Aucune info attaquante (compo garnison d'occupation, identité) n'apparaît côté défenseur.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-workers-outbox`, `bftc-react-hud`
- **Review indépendante requise** : **oui** — touche backend + front + shared ; invariant fog-of-war (symétrie 086, scrub attaquant) ; modifie le routing de 3 events Outbox critiques ; diff attendu > 100 lignes. Mêmes critères déclencheurs que 086.

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Décision design (gate étape 1)** : trancher (a) surface HUD — onglet dédié « Sièges » vs réutilisation de l'onglet « Menaces » (menaces = pré-combat `EN_ROUTE` ; siège = post-combat, noble installé, fenêtre en cours) ; (b) endpoint per-world (recommandé, mirror `getOpenConquests`, défenseur multi-village) vs per-village (comme `/incoming`) ; (c) champs exacts du `DefenderCaptureDto` fog-safe (inclure `attackerVillageName` ? → défaut **non**). Consigner dans `16-notifications.md`.
- **T2 — shared** : `DefenderCaptureDto` + Zod (`packages/shared/src/events/types.ts` + `schemas.ts`, ou `combat/dtos.ts` selon convention endpoint) ; ajouter `previousOwnerUserId?` sur `VillageCaptureWindowCompletedPayload`. Rebuild `@battleforthecrown/shared`. (≤3)
- **T3 — back/planner** : dual-route les 3 events vers le défenseur — `opened` / `interrupted` (copie défenseur **scrub** des champs attaquant, exclusion barbare, patron `planVillageAttacked` l.99-128) + `completed` (previousOwner + newOwner) ; MAJ `event-outbox-notification-planner.spec.ts`. (≤2)
- **T4 — back/conquest.service** : alimenter `previousOwnerUserId` dans l'Outbox `capture-window-completed` (source `conquerVillageInTx.previousOwnerId`, `:231/:351`) — **ne pas** résoudre via `getUserIdByVillage` sur `completed` (renverrait l'attaquant post-transfert). (≤1)
- **T5 — back/service+controller** : `getCapturesTargetingMe(userId, worldId)` (join `PendingConquest OPEN → targetVillage.userId = userId`, DTO fog-safe) + `@Get('captures/targeting-me')` (ownership service-side). (≤2)
- **T6 — back/test** : smoke `capture-defender` — endpoint liste côté défenseur, `getOpenConquests` attaquant inchangé, barbare exclu, défenseur reçoit les 3 events, fog whitelist, ownership 403/404, filtre `status = OPEN`. (≤2)
- **T7 — front/query+ws** : `useCapturesTargetingMeQuery` + keys (`api/queries/combat.ts`) ; brancher les handlers capture-window de `api/ws-bindings.ts:920-976` pour invalider **aussi** la query défenseur. Consumer **idempotent** : la source de vérité reste la query (invalidation → refetch dédupliqué serveur-side par `pendingConquestId`), un event dupliqué ne fait que re-déclencher l'invalidation (no-op sur le feed). (≤3)
- **T8 — front/ui+vm** : surface défenseur dans `KingdomActivitiesPanel.tsx` + `KingdomActivitiesBottomSheet.tsx` + mapper `kingdomActivitiesViewModel.ts` (countdown `captureUntil`, tri asc). Dédup stable par `pendingConquestId` (clé de liste) — pas de doublon ni de reset du countdown sur livraison dupliquée. (≤5)
- **T9 — front/test** : unit mapper DTO → card (countdown, tri `captureUntil` ascendant) + cas **idempotence** : un DTO répété par `pendingConquestId` → une seule card, countdown stable. (≤1)
- **T10 — docs** : `16-notifications.md` (volet défenseur « Fin de fenêtre de capture » livré) + `docs/architecture/realtime.md` (routing des 3 events vers le défenseur).

## Points d'attention

- **Ownership à `completed`** : l'event est émis **après** transfert (`conquerVillageInTx`), donc `Village.userId` = nouvel occupant. Router le défenseur exige le **snapshot** `previousOwnerId` (dispo dans le résultat de `conquerVillageInTx`, `:231/:351`) → porté dans le payload. Ne pas résoudre à la volée sur `completed`.
- **Scrub fog** : `capture-window-opened` / `interrupted` portent `attackerUserId` / `attackerVillageId`. La copie défenseur DOIT les retirer (patron `planVillageAttacked`). L'attaquant garde sa copie full.
- **Sémantique surface** : « Menaces » (086) = attaques `EN_ROUTE` pré-combat ; le siège = post-combat (noble déjà installé, garnison d'occupation en place). Fusionner ou onglet dédié → tranché en T1.
- **Portée endpoint** : `getIncomingAttacks` est per-village, `getOpenConquests` per-world. Recommandé : per-world pour couvrir un défenseur multi-village.
- **Pas de migration** : `PendingConquest` ne stocke pas de `targetUserId` ; OK pour `OPEN` (résolution live) et `completed` (snapshot previousOwner). Ne pas ajouter de colonne.
- **Idempotence at-least-once** : l'Outbox garantit une livraison ≥ 1 fois (`decisions.md:41`). Le feed défenseur étant une surface persistante (pas un toast), il DOIT dédupliquer par `pendingConquestId` (pattern « write idempotent par ID », `realtime.md:213`) — jamais de doublon ni de reset de countdown sur retry.
- **Marqueur carte** : capture déjà public (`WorldMapScene captureMarker`) ; la nouvelle surface ne doit pas dégrader/dupliquer ce fog partiel existant.
- **Push FCM/APNs** : hors scope (Phase 6 push POST-MVP), comme 086.

## Rapport final

Volet défenseur « Fin de fenêtre de capture » livré, calqué sur le run 086 (attaque entrante). Décisions T1 : onglet HUD dédié **« Sièges »** (distinct de « Menaces » = pré-combat per-village) ; endpoint **per-world** `GET /combat/captures/targeting-me` ; `DefenderCaptureDto` fog-safe sans champ attaquant. Dual-route des 3 events capture-window vers le défenseur (copie scrub), `previousOwnerUserId` snapshot sur `completed`. _(détail : git history)_

### Acceptance & QA

**Critères d'acceptance vérifiés** :
- [x] `GET /combat/captures/targeting-me?worldId=` propriétaire → fenêtre OPEN + `captureUntil`, 200 — `test:smoke:run capture-defender` → 2/2 (assert DTO keys + captureUntil).
- [x] Non-propriétaire → jamais la fenêtre (filtre `targetVillage.userId=userId` service-side, jamais `@Public`) — smoke : attaquant `GET captures/targeting-me` → `[]` ; endpoint per-world ownership-scopé (pas de route per-window donc pas de 403/404, l'accès cross-user renvoie liste vide = équivalent not-found).
- [x] Fog : réponse REST + copies event défenseur sans `attackerUserId`/`attackerVillageId`/`attackerVillageName` — `DefenderCaptureDtoSchema` = `strictObject` ; smoke `not.toHaveProperty` ; planner spec `scrubAttackerFields` (`not.toHaveProperty attackerUserId/attackerVillageId`).
- [x] `opened` : défenseur reçoit ; attaquant garde copie full — `jest event-outbox-notification-planner` → « opened also routes the defender with attacker fields scrubbed ».
- [x] `interrupted` + `completed` routent défenseur/previousOwner — planner spec « interrupted also routes the defender scrubbed » + « completed routes both previous and new owner » ; smoke `completed` payload `previousOwnerUserId = defender`.
- [x] Cible barbare (`userId null`) jamais routée ni listée — planner spec « opened never routes a barbarian target » ; smoke barbare exclu de la liste.
- [x] Fenêtre COMPLETED/INTERRUPTED disparaît (filtre `status=OPEN`) — smoke : après `update status=COMPLETED` → liste `[]`.
- [x] Idempotence WS at-least-once (pas de doublon feed / reset countdown ; dedup `pendingConquestId`) — `test kingdomActivitiesViewModel` : « collapses a duplicated pendingConquestId » + « keeps the countdown stable » ; ws-bindings = invalidate-only (refetch dédup serveur).
- [x] `DefenderCaptureDto` shared consommé front (pas de dup) + `previousOwnerUserId` typé sur payload `completed` — `dtos.ts` + import front `useCapturesTargetingMeQuery` ; `types.ts`/`schemas.ts` payload completed.
- [x] `static-check` + `test:backend` + `test:pixi` verts ; smoke `capture-defender` ajouté — cf. ci-dessous.

**Review indépendante** : Déclenchée (raison : back+front, diff >100 lignes, invariant fog durable). Moteur CodeRabbit CLI local + couverture. **VERDICT GO** — zéro finding bloquant/majeur ; 4 mineurs cosmétiques (2 badges non dédup → **fixés** `siegeCount={sieges.length}` ; 1 test ws-bindings branche fog → **ajouté** ; 1 DOM id → laissé, `id` = attribut HTML légitime).

**Tests automatisés** : `yarn static-check` → OK. `yarn workspace battleforthecrown-backend test` → 565/565. `yarn workspace battleforthecrown-pixi test` → 939/939 (+ 2 ws-bindings, + 5 mapper/siege). `jest event-outbox-notification-planner` → 25/25.

**Smokes lancés** : Ciblés. `test:smoke:run capture-defender` → 2/2 ; `test:smoke:run conquest-finalize` → 3/3 (event `completed` touché). Full smoke → CI PR.

**Smokes ajoutés/modifiés** : `test/capture-defender.smoke.spec.ts` (endpoint fog-safe, ownership, barbare exclu, filtre status OPEN, `getOpenConquests` attaquant inchangé, `completed` porte `previousOwnerUserId`).

**QA fonctionnelle agent** : endpoint + events validés end-to-end via smoke (REST + Outbox `completed` dispatché). Routing planner validé en unit.

**Tests IG à faire par le user** (≤5) :
- [ ] Onglet « Sièges » + badge rouge compteur : compte à rebours vivant « fenêtre jusqu'à T » par village assiégé.
- [ ] WS actualise la surface sans reload (ouverture / interruption / complétion).
- [ ] Aucune info attaquante (compo garnison d'occupation, identité/origine) n'apparaît côté défenseur.
