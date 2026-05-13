# Rôles de villages & navigation

> ✅ **MVP léger.** Cette spec ajoute une couche de navigation multi-village, pas une nouvelle mécanique de puissance.

## Objectif

Quand un joueur possède plusieurs villages, il doit comprendre vite à quoi sert chacun. La profondeur doit venir des décisions stratégiques, pas de la friction de navigation mobile.

Le MVP ajoute donc des **étiquettes privées** pour organiser son royaume.

## Scope MVP

| Élément | Règle |
| --- | --- |
| Visibilité | Privée au joueur propriétaire |
| Effet gameplay | Aucun bonus, aucun multiplicateur, aucune règle serveur de combat |
| Modification | Libre, sans coût, sans cooldown |
| Usage principal | Navigation, filtres, lecture du royaume |
| Support initial | Villages possédés par le joueur uniquement |

## Étiquettes proposées

Liste fixe MVP :

- `Offensif`
- `Défensif`
- `Économique`

Interprétation :

| Étiquette | Intention UI |
| --- | --- |
| `Offensif` | Village utilisé pour attaques, raids ou conquêtes |
| `Défensif` | Village à surveiller / renforcer |
| `Économique` | Village orienté production |

## Capitale

`Capitale` n'est pas une étiquette choisie par le joueur. C'est un état dérivé automatiquement :

- la capitale initiale est le tout premier village du joueur ;
- si cette capitale est prise, le premier village conquis restant devient la nouvelle capitale ;
- la capitale n'apporte aucun bonus mécanique MVP.

## Garde-fous

- Un rôle n'est pas un **style stratégique** : les bonus de combat restent dans [`12-village-styles.md`](./12-village-styles.md).
- La capitale est symbolique au MVP : pas de bonus défensif, pas de protection spéciale, pas de logistique liée.
- Pas de tags libres au MVP, pour éviter bruit UI et modération inutile.
- Pas de favoris au MVP.
- Pas de partage tribu ou public.
- Pas de presets automatiques de recrutement, construction ou attaque.

## UX attendue

Le rôle doit servir à aller plus vite :

- filtre par étiquette dans la liste des villages ;
- icône ou badge discret dans le sélecteur de village ;
- badge discret pour la capitale dérivée ;
- affichage compact sur mobile.

L'étiquette ne doit pas devenir un écran de configuration lourd. Si le joueur ignore totalement la feature, le jeu reste jouable.

## Règle pour les récompenses futures

Quand une récompense joueur doit s'appliquer à un village alors que le joueur en possède plusieurs, le joueur choisit le village destinataire au moment de valider la récompense.

Le système retient ensuite le dernier village ayant reçu une récompense et le propose par défaut à la validation suivante. La Phase 10 consomme cette règle sans la re-trancher.

## Évolutions post-MVP

À étudier seulement après observation du multi-village :

- tags personnalisés ;
- plusieurs étiquettes simultanées par village ;
- favoris ;
- dashboard royaume consolidé ;
- alertes par rôle (entrepôt plein, garnison faible, file inactive) ;
- presets d'actions ;
- interaction avec une capitale mécanique ;
- partage de rôles ou marqueurs avec une tribu.

## Liens

- [`00-game-flow.md`](./00-game-flow.md) — place de la navigation multi-village dans le flow.
- [`12-village-styles.md`](./12-village-styles.md) — styles stratégiques, mécanique distincte des rôles UI.
- [`20-defensive-friends.md`](./20-defensive-friends.md) — entraide défensive minimaliste.
- [`21-alliances-and-tribes.md`](./21-alliances-and-tribes.md) — partage social post-MVP.
