# Liste d'amis défensifs

> ✅ **MVP léger livré** — backend + contrat shared ([run 063](../../tasks/runs/archive/063-feature-defensive-friends-list.md)), HUD Pixi/React ([run 084](../../tasks/runs/archive/084-feature-defensive-friends-frontend.md)). Compromis minimal pour offrir une coopération **défensive** sans introduire le système complet d'alliances ([`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md), strictement post-MVP).

## Pourquoi cette doc

L'absence d'alliances au MVP ([`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md)) crée un risque de PvP émergent dégénéré : *« le plus actif mange les autres »* sans profondeur tactique. Un solo qui tombe sur un cluster de 3 voisins agressifs n'a aucune contre-mesure structurelle hors la fuite ou la déconnexion.

La **liste d'amis défensifs** est un compromis ultra-minimal qui rétablit une **coopération défensive** sans l'overhead d'une vraie tribu (chat, bannière, hiérarchie, classement collectif, diplomatie, etc.).

## Esquisse de spec

| Élément | Piste |
| --- | --- |
| **Cap** | 5 amis défensifs max par joueur. Cap dur, pas extensible par bâtiment ou couronnes. |
| **Réciprocité** | **Autorisation mutuelle obligatoire** — A ajoute B, B doit accepter pour que la liaison soit active. Pas d'ajout unilatéral. |
| **Périmètre fonctionnel** | **Renforts uniquement** : un ami peut envoyer ses troupes en garnison sur un de mes villages (cf. [`04-combat.md` § Renforts entre ses propres villages](./04-combat.md#renforts-entre-ses-propres-villages) — même mécanique étendue cross-joueur). Rien d'autre. |
| **Hors périmètre** | ❌ Pas de chat, pas de bannière commune, pas d'attaque coordonnée (l'attaquant tiers reste tiers, cf. [`14-pvp-conquest.md`](./14-pvp-conquest.md)), pas de partage de vision (chacun garde sa propre tour de guet), pas de partage de ressources, pas de classement collectif. |
| **Vision côté combat** | Les troupes en renfort d'un ami **défendent comme leurs propres troupes** mais avec leur **propre puissance** + leurs **propres bonus de style** (cf. [`04-combat.md`](./04-combat.md) — pattern déjà en place pour les renforts entre villages d'un même joueur, étendu à un joueur ami). |
| **Comptabilité population** | La pop reste **consommée par le joueur d'origine** (l'ami qui a envoyé les troupes), comme pour les renforts inter-villages. Pas de transfert. |
| **Retrait** | Le joueur qui a envoyé les renforts peut les retirer à tout moment via l'action « Renforcer » inverse (cf. [`04-combat.md`](./04-combat.md#renforts-entre-ses-propres-villages)). |
| **Gestion de la liste** | Ajout via pseudo / fiche joueur, retrait à tout moment. Pas de cooldown. |
| **Garde-fou anti-abus** | À étudier : faut-il un cooldown sur l'ajout/retrait d'un ami pour éviter qu'on l'utilise comme proxy de coordination temporaire (« je t'ajoute juste pour cette nuit, on se retire après ») ? Probablement non au MVP — la simplicité prime. |

## Pourquoi pas plus

Tout ce qui n'est pas « renforts mutuels autorisés » glisse mécaniquement vers un système de tribu et appartient à [`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md). La distinction n'est pas un choix esthétique : c'est ce qui permet de livrer la coopération défensive en MVP sans porter la dette UX/backend d'un vrai système social (chat, modération, gestion de rôles, etc.).

## Décisions tranchées (MVP)

- **Inclus au MVP ?** ✅ **Oui** (user : *« à la rigueur la liste d'ami pour le MVP ok »*). Périmètre minimal : table `Friendship` + endpoints CRUD + extension cross-joueur de la mécanique de renfort. **Aucun** chat / bannière / attaque coordonnée / partage de vision-ressources-classement.
- **Visibilité publique** : ✅ **Oui, révélé par scout**. Le rapport de scout sur un joueur expose la liste de ses amis défensifs `ACTIVE` (`ScoutReportResponse.details.defensiveFriendsDisplayNames`), snapshot au moment du scout (figé comme `wallLevel`/`newbieShield`). Un attaquant peut ainsi jauger le risque de renfort.
- **Effet pendant la fenêtre de capture PvP** : ❌ **Non**. Un ami défensif **ne peut pas** renforcer un village sous fenêtre de capture `OPEN` — aligné sur [`14-pvp-conquest.md` § Acteurs autorisés à attaquer pendant la fenêtre](./14-pvp-conquest.md#acteurs-autorisés-à-attaquer-pendant-la-fenêtre) qui exclut les *« alliés du défenseur »*. Le guard de renfort refuse toute cible portant un `PendingConquest` `OPEN`.

## Contrat technique (MVP livré)

- **Statut `Friendship`** : `PENDING` → `ACTIVE`. Seul `ACTIVE` ouvre le droit de renfort réciproque. Cap **5 `ACTIVE`** par joueur, revérifié des deux côtés à l'`accept` (codes `FRIENDSHIP_ALREADY_ACTIVE`, `FRIENDSHIP_PENDING_AWAITING_ACCEPT`, `DEFENSIVE_FRIENDS_CAP_REACHED`).
- **Endpoints** : `POST /worlds/:worldId/friendships`, `GET …/me`, `POST …/:id/accept`, `DELETE …/:id`. Voir [`backend-modules.md` § friendship](../architecture/backend-modules.md).
- **Renfort cross-joueur** : invariants durée / pop (consommée à l'origine) / pertes / style **non dupliqués ici** — cf. [`04-combat.md` § Renforts entre villages](./04-combat.md#renforts-entre-villages-auto--amis-défensifs). Le retrait passe par les actions existantes `Rappeler` (propriétaire des troupes) / `Renvoyer` (propriétaire du village hôte) ; un `DELETE` de l'amitié ne rappelle **pas** les garnisons déjà stationnées.

## Liens

- [`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md) — système complet d'alliances, **post-MVP**.
- [`04-combat.md` § Renforts entre ses propres villages](./04-combat.md#renforts-entre-ses-propres-villages) — mécanique de base à étendre au cross-joueur.
- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — PvP de conquête, qui exclut aujourd'hui toute aide d'un tiers pendant la fenêtre de capture.
- [`11-scouting.md`](./11-scouting.md) — scout (consommateur potentiel : révéler la liste d'amis d'un joueur cible).
