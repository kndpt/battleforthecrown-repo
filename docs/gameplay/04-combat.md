# Combat

Mécanique de résolution des combats, conquête, styles stratégiques de village. Le **catalogue des unités** (stats, coûts, passifs) vit dans [`08-units.md`](./08-units.md). Le **système de puissance** (calcul, poids, visibilité) est consolidé dans [`09-power-and-rankings.md`](./09-power-and-rankings.md).

## Mécanique générale

- **Combat automatique**, basé sur stats brutes (attaque vs défense) + bonus de stratégie de village.
- L'armée envoyée parcourt la distance euclidienne à la mobilité de l'unité **la plus lente** du groupe (`findSlowestUnitSpeed`).
- À l'arrivée, résolution instantanée : pertes calculées des deux côtés, butin (loot) déterminé selon la victoire.
- L'armée survivante revient avec le loot, à la même vitesse qu'à l'aller.
- **Pas d'interception en voyage** : aucune attaque ne peut être interceptée en chemin. Les combats sont résolus exclusivement à l'arrivée. Règle globale, sans exception — s'applique aux raids, conquêtes (Seigneur compris), scouts, et trajets retour.
- **Rappel pendant l'aller** : le joueur peut rappeler son armée à tout moment **avant l'arrivée**. Le demi-tour se fait à la position actuelle : le temps de retour est égal au temps déjà parcouru depuis le départ. Aucune perte, aucun loot (pas de combat). S'applique à tous les trajets sortants : raids, conquêtes (Seigneur compris), scouts. Pas de rappel sur le retour — l'armée est déjà en chemin vers le village d'origine.

