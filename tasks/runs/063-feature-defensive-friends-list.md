# Run #063 — feature-defensive-friends-list

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 12 — Ajouts mineurs MVP (cf. [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md) § Phase 12). User a tranché « à la rigueur la liste d'amis pour le MVP ok » (cf. [`docs/gameplay/20-defensive-friends.md`](../../docs/gameplay/20-defensive-friends.md) § Questions à trancher). Run de portage MVP minimaliste — extension cross-joueur de la mécanique de renfort déjà livrée.
- **Spec source** : [`docs/gameplay/20-defensive-friends.md`](../../docs/gameplay/20-defensive-friends.md) (table § Esquisse de spec + § Pourquoi pas plus) ; règles communes renfort dans [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) § Renforts entre ses propres villages (à étendre cross-joueur).
- **Type** : `feature`
- **Modules backend** : `prisma/schema.prisma` (+ migration `Friendship`), nouveau module `friendship/` (`friendship.service.ts`, `friendship.controller.ts`, `friendship.module.ts`, DTO Zod), `combat/combat.service.ts:303` (loosen guard renfort + ajout check ami acté côté `defensive_friends` actifs), `combat/dto/reinforce-command.schema.ts` (si nécessaire pour exposer `friendUserId` dans le payload).
- **Modules frontend** : nouvel écran/sheet `features/social/DefensiveFriendsSheet.tsx` (liste, ajout, retrait), point d'entrée HUD (probablement profil joueur ou drawer), extension `features/combat/ReinforcementForm` (ou équivalent) pour cibler un village d'un ami défensif actif, scout-report viewer pour révéler la liste d'amis défensifs visible du joueur ciblé.
- **Modules transverses** : `packages/shared/src/social/friendship.ts` (types `FriendshipStatus = 'PENDING_OUT' | 'PENDING_IN' | 'ACTIVE'`, DTOs, Zod), re-export `packages/shared/src/index.ts`, doc gameplay (lever le bandeau « doc en chantier » de [`docs/gameplay/20-defensive-friends.md`](../../docs/gameplay/20-defensive-friends.md) et trancher les 3 questions explicitement listées en bas de la spec).

## Dépendances

- Aucune dépendance bloquante active.
- Fondations déjà en place :
  - [`010 — Implementation frontend reinforcements`](archive/010-implementation-frontend-reinforcements.md) ✅ DONE — UI renfort intra-joueur livrée.
  - [`044 — Reinforcement reports`](archive/044-feature-reinforcement-reports.md) ✅ DONE — inbox renfort + `InboxEntry` cross-joueur déjà prévue côté schéma (cf. `17-inbox-and-reports.md` § Frontière `ReinforcementReport / InboxEntry`).
  - `Garrison` schema supporte déjà `originVillageId` ≠ `villageId` propriétaire ([`battleforthecrown-backend/prisma/schema.prisma:646`](../../battleforthecrown-backend/prisma/schema.prisma)) — architecture cross-joueur dormante, business rule à lever (`combat.service.ts:303` ForbiddenException).
- **Hors scope explicite** : alliances/tribus complètes ([`21-alliances-and-tribes.md`](../../docs/gameplay/21-alliances-and-tribes.md) — strictement post-MVP), chat, bannière commune, partage de vision, partage de ressources, classement collectif, attaque coordonnée. Toute fonctionnalité au-delà de « renfort mutuel autorisé » glisse vers le système d'alliances et doit être refusée dans ce run.

## Critère de fin (acceptance)

