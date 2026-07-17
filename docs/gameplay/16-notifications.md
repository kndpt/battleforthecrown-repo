# Notifications push & timers

> 🚧 **Doc en chantier.** La couche **push** (FCM/APNs, sessions fermées) reste à détailler (Phase 6, POST-MVP). La couche **in-app** de l'attaque entrante est en revanche **livrée** (run 086) — voir [§ Visibilité in-app de l'attaque entrante](#visibilité-in-app-de-lattaque-entrante-livré--run-086). Cette page acte que les notifications entrent dans le scope **MVP** ; l'analyse design push (catalogue exact, opt-in granulaire, latence acceptable, intégration FCM/APNs) viendra dans une seconde passe.

## Pourquoi c'est obligatoire au MVP

Sur mobile, l'asymétrie temporelle écrase le défenseur sans notifications. Un joueur qui découvre 8 h après coup que son village est tombé pendant la nuit — sans avoir eu la fenêtre pour réagir — quitte le jeu. La plupart des combats et conquêtes se résolvent **pendant** que le joueur ne regarde pas l'app : c'est la notification qui ramène le joueur dans la boucle, pas l'app elle-même.

C'est aussi la condition pour que les fenêtres de capture variables (4 à 18 h, cf. [`14-pvp-conquest.md` § Période de capture variable](./14-pvp-conquest.md#période-de-capture-variable-selon-le-niveau-du-château)) aient un sens : sans notif, l'attaquant ne sait pas quand sa conquête a tenu, et le défenseur ne sait pas qu'il doit lever une armée.

Modèle de référence : Tribal Wars / Kingsage affichent le timer d'attaque entrante en permanence dans l'app et envoient un push si elle est fermée. C'est le comportement minimum attendu sur le segment.

## Cible MVP — esquisse

Catégories de notifications, chaînées au pattern Outbox côté backend (cf. [`docs/architecture/realtime.md`](../architecture/realtime.md)).

| Catégorie | Trigger | Audience | Criticité |
| --- | --- | --- | --- |
| **Attaque entrante** (avec ETA) | Une armée ennemie est en route vers un de mes villages | Défenseur | 🔴 Critique — fenêtre de réaction limitée |
| **Fin de fenêtre de capture** | La fenêtre de [conquête](./14-pvp-conquest.md#période-de-capture-variable-selon-le-niveau-du-château) que je tiens (ou qui me cible) se termine — succès ou échec | Attaquant + défenseur | 🔴 Critique — issue stratégique majeure |
| **Site d'exploitation attaqué** | Une équipe envoyée sur un site de ressource est attaquée (event `extraction.attacked`, cf. [`realtime.md`](../architecture/realtime.md)) | Exploitant | 🔴 Critique — perte possible d'escorte / récolte |
| **Retour d'armée** | Une armée revient avec troupes, loot ou fin de rappel | Propriétaire | 🟡 Important — relance une décision |
| **Rapport reçu** | Un rapport combat / scout important est créé | Participant | 🟡 Important — ouvre vers l'inbox si pertinent |
| **Fin de construction / entraînement** | Un upgrade de bâtiment ou une queue d'entraînement se termine | Propriétaire | 🟡 Rétention — incite à la session suivante |

Détails à trancher plus tard : opt-in/opt-out par catégorie, regroupement (un seul push pour 3 entraînements simultanés ?), latence acceptable, fallback in-app (badge HUD) si push refusé par l'OS, deep-link vers le bon écran, intégration FCM/APNs et plomberie côté backend.

## Asymétrie attaquant ↔ défenseur

Point d'attention design pour la spec finale : l'attaquant **choisit** son timing (il sait quand il a cliqué « envoyer »), le défenseur **subit** (il ne contrôle pas quand il est attaqué). Donc la notif d'attaque entrante est **structurellement plus critique** que la notif de retour d'armée pour l'attaquant. Latence et fiabilité doivent être dimensionnées sur ce cas-là.

## Visibilité in-app de l'attaque entrante (livré — run 086)

La **couche in-app** de l'attaque entrante est livrée, indépendamment du push hors-ligne (Phase 6, POST-MVP). Modèle Tribal Wars / Kingsage : timer permanent dans l'app, le push viendra seulement pour les sessions fermées.

- **Événement** : `attack.incoming` (Outbox/WS), émis dans la même transaction que `battle.sent` à l'envoi d'une attaque, **uniquement** sur cible `PLAYER_VILLAGE`. Routé au seul propriétaire du village ciblé (un village barbare n'a pas de défenseur). Détail : [`docs/architecture/realtime.md`](../architecture/realtime.md).
- **Endpoint** : `GET /combat/:villageId/incoming` (JWT, ownership service-side) — liste les expéditions `ATTACK` `EN_ROUTE` encore à venir ciblant **ce** village, ETA croissante.
- **Fog-of-war** : seuls `expeditionId, targetVillageId, targetX, targetY (village défenseur), arrivalAt` sont exposés. **Jamais** la composition de l'armée attaquante ni l'identité/origine de l'attaquant.
- **HUD** : onglet « Menaces » du bottom sheet *Activités du royaume* (`KingdomActivitiesPanel`), compte à rebours vivant par menace + badge compteur ; rafraîchi par WS + invalidation TanStack Query, sans reload.
- **Hors scope run 086** : push FCM/APNs, opt-in granulaire, agrégat multi-villages (la section est scopée au village courant), révélation de la composition/origine.

## Visibilité in-app de la fenêtre de capture — volet défenseur (livré — run 094)

Le pendant défenseur de la catégorie 🔴 « Fin de fenêtre de capture ». L'attaquant voyait déjà ses captures en cours (onglet « Captures ») ; le propriétaire original d'un village PvP en cours de capture a désormais sa propre surface in-app live, calquée sur le run 086. Push FCM/APNs toujours hors scope (Phase 6, POST-MVP).

- **Événements** (Outbox/WS) : les 3 events de cycle de fenêtre atteignent le défenseur, en plus de l'attaquant :
  - `village.capture-window-opened` / `village.capture-window-interrupted` — **dual-routés** au propriétaire original du village cible (résolu à la volée pendant `OPEN`, où `Village.userId` reste le défenseur). La **copie défenseur est fog-scrub** : les champs `attackerUserId` / `attackerVillageId` sont retirés (miroir du scrub `observerUserId` de `village.attacked`).
  - `village.capture-window-completed` — routé au nouveau propriétaire **et** à `previousOwnerUserId` (snapshot de l'ancien propriétaire, jamais résolu live après transfert).
  - Une cible barbare (`userId = null`) n'a pas de défenseur → jamais routée. Détail : [`docs/architecture/realtime.md`](../architecture/realtime.md).
- **Endpoint** : `GET /combat/captures/targeting-me?worldId=` (JWT, ownership service-side via `targetVillage.userId = userId`, **jamais** `@Public`) — liste per-world les fenêtres `OPEN` ciblant les villages du joueur, `captureUntil` croissante. Per-world (mirror de `getOpenConquests`) pour couvrir un défenseur multi-village.
- **Fog-of-war** : le `DefenderCaptureDto` (`strictObject` Zod) n'expose que `{pendingConquestId, targetVillageId, targetName, targetX, targetY, targetCastleLevel, captureStartedAt, captureUntil, status}` — c.-à-d. le village **du défenseur** + l'échéance. **Jamais** l'identité/origine de l'attaquant ni la garnison d'occupation.
- **HUD** : onglet « Sièges » du bottom sheet *Activités du royaume* (`KingdomActivitiesPanel`) + badge compteur rouge sur la carte, compte à rebours vivant « fenêtre jusqu'à T » par village assiégé ; rafraîchi par WS + invalidation TanStack Query, sans reload. **Idempotence at-least-once** : le feed dédup par `pendingConquestId` (mapper first-wins) ; une livraison WS dupliquée ne fait que ré-invalider la query (no-op), sans doubler la carte ni relancer le countdown.
- **Hors scope run 094** : push FCM/APNs, opt-in granulaire, révélation de la composition/origine de l'attaquant.

## Visibilité in-app du site d'exploitation attaqué (livré — run 098)

Troisième et dernière catégorie 🔴 Critique MVP à recevoir sa surface in-app. Quand l'escorte d'une équipe d'exploitation est interceptée (`extraction.attacked`), l'exploitant est averti in-app **sans reload**, en complément des invalidations de cache existantes. Push FCM/APNs toujours hors scope (Phase 6, POST-MVP).

- **Nature de l'event** : `extraction.attacked` est **discret** (fait accompli), pas un état persistant listable (contrairement à `attack.incoming` du run 086 ou aux fenêtres `OPEN` du run 094). Aucun endpoint / onglet `targeting-me` : l'interception s'émet une fois puis l'extraction rentre (interruption) ou se poursuit (défaite attaquant). Les extractions **actives** restent visibles dans l'onglet « Expéditions ». Le trou comblé = l'**alerte à l'arrivée de l'event**.
- **Payload** (`ExtractionAttackedPayload`, shared) : enrichi de `resourceType` (`WOOD`/`STONE`/`IRON`) pour nommer le site attaqué. Reste **fog-safe** : aucune identité/origine de l'attaquant (le backend n'écrit volontairement aucun `CombatReport` pour l'interception).
- **HUD** : toast via le store UI dans `applyExtractionAttacked` — `interrupted=true` → toast **error** « Site d'exploitation attaqué » avec les quantités volées (`stolen` par ressource) ; `interrupted=false` → toast **success** « Attaque repoussée ». **Idempotence at-least-once** (ADR-02) : le toast est dédupliqué par `expeditionId` (garde à TTL court côté client) ; une livraison WS dupliquée ne relance qu'une invalidation TanStack Query idempotente, sans doubler l'alerte.
- **Hors scope run 098** : push FCM/APNs, opt-in granulaire, endpoint/onglet dédié (injustifié sans état persistant), révélation de la composition/origine de l'attaquant.

## Visibilité in-app du retour d'armée (livré — run 104)

Première catégorie 🟡 Important (les runs 086/094/098 couvraient les trois catégories 🔴 Critique) à recevoir sa surface in-app. Run **front-only** : `battle.returned` était déjà émis et routé au propriétaire du village avec un payload complet — aucun changement backend ni shared.

- **Événement** : `battle.returned` (Outbox/WS), déjà routé au seul propriétaire du village. Payload déjà complet : `expeditionId`, `reportId`, `villageId`, `survivingUnits`, `loot.resources`. Détail : [`docs/architecture/realtime.md`](../architecture/realtime.md).
- **Condition de déclenchement** : toast seulement si au moins un survivant **ou** au moins une ressource de butin > 0. Ni survivant ni butin → aucun toast (garde défensive : le return worker ne pose de toute façon pas de `returnAt` sans survivant).
- **HUD** : toast via le store UI dans `applyBattleReturned`. Butin > 0 → toast **success** « Armée rentrée » avec les quantités par ressource rendues en icônes (canal `refundItems`, socle run 045) ; l'`aria-label` du bloc a été neutralisé en « Ressources » puisqu'il sert désormais aussi bien au remboursement qu'au butin. Butin nul (survivants seuls) → toast **info** « Retour à vide — aucun butin ».
- **Idempotence at-least-once** (ADR-02) : dédup par `expeditionId` via la garde à TTL partagée du run 098 (`dedupeToast`), ici avec un TTL explicite de **60 s** au lieu du défaut 10 s. `battle.returned` est **terminal** — un `expeditionId` donné ne rentre qu'une fois — donc un TTL large ne masque aucun retour légitime ; il ne fait que borner la croissance mémoire du Set face aux redeliveries (poll Outbox ~1 s + rejeu à la reconnexion). Les invalidations de cache restent hors garde (idempotentes).
- **Hors scope run 104** : push FCM/APNs, opt-in granulaire, endpoint/onglet dédié, agrégat multi-retours.

## Liens

- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — fenêtres de capture variables (consommateur principal des notifs).
- [`04-combat.md`](./04-combat.md) — mécanique de raid / retour d'armée (consommateur des notifs entrante + retour).
- [`docs/architecture/realtime.md`](../architecture/realtime.md) — pattern Outbox + WebSocket (canal in-app, à compléter par push pour les sessions fermées).
- [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes et Oyez ; les notifications ne sont pas une quête, elles ramènent au bon moment.
- [`15-onboarding.md`](./15-onboarding.md) — l'autre boucle MVP de rétention session-1.
- [`lab/tickets/07-resource-extraction-sites.md`](./lab/tickets/07-resource-extraction-sites.md) — site d'exploitation attaqué, mécanique livrée (run 091) ; catégorie notification push encore non implémentée.
