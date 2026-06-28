# Run #086 — feature-incoming-attack-indicator

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : catégorie « Notifications » (spec [`16-notifications.md`](../../docs/gameplay/16-notifications.md)). **Livre uniquement la visibilité IN-APP de l'attaque entrante** (timer permanent côté défenseur). Le push FCM/APNs ([`00-mvp-roadmap.md`](../00-mvp-roadmap.md) Phase 6, **POST-MVP**) reste **hors scope** — voir Hors scope.
- **Spec source** : [`docs/gameplay/16-notifications.md`](../../docs/gameplay/16-notifications.md) — § tableau « Attaque entrante (avec ETA) » (🔴 Critique) + § « Asymétrie attaquant ↔ défenseur ». Modèle de référence : timer in-app permanent (Tribal Wars / Kingsage), push seulement quand l'app est fermée.
- **Type** : `feature`
- **Modules** :
  - backend : `modules/combat/combat.service.ts` (émission `battle.sent` ~L174 ; nouvelle méthode `getIncomingAttacks`), `modules/combat/combat.controller.ts` (nouveau `@Get(':villageId/incoming')`), `modules/event/event-outbox-notification-planner.ts` (planner custom routant au défenseur).
  - shared : `packages/shared/src/events/types.ts` (`IncomingAttackDto` + payload), `packages/shared/src/events/schemas.ts` (Zod).
  - frontend : `features/combat/KingdomActivitiesBottomSheet.tsx` (section « Attaques entrantes »), `api/queries.ts` (`useIncomingAttacksQuery`), `api/ws-bindings.ts` (handler event entrant + invalidate). Réutilise `features/design-system/components/ArmyMovementRow.tsx` (prop `incoming` **déjà existant** — pas de modif attendue).

## Pourquoi maintenant

L'asymétrie temporelle écrase le défenseur **sans visibilité d'attaque entrante** (spec 16 § Asymétrie). Aujourd'hui le défenseur ne sait qu'une armée arrivait qu'**après** la résolution (event `village.attacked` post-combat) — trop tard pour lever une armée ou demander un renfort. C'est le **comportement minimum attendu** sur le segment (timer permanent in-app). La partie push (sessions fermées) est une couche supplémentaire Phase 6 ; la couche in-app est un **prérequis UX indépendant** qu'on peut livrer maintenant, sans plomberie FCM/APNs.

Fondations déjà en place (réduisent le risque) :
- `Expedition.targetRefId` **est** un `Village.id` direct (`combat.service.ts` résout la cible via `village.findMany({ where: { id: { in: targetIds } } })`). Le défenseur = `Village.userId` (schema, **nullable → `null` = barbare**, à exclure). Pas de résolution coord→village nécessaire.
- `event-outbox-notification-planner.ts` a déjà un registre `PLANNERS` (`userByVillage` / `directUser` / `directWorld`) **et** un planner custom `planVillageAttacked` qui résout `defenderUserId ?? getUserIdByVillage(...)` **et scrubbe un champ privé** (`observerUserId`) avant l'envoi défenseur → **précédent fog-of-war directement réutilisable**.
- `ArmyMovementRow` a déjà un prop `incoming` (bordure rouge + flash) prêt pour les attaques entrantes.

## Gap (preuves code)

- `battleforthecrown-backend/src/modules/combat/combat.controller.ts` — `@Get('expeditions/open')` et `@Get(':villageId/active')` retournent **uniquement les expéditions sortantes** de l'utilisateur (filtre `attackerVillageIds`). Aucun `@Get(':villageId/incoming')` / `threats`.
- `battleforthecrown-backend/src/modules/event/event-outbox-notification-planner.ts` — `battle.sent` routé `userByVillage('villageId')` = **attaquant uniquement**. Le défenseur ne reçoit `village.attacked` qu'**après** résolution (`combat.worker.ts`).
- `packages/shared/src/events/types.ts` — `BattleSentPayload` = `expeditionId, villageId, targetX, targetY, targetKind, arrivalAt`. **Pas de `defenderUserId`**, pas d'event `attack.incoming`. Aucun `IncomingAttackDto`.
- `battleforthecrown-pixi/src/features/combat/KingdomActivitiesBottomSheet.tsx` + `stores/expeditions.ts` — sortantes only ; **aucune section/onglet « Attaques entrantes »**.