- [ ] **[SQL]** Migration Prisma crée le modèle `Friendship` avec au minimum : `id`, `worldId`, `requesterUserId`, `recipientUserId`, `status` (`PENDING` | `ACTIVE`), `createdAt`, `acceptedAt?`. Unique `(worldId, requesterUserId, recipientUserId)` + check applicatif `requesterUserId != recipientUserId`. Index `(worldId, recipientUserId, status)` **et** `(worldId, requesterUserId, status)` — les deux sens du cap bi-directionnel doivent être indexés (sans `status` côté requester, l'unique constraint ne couvre qu'un préfixe et la query du cap force un filter scan sur les `PENDING` cumulés du joueur).
- [ ] **[SQL/curl]** Endpoint `POST /worlds/:worldId/friendships` (body : `{ recipientUserId | recipientDisplayName }`) crée une `Friendship` `PENDING` côté demandeur. Idempotent côté demandeur (re-POST = 200 même state). Refusé 409 avec code machine-lisible distinct par branche :
  - `FRIENDSHIP_ALREADY_ACTIVE` si une `Friendship` `ACTIVE` existe déjà entre les deux joueurs sur le monde.
  - `FRIENDSHIP_PENDING_AWAITING_ACCEPT` si une `Friendship` `PENDING` **symétrique** existe (l'autre joueur a déjà envoyé une demande — le caller doit l'accepter via `pendingIn`, pas en recréer une). Le message client doit guider explicitement vers le flow `accept`.
