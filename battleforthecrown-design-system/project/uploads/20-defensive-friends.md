# Liste d'amis défensifs

> 🚧 **Doc en chantier — candidate MVP minimaliste.** Compromis envisagé pour offrir un minimum de coopération sans introduire le système complet d'alliances ([`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md), strictement post-MVP). À analyser pour décider si on l'inclut au MVP ou si on le repousse aussi.

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

## Questions à trancher

- **Inclus au MVP ?** Le user a tranché : *« à la rigueur la liste d'ami pour le MVP ok »*. À reconfirmer après une analyse coût/valeur (effort backend : table `Friendship` + endpoints CRUD + extension de la mécanique de renfort).
- **Visibilité publique** : la liste d'amis défensifs d'un joueur est-elle révélée par scout (cf. [`11-scouting.md`](./11-scouting.md)) ? Plutôt **oui** — un attaquant doit pouvoir évaluer le risque qu'un voisin envoie des renforts.
- **Effet pendant la fenêtre de capture PvP** : un ami défensif peut-il envoyer des renforts pendant la **fenêtre de capture** d'un village conquis par son ami ? Cohérent avec [`14-pvp-conquest.md` § Acteurs autorisés à attaquer pendant la fenêtre](./14-pvp-conquest.md#acteurs-autorisés-à-attaquer-pendant-la-fenêtre) qui exclut explicitement les *« alliés du défenseur »* au MVP — donc la liste d'amis ne devrait **pas** débloquer ce cas. À confirmer pour éviter d'inverser cette décision par accident.

## Liens

- [`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md) — système complet d'alliances, **post-MVP**.
- [`04-combat.md` § Renforts entre ses propres villages](./04-combat.md#renforts-entre-ses-propres-villages) — mécanique de base à étendre au cross-joueur.
- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — PvP de conquête, qui exclut aujourd'hui toute aide d'un tiers pendant la fenêtre de capture.
- [`11-scouting.md`](./11-scouting.md) — scout (consommateur potentiel : révéler la liste d'amis d'un joueur cible).
