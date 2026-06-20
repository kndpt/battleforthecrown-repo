# Run #056 — feature-pvp-newbie-shield-48h

> **Statut** : DONE
> **Démarré** : 2026-06-20
> **Terminé** : 2026-06-20

## Cible

- **Phase roadmap** : Hors roadmap explicite — garde-fou PvP MVP tranché par [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) § « Garde-fous anti-snowball — 3. Bouclier débutant ». La Phase 7 (conquête PvP) est en attente de la Phase 6 notifications, mais ce garde-fou est indépendant des notifications et déjà câblé en config par le run [`032`](archive/032-world-lifecycle-foundation-and-identity.md).
- **Spec source** : [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) §§ « Garde-fous anti-snowball — 3. Bouclier débutant — 48 h à l'arrivée sur le monde » (lignes 179-199).
- **Type** : `feature`
- **Modules backend** : `combat/combat.service.ts` (guard `initiateAttack`), nouveau `world/newbie-shield.service.ts`, `world/world.controller.ts`, `prisma/schema.prisma` (+ migration), `event/game.gateway.ts` (event Outbox `pvp.shield.broken`).
- **Modules frontend** : `features/world/SelectedEntityPanel.tsx`, nouveau composant `features/world/NewbieShieldBadge.tsx`, nouveau hook `api/queries/useTargetShield`, listener WS `pvp.shield.broken`.
- **Modules transverses** : `packages/shared/src/pvp/shield.ts` (helper pur `isShieldActive` + `shieldEndsAt`), `packages/shared/src/world/schemas.ts` (Zod `newbieShieldState`), DTO re-export.

## Dépendances

- Aucune dépendance bloquante active.
- Fondations déjà en place :
  - Run [`032 — Lifecycle backend foundation + identité monde`](archive/032-world-lifecycle-foundation-and-identity.md) ✅ DONE — expose déjà `WorldConfig.lifecycle.newbieShieldHours` (default 48).
  - Run [`051 — Classements Gloire d'Assaut / Rempart`](archive/051-feature-rankings-glory.md) ✅ DONE — modèle de référence pour brancher un pre-check au snapshot PvP dans `initiateAttack`.
  - Schéma `WorldMembership.joinedAt` déjà présent, source de vérité du début de bouclier.

## Critère de fin (acceptance)