Détail technique côté backend dans [`docs/architecture/backend-modules.md` § Combat](../architecture/backend-modules.md#combat-le-plus-dense).

## Pertes et raids

- **Raid victorieux** : pertes selon le ratio puissance attaque vs défense, butin proportionnel à la capacité de transport restante.
- **Raid perdu** : armée détruite, retour à vide. Cible peut perdre quelques ressources stockées.
- **Défense** : armée stationnée applique sa puissance défensive + bonus stratégie + Wall (post-MVP).

Cas particulier des villages barbares (rapport de combat asymétrique selon victoire/défaite) : [`06-barbarians.md` § Rapport de combat](./06-barbarians.md#rapport-de-combat).

## Renforts entre ses propres villages

Un joueur peut envoyer des troupes d'un de ses villages **A** vers un autre village qu'il possède **B** pour le renforcer (defense ou consolidation tactique). Modèle Tribal Wars / Kingsage, **trajet combat-like** :

| Élément | Règle |
| --- | --- |
| **Action** | « Renforcer » (distincte d'« Attaquer ») depuis l'écran d'envoi d'armée. La cible doit être un village possédé par le joueur. |
| **Durée** | Distance euclidienne × vitesse de l'unité la plus lente — **identique à un raid** (`findSlowestUnitSpeed`). |
| **Combat en chemin** | ❌ Aucun (cohérent avec § Mécanique générale, *« pas d'interception en voyage »*). |
| **Rappel pendant l'aller** | ✅ Possible, identique au raid (demi-tour à la position actuelle, retour = temps déjà parcouru, sans perte). |
| **À l'arrivée** | Les troupes sont **stationnées** dans B. Elles apparaissent dans la défense de B au prochain combat subi. Pas de cooldown, pas de combat à l'arrivée. |
| **Population** | Reste consommée par le **village d'origine A** (la pop appartient au village qui a recruté les unités, pas au village qui les héberge). |
| **Pertes en défense** | Si B est attaqué et que les renforts de A meurent, la pop de A est libérée (cf. [`02-economy-and-progression.md` § Population](./02-economy-and-progression.md#population)). |
| **Bonus de style** | Le bonus de style **suit la troupe** (cf. [`12-village-styles.md` § À qui s'appliquent les bonus/malus](./12-village-styles.md#à-qui-sappliquent-les-bonusmalus)) — un Cavalier d'un village Raiders garde son bonus offensif/vitesse même stationné dans une capitale Forteresse. |
| **Retrait (B → A)** | Depuis la **Garnison**, action dédiée : `Rappeler` pour des renforts envoyés ailleurs, `Renvoyer` pour des renforts stationnés chez soi. Les deux déclenchent un trajet retour vers le village d'origine, avec les mêmes règles de durée et sans combat en chemin. |

**Exception conquête** : pendant la **fenêtre de capture d'un village conquis** par l'attaquant, aucun renfort ni retrait n'est possible vers la garnison d'occupation. Cf. [`14-pvp-conquest.md` § Garnison d'occupation](./14-pvp-conquest.md#garnison-doccupation--ce-qui-reste-de-lescorte). Pour les renforts du **défenseur** vers son propre village pendant la fenêtre PvP, c'est autorisé et géré au § *Qui peut intervenir pendant la fenêtre PvP* (`14-pvp-conquest.md`).

La **Garnison** expose deux vues complémentaires :
- **Stationnées ici** : renforts hébergés dans le village courant, qui participent à sa défense et peuvent être `Renvoyés` vers leur village d'origine.
- **En soutien ailleurs** : troupes du village courant stationnées dans un autre village du même joueur, pouvant être `Rappelées`.

Sur la carte et dans les listes d'expéditions, un renfort est rendu comme un flux **distinct d'une attaque** (`REINFORCE`) pour éviter toute ambiguïté sur son intention.

> ✅ **Statut implémentation** : UI frontend + endpoint de garnison + cycle d'events backend alignés.

## Conquête

1. Le joueur **recrute un Seigneur** à la **Salle du Trône** (Château 6 requis, 1 par village). Coût et règles complètes : [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles).
2. Il attaque un village ennemi avec son Seigneur dans l'armée.
3. Si toutes les troupes ennemies sont vaincues **et le Seigneur survit** :
   - Le Seigneur s'installe pendant une **période de capture variable** (selon le tier barbare ou le niveau de Château cible — cf. [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) et [`14-pvp-conquest.md`](./14-pvp-conquest.md)).
   - Si non-attaqué durant ce temps → conquête réussie, le village change de propriétaire.
   - Si le Seigneur fait partie des pertes (armée gagne mais Seigneur mort) → conquête échouée, raid victorieux normal (loot ramené, escorte rentre, coût Seigneur perdu sec). Détail : [`10-conquest.md` § Cas particulier](./10-conquest.md#cas-particulier--armée-gagne-le-combat-de-pré-conquête-mais-le-seigneur-meurt).
4. Le Seigneur **devient le Seigneur du village conquis** — il n'est plus disponible pour une autre conquête. Le village d'origine peut en recruter un nouveau.

## Styles stratégiques de village

Spec dédiée : [`12-village-styles.md`](./12-village-styles.md). Mécanique de spécialisation **par village** (4 styles, débloqué par la Salle du Conseil au Château 4). Le style applique des bonus/malus aux calculs combat (défense, vitesse, attaque). Caché publiquement, révélé par scout ESPION.

## Liens connexes

- [`08-units.md`](./08-units.md) — catalogue des unités, entraînement, stratégies d'utilisation.
- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — système de puissance (calcul, poids, visibilité) et classements.
- [`02-economy-and-progression.md` § Population](./02-economy-and-progression.md#population) — limiteur stratégique armée vs infrastructure.
- [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks) — déblocages d'unités et vitesse d'entraînement.
- [`01-overview.md` § Boucles](./01-overview.md#boucles-de-gameplay) — boucle militaire et conquête au niveau macro.
- [`06-barbarians.md`](./06-barbarians.md) — combat appliqué aux villages barbares (rapport asymétrique, scout).
- Architecture combat backend : [`docs/architecture/backend-modules.md`](../architecture/backend-modules.md).