- [ ] **[curl]** Endpoint `POST /worlds/:worldId/friendships/:id/accept` bascule en `ACTIVE` uniquement si caller = `recipientUserId` et status `PENDING`. Set `acceptedAt`. 403 sinon. **Le cap 5 ACTIVE est revérifié des deux côtés au moment de l'accept** (acceptor **ET** requester) — si l'un des deux est déjà à 5 `ACTIVE`, retour 409 `DEFENSIVE_FRIENDS_CAP_REACHED` (race possible : A à 4 ACTIVE envoie à B et C, B accepte → A à 5, C accepte → sans recheck côté requester A passerait silencieusement à 6). **Anti-doublon symétrique au moment de l'accept** : si une `Friendship` `ACTIVE` existe déjà entre `requesterUserId` et `recipientUserId` dans **l'un ou l'autre sens** (race : A et B postent leur demande mutuelle simultanément → 2 `PENDING` coexistent ; B accepte `A→B`, puis A accepte `B→A` sans guard symétrique → pair doublement ACTIVE qui fausse le cap), retour 409 `FRIENDSHIP_ALREADY_ACTIVE`. Le check des deux côtés (cap + symétrique-ACTIVE) + l'accept doivent être dans la **même transaction** Prisma avec `SELECT … FOR UPDATE` sur les `Friendship` ACTIVE du couple `(worldId, userId)` pour serializer les accept concurrents.
- [ ] **[curl]** Endpoint `DELETE /worlds/:worldId/friendships/:id` retire la `Friendship` (hard delete acceptable au MVP — pas d'historique social demandé). Autorisé pour les deux côtés (`requesterUserId` ou `recipientUserId`). Pas de cooldown (cf. spec § Garde-fou anti-abus : « probablement non au MVP — la simplicité prime »).
- [ ] **[curl]** Endpoint `GET /worlds/:worldId/friendships/me` renvoie la liste des `Friendship` du caller (3 catégories : `pendingOut`, `pendingIn`, `active`), avec `displayName` de l'autre côté.
- [ ] **[business rule]** Cap **5 amis défensifs ACTIVE max** par `(worldId, userId)`. Une 6ᵉ `accept` ou `request` retourne 409 (code `DEFENSIVE_FRIENDS_CAP_REACHED`) avec message lisible. Le cap est par côté caller (5 ACTIVE comme requester OU recipient cumulés).
- [ ] **[curl]** `POST /combat/reinforce` avec `targetVillageId` appartenant à un ami `ACTIVE` du caller (même monde) → `200` autorisé, `Garrison` créé avec `originVillageId` du caller + `villageId` du village ami. La pop reste consommée par le **village d'origine du caller** (cf. spec § Comptabilité population). Vérif SQL : `Population.used` du village origine ↑, du village hôte inchangé.
- [ ] **[curl]** `POST /combat/reinforce` vers un village joueur **non ami** (et non possédé) → `403` (`ForbiddenException` actuel conservé pour le cas pas-ami).
- [ ] **[combat]** Smoke : un raid contre le village ami hébergeant des renforts utilise les troupes des amis dans la défense, avec leur **propre puissance** + leur **propre bonus de style** (cf. spec § Vision côté combat — pattern existant pour renforts intra-joueur étendu cross-joueur). Pertes pop libérées au village d'origine du défenseur (pas du village ami).
- [ ] **[curl]** `POST /combat/reinforce/recall` (ou équivalent existant) par le propriétaire des troupes (= ami envoyé) → trajet retour vers son village. Smoke vérifie : seul le propriétaire d'origine peut rappeler ses renforts ; le propriétaire du village hôte ne peut pas (mais peut `Renvoyer`, voir item suivant).
- [ ] **[curl]** Le propriétaire du village hôte peut `Renvoyer` (= `RETURNED`) les renforts d'un ami stationnés chez lui (cohérent avec le pattern intra-joueur existant). Smoke vérifie : retour vers le village d'origine ami, libération pop côté origine, rapport `ReinforcementReport` `RETURNED` créé pour l'ami.
- [ ] **[scout]** Le rapport de scout sur un joueur cible expose sa liste d'amis défensifs `ACTIVE` (cf. spec § Questions à trancher : « Plutôt **oui** — un attaquant doit pouvoir évaluer le risque qu'un voisin envoie des renforts »). DTO `ScoutReportResponse.details` enrichi de `defensiveFriendsDisplayNames: string[]`.
- [ ] **[capture window]** Pendant une **fenêtre de capture PvP** d'un village conquis par un ami, l'ami défensif **ne peut PAS** envoyer de renforts à la garnison d'occupation (cf. spec § Questions à trancher : aligné sur [`14-pvp-conquest.md` § Acteurs autorisés](../../docs/gameplay/14-pvp-conquest.md#acteurs-autorisés-à-attaquer-pendant-la-fenêtre) qui exclut explicitement les « alliés du défenseur » au MVP). Le guard existant `garrison d'occupation = fermée aux renforts pendant la fenêtre` doit couvrir ce cas — vérifier par smoke explicite.
- [ ] **[frontend]** Sheet `DefensiveFriendsSheet` accessible depuis le profil joueur (ou drawer HUD à confirmer en refinement) : liste les 3 catégories (`pendingIn`, `pendingOut`, `active`), bouton add via pseudo, accept/refuse pour `pendingIn`, retirer pour `active`/`pendingOut`. Désactive l'ajout si cap 5 atteint avec tooltip « Cap 5 amis défensifs ».
- [ ] **[frontend]** Le formulaire de renfort autorise la cible d'un village d'ami `ACTIVE`. Si le caller n'a pas d'amis `ACTIVE`, seul l'auto-renfort reste cliquable.
- [ ] **[frontend]** Le rapport de scout affiche la liste d'amis défensifs `ACTIVE` du joueur ciblé (compacte, ≤ 5 noms).
- [ ] **[docs]** [`docs/gameplay/20-defensive-friends.md`](../../docs/gameplay/20-defensive-friends.md) : bandeau `🚧 Doc en chantier` levé, statut bascule `✅ MVP léger livré`. Les 3 questions à trancher sont tranchées dans la spec (inclus au MVP : oui ; révélé par scout : oui ; renfort pendant fenêtre capture PvP : non, aligné sur `14`). Pas de duplication des règles techniques — pointer vers `04-combat.md` § Renforts pour les invariants partagés.
- [ ] **[docs]** [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) § Renforts entre ses propres villages renommé en « Renforts entre villages (auto + amis défensifs) » avec une note pointant vers `20-defensive-friends.md` pour le cap 5 + réciprocité (pas de duplication du contenu).
- [ ] **[docs]** [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md) § Phase 12 : ligne `20-defensive-friends.md` mise à jour avec lien vers ce run.
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts. Smokes ajoutés `friendship.smoke.spec.ts` + `cross-player-reinforcement.smoke.spec.ts` verts.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma` (nouveau modèle `Friendship` + migration)
- React/HUD : skill `bftc-react-hud` (sheet + form + scout report)