## Dépendances

- **Aucune migration prérequise** (piste B recommandée — voir Décisions à trancher).
- **Run autonome.** Indépendant de la Phase 6 push : ce run livre la couche in-app seule.
- Connexes (contexte, **non doublons**) : [`059-feature-threat-estimate-pre-attack`](archive/059-feature-threat-estimate-pre-attack.md) = côté **attaquant** (estimer la cible avant d'attaquer) ; [`047-feature-capture-reports`](archive/047-feature-capture-reports.md) et [`012-feature-inbox-combat-reports`](archive/012-feature-inbox-combat-reports.md) = rapports **post-combat**. Aucun ne couvre la visibilité **pré-combat côté défenseur**.

## Décisions à trancher (refinement étape 1)

- **Choix event** : étendre `BattleSentPayload` (ajout `defenderUserId`, scrubbé pour le destinataire attaquant) **vs** nouvel event `attack.incoming` dédié. Impacte `schemas.ts` + `ws-bindings.ts`. À trancher en étape 1.
- **Piste A** : dénormaliser `defenderUserId`/`defenderVillageId` sur `Expedition` (migration + backfill EN_ROUTE). Requêtes/broadcast triviaux mais migration + backfill + maintien à jour si la cible est reconquise avant impact.
- **Piste B (RECOMMANDÉE)** : pas de migration. `targetRefId` **est** déjà un `Village.id` → résoudre le défenseur à la volée (`Village.userId`) à l'émission de `battle.sent` (planner) **et** dans l'endpoint (filtre Prisma direct sur `targetRefId`).
  - Justification : (1) **server-authoritative** préservé, résolution toujours sur l'état courant du village (gère nativement une **cible reconquise** sans backfill) ; (2) volume EN_ROUTE par village faible, `Expedition.status` indexé → perf non-problématique ; (3) **zéro migration**, le pattern de résolution existe déjà (`planVillageAttacked` fait `getUserIdByVillage`). Passer en Piste A seulement si un besoin de push hors-ligne Phase 6 exige le défenseur sur la ligne Outbox.
- **Fog-of-war — ce qui est révélé** : par défaut **NON** révélé : composition de l'armée attaquante, identité/origine de l'attaquant (`originX/Y`). Révélé : village ciblé (le sien), `arrivalAt` (ETA), et le fait qu'« une armée arrive ». Confirmer en refinement vs spec combat (notamment si `originX/Y` attaquant doit rester masqué — **défaut : masqué**).

## Critère de fin (acceptance)

- [ ] **[auto: curl/SQL]** `GET /combat/:villageId/incoming` (village possédé par l'appelant) retourne les `Expedition` `kind=ATTACK` `status=EN_ROUTE` `arrivalAt > now` ciblant **ce** village ; `200`.
- [ ] **[auto: curl]** `GET /combat/:villageId/incoming` sur un village **non possédé** par l'appelant → `403`/`404` (ownership validé service-side, jamais `@Public`).
- [ ] **[auto: curl/SQL]** La réponse ne contient **aucun** champ de composition d'armée attaquante ni identité/origine de l'attaquant (fog-of-war). Champs autorisés : `expeditionId`, `targetVillageId`, `arrivalAt` (+ `targetX/Y` du village défenseur lui-même). `originX/Y` attaquant **non révélé** (défaut, à confirmer en refinement).
- [ ] **[auto: SQL/test]** Une attaque ciblant un village **barbare** (`Village.userId = null`) n'est **jamais** routée ni listée (aucun défenseur joueur).
- [ ] **[auto: smoke]** À l'envoi d'une attaque sur un village joueur, le défenseur reçoit un event WS (`battle.sent` étendu **ou** `attack.incoming`) avec `arrivalAt` ; l'attaquant continue de recevoir son event sortant **inchangé**.
- [ ] **[auto: smoke]** Event **idempotent** : rejouer/redélivrer l'event n'ajoute pas de doublon dans la liste entrante côté front (clé = `expeditionId`).
- [ ] **[auto: test]** Une expédition **résolue** (`RESOLVED`/`RETURNING`) ou `arrivalAt` passé **disparaît** de `/incoming`.
- [ ] **[auto: grep/tsc]** Schéma Zod `IncomingAttackDto` présent dans `shared` et `@battleforthecrown/shared` rebuild ; les types front consomment le **DTO partagé** (pas de duplication).
- [ ] **[visuel/gameplay]** La section « Attaques entrantes » du bottom sheet affiche un **compte à rebours vivant** (`ArmyMovementRow incoming`) par menace + un badge compteur ; checklist QA IG remise à Kelvin.
- [ ] **[visuel/gameplay]** Une nouvelle attaque arrivant pendant que le défenseur est en ligne **actualise** la section (WS push + invalidate) sans reload ; checklist QA IG.
- [ ] **[tests]** `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts ; smoke `incoming-attack` ajouté.
- [ ] **[docs]** `docs/gameplay/16-notifications.md` étoffé (la partie **in-app** n'est plus « à détailler ») + nouvel event référencé dans `docs/architecture/realtime.md`.

## Hors scope (à ne pas faire dans ce run)

- **Push FCM/APNs** (Phase 6 roadmap, POST-MVP) — opt-in granulaire, regroupement de pushes, deep-link, fallback OS. Ce run ne livre **que** la couche in-app.
- Refonte du HUD ou overlay carte plein écran des menaces — borné à **une section/onglet** dans le bottom sheet existant + un badge compteur.
- Révélation de la composition de l'armée attaquante ou de l'origine de l'attaquant (fog-of-war, cf. Décisions).
- Notifications « site d'exploitation attaqué », « retour d'armée », « fin de construction » (autres catégories du tableau 16 — hors de l'attaque entrante).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-workers-outbox`, `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`
- Spec source : `docs/gameplay/16-notifications.md`
- Précédent fog-of-war / routing défenseur : `event-outbox-notification-planner.ts` (`planVillageAttacked` — scrub `observerUserId`).
- Précédent UI countdown entrant : `features/design-system/components/ArmyMovementRow.tsx` (prop `incoming`).
- Pattern Outbox : `docs/architecture/realtime.md`.

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — [shared] Contrats** : `IncomingAttackDto` (`types.ts`) + schéma Zod (`schemas.ts`) ; trancher extension de `BattleSentPayload` vs nouvel event `attack.incoming`. Rebuild shared. (≤3 fichiers)
- **T2 — [back/planner] Routing défenseur** : planner custom dans `event-outbox-notification-planner.ts` (résolution `targetRefId → Village.userId`, exclusion barbare, scrub des champs interdits façon `planVillageAttacked`). Enregistrer dans `PLANNERS`. (≤2 fichiers)
- **T3 — [back/service] Endpoint data** : `combat.service.ts` — alimenter le payload défenseur à l'émission (~L174) si nécessaire ; `getIncomingAttacks(userId, villageId)` avec ownership + filtre Prisma (`targetRefId=village`, `status=EN_ROUTE`, `arrivalAt>now`). (≤2 fichiers)
- **T4 — [back/controller]** : `@Get(':villageId/incoming')` déléguant au service. (1 fichier)
- **T5 — [back/test]** : smoke `incoming-attack` (envoi attaque → endpoint défenseur liste l'ETA, attaquant inchangé, barbare exclu, ownership 403). (≤2 fichiers)
- **T6 — [front/query+ws]** : `queries.ts` `useIncomingAttacksQuery` (refetch conditionnel) + `ws-bindings.ts` handler event entrant → invalidate la query. (≤2 fichiers)
- **T7 — [front/ui]** : `KingdomActivitiesBottomSheet.tsx` section « Attaques entrantes » (`ArmyMovementRow incoming`) + badge compteur. (≤3 fichiers)
- **T8 — [front/test]** : unit test du mapping `DTO → card entrante` (countdown, tri par `arrivalAt`). (≤2 fichiers)

## Progress

_(Vide au démarrage. À remplir pendant `$bftc-run`.)_

## Décisions prises

_(Vide au démarrage. À remplir pendant `$bftc-run`.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage. Rempli à la clôture.)_