- [ ] **[SQL]** `WorldMembership` gagne une colonne `shieldBrokenAt DateTime?` ; aucune colonne `shieldEndsAt` n'est ajoutée (le `endsAt` est dérivé `joinedAt + newbieShieldHours * 3600 * 1000` par le helper shared).
- [ ] **[curl]** `POST /combat/attack` avec cible `PLAYER_VILLAGE` dont le propriétaire a `now < shieldEndsAt && shieldBrokenAt IS NULL` → `403 Forbidden` (code `NEWBIE_SHIELD_ACTIVE`). Aucune ligne `Expedition` créée, aucune unité décrémentée (vérif SQL).
- [ ] **[curl]** `POST /combat/attack` avec cible `BARBARIAN_VILLAGE` par un attaquant sous shield → `200` autorisé, `WorldMembership.shieldBrokenAt` reste `NULL`.
- [ ] **[curl]** `POST /combat/attack` PvP (cible `PLAYER_VILLAGE`) sortante par un attaquant sous shield → `200` autorisé, `WorldMembership.shieldBrokenAt = now` posé dans la **même transaction** que la création de l'`Expedition`.
- [ ] **[curl]** `POST /combat/scout` avec cible `PLAYER_VILLAGE` par un attaquant sous shield → `200` autorisé, `shieldBrokenAt` reste `NULL` (scout non-rupteur, cohérent avec spec).
- [ ] **[curl]** `POST /combat/attack` PvP entrante quand `shieldBrokenAt IS NOT NULL` → `200` autorisé (la rupture est définitive — le défenseur n'est plus protégé une fois sorti du shield).
- [ ] **[curl]** `GET /worlds/:worldId/memberships/me` (ou route self équivalente) renvoie `newbieShield: { endsAt, brokenAt, active }` avec `active = (now < endsAt && brokenAt === null)`.
- [ ] **[curl]** Fiche publique d'un joueur tiers (route à confirmer en refinement) renvoie un sous-objet `newbieShield: { endsAt, brokenAt, active }` lisible par un attaquant potentiel — pas d'autres champs sensibles ajoutés.
- [ ] **[smoke/WS]** Event Outbox `pvp.shield.broken` reçu via Socket.IO par le client du joueur dont le shield vient d'être rompu (chaîne `initiateAttack` PvP sortante → Outbox → gateway).
- [ ] **[grep]** Aucune occurrence en dur de `48` côté backend pour le shield : toute lecture passe par `WorldConfig.lifecycle.newbieShieldHours`. Vérification : pas de match `48` lié à shield dans `battleforthecrown-backend/src/modules/combat` ni `battleforthecrown-backend/src/modules/world`.
- [ ] **[visuel/gameplay]** Sur `SelectedEntityPanel` ciblant un joueur protégé : CTA `Attaquer` grisé + texte exact `« Joueur protégé — bouclier débutant (HH:MM restantes) »`, countdown décrémentant en live (interpolation client, pas de poll REST chaque seconde).
- [ ] **[visuel/gameplay]** Badge `NewbieShieldBadge` (icône bouclier + timer restant) visible sur fiche joueur publique, panneau village, et bandeau rapport de scout — pattern aligné sur l'affichage existant de la Période de capture.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma` (migration `shieldBrokenAt`)
- Workers/Outbox : skill `bftc-workers-outbox` (event `pvp.shield.broken`)
- React/HUD : skill `bftc-react-hud` (badge + countdown)

## Décomposition initiale (pré-remplie par `bftc-plan`)

_(Le lead peut affiner à l'étape 3 du `$bftc-run`.)_

- **T1 — Schéma Prisma + migration** : ajouter `shieldBrokenAt DateTime?` sur `WorldMembership`. 1 fichier `.prisma` + 1 migration SQL générée. Pas de colonne `endsAt` (formule dérivée).
- **T2 — Helper shared** : `packages/shared/src/pvp/shield.ts` exporte `isShieldActive({ joinedAt, brokenAt, newbieShieldHours, now })` et `shieldEndsAt({ joinedAt, newbieShieldHours })`. Tests unitaires couvrant : actif, expiré naturellement, rompu prématurément, valeur frontière exacte. Re-build `@battleforthecrown/shared` après ajout.
- **T3 — Zod + DTO shared** : `packages/shared/src/world/schemas.ts` ajoute `newbieShieldStateSchema` (`endsAt: ISODate, brokenAt: ISODate | null, active: boolean`). DTO re-exporté dans `packages/shared/src/world/dtos.ts`. Tests Zod.
- **T4 — Service backend `NewbieShieldService`** : `world/newbie-shield.service.ts` lit le state d'un `WorldMembership` (helper shared). Méthodes : `assertCanAttackTarget(defenderUserId, worldId, tx)` et `breakAttackerShield(attackerUserId, worldId, tx)`. Augmente `GET /worlds/:worldId/memberships/me` pour porter `newbieShield`.
- **T5 — Guard `combat.service.initiateAttack`** : guard entrant (refus 403 si défenseur protégé et cible `PLAYER_VILLAGE`) + guard sortant (`breakAttackerShield` si cible `PLAYER_VILLAGE` et attaquant sous shield). Outbox `pvp.shield.broken` créé dans la même transaction. **Pas** de modification de `initiateScout`, `initiateReinforce`, `initiateCaravan` (tests négatifs : ces 3 routes ne brisent jamais le shield et ne consultent jamais `assertCanAttackTarget`).
- **T6 — Exposition publique du shield** : DTO de fiche joueur publique (route à localiser/créer en refinement) augmenté de `newbieShield`. Si la fiche publique n'existe pas encore comme route REST dédiée, scoper sur les seules surfaces existantes (`SelectedEntityPanel` + rapport de scout) et reporter la fiche publique à un run ultérieur.
- **T7 — Front hook `useTargetShield`** : query React Query sur l'état du shield d'un joueur ciblé. Intégration `SelectedEntityPanel.tsx` : CTA grisé + message + countdown. Listener WS `pvp.shield.broken` → invalidate query du shield state self.
- **T8 — Composant `NewbieShieldBadge`** : icône + countdown. Consommé par : `SelectedEntityPanel`, bandeau rapport de scout, fiche joueur publique (selon T6). Helper shared `isShieldActive` réutilisé pour le calcul.
- **T9 — Tests + smokes** : unit shared (`shield.test.ts`), unit `combat.service` (4 cas : raid PvP entrant bloqué / raid barbare entrant OK / scout entrant OK / attaque sortante rompt), smoke E2E `pvp-newbie-shield.smoke.spec.ts` (curl séquencé + SQL), tests vitest composant.
- **T10 — Docs** : court add-on dans `docs/architecture/realtime.md` pour l'event `pvp.shield.broken`. Référence depuis `docs/gameplay/14-pvp-conquest.md` § 3 vers le helper shared (pas de duplication de la formule — cf. `docs/AGENTS.md` « ne pas dupliquer dans la doc »).

Chaque tâche reste ≤ 5 fichiers.

## Progress (rempli pendant le run)

_(git history)_

## Décisions prises

_(git history)_

## Rapport final

Garde-fou bouclier débutant livré : guard serveur `CombatService.initiateAttack` (403 `NEWBIE_SHIELD_ACTIVE` entrant + rupture `shieldBrokenAt` sortante, même tx + Outbox `pvp.shield.broken`), helper pur shared `isShieldActive`/`shieldEndsAt`, enrichissement `WorldEntityDto.newbieShield` (carte) + `me/memberships.newbieShield`, CTA grisé + countdown + badge header self. Durée toujours via `WorldConfig.lifecycle.newbieShieldHours` (aucun `48` en dur). Reportés (ticket `task_56e23ad7`) : badge rapport de scout + fiche publique joueur (route inexistante).

### Acceptance & QA

- [x] **[SQL]** `shieldBrokenAt DateTime?` ajouté, aucun `shieldEndsAt` — `cat …/20260620102649_add_newbie_shield_broken_at/migration.sql` → `ALTER TABLE "world_membership" ADD COLUMN "shield_broken_at" TIMESTAMPTZ(3);`
- [x] **[smoke]** Attaque PvP entrante vs défenseur protégé → 403 `NEWBIE_SHIELD_ACTIVE`, 0 Expedition, unités inchangées — `test:smoke:run -- pvp-newbie-shield` cas 1 ✓
- [x] **[smoke]** Attaque barbare par attaquant sous shield → 200, `shieldBrokenAt` NULL — cas 2 ✓
- [x] **[smoke]** Attaque PvP sortante par attaquant sous shield → 200 + `shieldBrokenAt` posé (même tx) + ligne `EventOutbox` `pvp.shield.broken` — cas 4 ✓
- [x] **[smoke]** Scout PvP entrant vs protégé → 200, `shieldBrokenAt` NULL — cas 3 ✓
- [x] **[smoke]** Attaque PvP entrante post-rupture → 200 — cas 5 ✓
- [x] **[curl/smoke]** `GET /world/me/memberships` porte `newbieShield {endsAt,brokenAt,active}` — `world.service.getUserMemberships` + smoke `world-membership` (7/7) ✓
- [~] **[curl]** Fiche publique joueur tierce porte `newbieShield` — **reporté** (aucune route profil public ; état cible exposé via `WorldEntityDto` carte à la place). Ticket `task_56e23ad7`.
- [x] **[smoke/WS]** Event Outbox `pvp.shield.broken` (chaîne initiateAttack → Outbox → planner `directUser('userId')`) — cas 4 asserte la row ; binding front exhaustif ✓
- [x] **[grep]** Aucun `48` en dur shield — `grep -rn 48 …/combat …/world | grep -iE shield|newbie` → vide ✓
- [ ] **[visuel — Kelvin]** CTA `Attaquer` grisé + texte « Joueur protégé — bouclier débutant (HH:MM restantes) » + countdown live (panneau cible)
- [ ] **[visuel — Kelvin]** Badge bouclier (icône + timer) visible header self + section panneau village
- [ ] **[visuel — Kelvin]** Perte du dernier village (`villageId=null`) : aucune régression, joueur reste en état éliminé valide
- **Review indépendante** : `Déclenchée (raison : (a) back+front+shared ; (c) diff >100 lignes ; (d) invariant durable garde-fou PvP)`. Cycle 1 `BLOCK` (prettier smoke + texte CTA + N+1 getConfig) → 3 findings fixés → cycle 2 `GO`.
- **Tests automatisés** : unit shared `pvp/shield.spec.ts` (5) + pixi `world-types.test.ts` (3) + `ws-bindings.test.ts` (1) ; backend unit 474 ✓ ; pixi 505 ✓ ; `yarn static-check` exit 0.
- **Smokes** : `Ciblés` — `test:smoke:run -- pvp-newbie-shield world-membership` → 12/12 ✓ (preflight OK). CI PR lance la suite complète.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/pvp-newbie-shield.smoke.spec.ts` (5 scénarios curl+SQL+Outbox).
- **QA fonctionnelle agent** : couverte par le smoke réel (boot app Nest + Postgres `battleforthecrown_smoke`, asserts HTTP + SELECT DB + EventOutbox row).
- **Tests IG à faire par le user** : checklist mobile — 2 comptes test, vérifier (a) CTA grisé + message timer côté attaquant vs défenseur protégé, (b) badge bouclier header + panneau, (c) attaque PvP sortante du protégé brise son badge en temps réel, (d) attaque barbare ne brise pas, (e) après expiration, plus de message ni badge.

## Points d'attention (notes du plan)

- **Source unique de la formule** : la durée vient toujours de `WorldConfig.lifecycle.newbieShieldHours` (cf. run 032). Pas de constante `48` en dur ailleurs. Le helper shared `isShieldActive` est la seule formule autorisée — toute lecture back ou front passe par lui.
- **Localisation fiche publique joueur** : à confirmer en refinement quelle route REST porte la fiche publique d'un joueur (signalée par le run-planner comme potentiellement absente). Si elle n'existe pas, scoper le badge sur les seules surfaces existantes (`SelectedEntityPanel` + bandeau rapport de scout) et reporter la fiche publique à un run ultérieur — éviter de gonfler ce run.
- **Conquête PvP couverte par le guard** : la conquête passe par `initiateAttack` (présence d'un `NOBLE` dans `units`), donc le pre-check couvre raid **et** conquête en un seul point. Bien matché à la spec qui ne distingue pas.
- **Joueur revenu après élimination** : `WorldMembership` est conservé à la perte du dernier village (cf. spec § Perte du dernier village). `joinedAt` ne bouge pas, donc pas de nouveau shield. Comportement strict de la spec « 48 h depuis création du `WorldMembership` » — à confirmer en refinement.
- **Rupture définitive** : une fois `shieldBrokenAt` posé, plus jamais de protection sur ce monde (même via reset ou rejoin éliminé). Cohérent avec spec ligne 197 « pas de timer de cooldown post-rupture, pas de réactivation possible ».
- **Pas de re-vérification trajet** : check uniquement au lancement, jamais re-vérifié pendant le trajet. Cohérent avec la règle déjà appliquée par `puissance ÷ 3` (cf. spec ligne 172).
- **Tradeoff fuite d'info `brokenAt`** : la spec n'explicite pas si `brokenAt` doit être visible aux tiers. Position retenue : cohérent avec le tradeoff `puissance ÷ 3` assumé (ligne 177), exposer l'état brut côté API publique (un attaquant a besoin de savoir que le shield est rompu pour décider). Confirmer en review.
- **Hors scope explicite** : ce run **n'implémente pas** le garde-fou `puissance ÷ 3` (§ 2 de la spec) ni le cooldown re-conquête (§ 4) — chacun fera son propre run. Reuse du helper shared `isShieldActive` et du pattern de pre-check par le futur run `puissance ÷ 3`.

## Liens

- **À faire avant** : Aucun (fondations existantes — schéma `WorldMembership`, `WorldConfig.lifecycle.newbieShieldHours` exposé, `initiateAttack` standardisé).
- **À faire après** : run futur « Garde-fou puissance ÷ 3 » (§ 2 de [`14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md)) — autre garde-fou anti-snowball, suivra le même pattern de pre-check dans `initiateAttack`.
- **Connexes** :
  - [032 — Lifecycle backend foundation + identité monde](archive/032-world-lifecycle-foundation-and-identity.md) — a livré `newbieShieldHours` côté config et exposition publique.
  - [051 — Classements Gloire d'Assaut / Rempart](archive/051-feature-rankings-glory.md) — modèle d'implémentation pour brancher un snapshot/guard PvP dans `initiateAttack`.
  - [052 — Retour joueur après perte du dernier village](archive/052-feature-eliminated-player-rejoin-flow.md) — interaction avec `WorldMembership` conservé après élimination.
- **Déjà résolu (archive)** : [23 — Snowball PvP : ni cooldown re-conquête, ni bouclier post-perte](../archive/23-pvp-snowball-no-cooldown-no-shield.md) — concerne le cooldown re-conquête (§ 4) et le **bouclier post-perte** rejeté, **pas** le bouclier débutant à l'arrivée. Pas un doublon.
- **Keywords scannés** : `bouclier`, `newbieShield`, `puissance`, `shield`, `pvp`, `guardrail`, `protection`, `débutant`.