## Décomposition initiale (pré-remplie par `bftc-plan`)

_(Le lead peut affiner à l'étape 3 du `$bftc-run`.)_

- **T1 — Spec docs** : trancher dans `docs/gameplay/20-defensive-friends.md` les 3 questions ouvertes (MVP inclus, révélé par scout, pas pendant fenêtre capture), lever le bandeau chantier, normaliser pointeurs vers `04-combat.md` § Renforts. Mettre à jour roadmap Phase 12. **Aucun code touché à ce stade** — gate doc-first.
- **T2 — Shared types** : `packages/shared/src/social/friendship.ts` exporte `FriendshipStatus`, `FriendshipDto`, `DEFENSIVE_FRIENDS_CAP = 5`. Zod schemas. Re-build `@battleforthecrown/shared`. Tests purs.
- **T3 — Schéma Prisma + migration** : modèle `Friendship` + unique + index + relation `User`/`WorldMembership` (à choisir en refinement). Re-générer client.
- **T4 — Module backend `FriendshipModule`** : service + controller + DTO Zod + guard. Endpoints `POST /worlds/:id/friendships`, `POST /worlds/:id/friendships/:fid/accept`, `DELETE /worlds/:id/friendships/:fid`, `GET /worlds/:id/friendships/me`. Cap 5 ACTIVE enforced côté service. Unit + smoke `friendship.smoke.spec.ts`.
- **T5 — Loosen reinforcement guard** : `combat.service.ts:initiateReinforce` ouvre la cible si `targetVillage.userId === caller || friendship ACTIVE entre caller et targetVillage.userId dans le monde`. Pas de modification de `initiateAttack` ni `initiateCaravan`. Smoke `cross-player-reinforcement.smoke.spec.ts` couvre les 4 cas (ami / pas ami / pendant capture window / recall + renvoyer).
- **T6 — Scout report enrichi** : `scout-report.presenter.ts` ajoute `defensiveFriendsDisplayNames` à `details`. DTO shared mis à jour. Smoke `scout-report.smoke.spec.ts` étendu.
- **T7 — Front sheet `DefensiveFriendsSheet`** : nouvel écran/sheet avec liste 3 catégories + add + accept + remove. Point d'entrée HUD à confirmer en refinement. Vitest composant.
- **T8 — Front renforcement form** : extension du form existant pour cibler village ami. Vitest composant.
- **T9 — Front scout report viewer** : afficher la liste d'amis dans le panneau scout. Vitest composant.
- **T10 — Smokes + docs récap** : `yarn test:smoke` ciblé, mise à jour `docs/architecture/backend-modules.md` § Modules avec le nouveau `friendship/`, pas de duplication métier.

Chaque tâche reste ≤ 5 fichiers.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** : à remplir à l'étape 10.
- **Review indépendante** : `Déclenchée (raison : (a) back+front+shared simultanés ; (b) modifie SPEC.md — `20-defensive-friends.md` tranche 3 questions ; (d) invariant durable — extension du contrat de renfort qui devient cross-joueur)`.
- **Tests automatisés** : unit `friendship.test.ts` (shared), unit `friendship.service.spec.ts` (cap, idempotence, refus, accept), smoke `friendship.smoke.spec.ts` (CRUD), smoke `cross-player-reinforcement.smoke.spec.ts` (4 cas), vitest sheet + form + scout viewer.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/friendship.smoke.spec.ts` (à créer), `battleforthecrown-backend/test/cross-player-reinforcement.smoke.spec.ts` (à créer), `battleforthecrown-backend/test/scout-report.smoke.spec.ts` (étendre).
- **QA fonctionnelle agent** : `curl` séquencé sur stack locale (2 comptes test sur même monde) : add → accept → cap 5 → reinforce → retrait → scout révèle.
- **Tests IG à faire par le user** : checklist mobile ≤ 5 items — (a) ajout d'un ami via pseudo + accept côté autre compte, (b) cap 5 atteint = bouton ajout grisé, (c) renfort vers village ami visible sur carte, (d) scout d'un joueur tiers ami du défenseur révèle la liste d'amis, (e) retrait unilatéral fonctionne et coupe l'accès renfort.

## Points d'attention (notes du plan)

- **Pas de cooldown ajout/retrait au MVP** (cf. spec § Garde-fou anti-abus : « probablement non au MVP — la simplicité prime »). Si playtest révèle de l'abus (« ami nocturne »), rouvrir post-MVP.
- **Réciprocité obligatoire** : pas d'ajout unilatéral. Une `Friendship` `PENDING` ne donne **aucun** droit de renfort tant que non `ACTIVE`.
- **Pas de chat, bannière, attaque coordonnée, partage de vision/ressources/classement** — cf. spec § Pourquoi pas plus. Toute demande de feature au-delà du renfort mutuel glisse vers `21-alliances-and-tribes.md` (post-MVP).
- **Pop reste consommée par le village d'origine** — vérifier que le pattern existant de renfort intra-joueur (`04-combat.md` § Population) est étendu correctement cross-joueur sans transfert de pop entre comptes.
- **Garnison occupation pendant capture PvP** : cohérence stricte avec `14-pvp-conquest.md` § Acteurs autorisés — la liste d'amis ne débloque **pas** l'envoi de renforts pendant la fenêtre de capture PvP. Le guard `garrison d'occupation = fermée aux renforts pendant la fenêtre` doit déjà couvrir ce cas (à vérifier par smoke explicite — risque d'oubli si le guard regarde l'ownership et pas le `pendingConquest.OPEN`).
- **Style des troupes d'amis en défense** : les bonus de style restent attachés au village d'origine (pas au village hôte). Pattern déjà appliqué intra-joueur (cf. `04-combat.md` § Renforts), à étendre cross-joueur sans modification de la résolution combat (le `Garrison.originVillageId` porte déjà le style).
- **Scope frontend large** : sheet + form extension + scout viewer = 3 surfaces. Si le scope dérive en raffinement, scinder T7/T8/T9 en sous-runs (mais ne pas couper la prise en charge backend qui doit rester atomique).
- **Naming**: `DEFENSIVE_FRIENDS_CAP = 5` côté shared, pas en dur dans le backend. Permet un override `WorldConfig` post-MVP si besoin (out of scope ici — la cap reste constante MVP).
- **Notification ami ajouté/accepté** : pas d'event WS bloquant pour le MVP. Le destinataire voit l'invite lors de sa prochaine ouverture de sheet. Si demandé en review, ajouter un event `friendship.requested` / `friendship.accepted` dans Outbox (cohérent avec pattern existant) — à arbitrer en refinement.

## Liens

- Spec : [`docs/gameplay/20-defensive-friends.md`](../../docs/gameplay/20-defensive-friends.md), [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) § Renforts entre ses propres villages, [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) § Acteurs autorisés à attaquer pendant la fenêtre, [`docs/gameplay/21-alliances-and-tribes.md`](../../docs/gameplay/21-alliances-and-tribes.md) (post-MVP, hors scope ici).
- Roadmap : [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md) § Phase 12 — Ajouts mineurs MVP.
- Runs connexes : [`010 — Implementation frontend reinforcements`](archive/010-implementation-frontend-reinforcements.md) (UI renfort intra-joueur), [`044 — Reinforcement reports`](archive/044-feature-reinforcement-reports.md) (inbox renfort + `InboxEntry`).
- Référence schéma : `Garrison` avec `originVillageId` ([`battleforthecrown-backend/prisma/schema.prisma:643`](../../battleforthecrown-backend/prisma/schema.prisma)), guard à lever ([`battleforthecrown-backend/src/modules/combat/combat.service.ts:303`](../../battleforthecrown-backend/src/modules/combat/combat.service.ts)).
