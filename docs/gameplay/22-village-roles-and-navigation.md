# Rôles de villages & navigation

> ✅ **MVP léger.** Cette spec ajoute une couche de navigation multi-village, pas une nouvelle mécanique de puissance.

## Objectif

Quand un joueur possède plusieurs villages, il doit comprendre vite à quoi sert chacun. La profondeur doit venir des décisions stratégiques, pas de la friction de navigation mobile.

Le MVP ajoute donc des **rôles privés** et des **favoris** pour organiser son royaume.

## Scope MVP

| Élément | Règle |
| --- | --- |
| Visibilité | Privée au joueur propriétaire |
| Effet gameplay | Aucun bonus, aucun multiplicateur, aucune règle serveur de combat |
| Modification | Libre, sans coût, sans cooldown |
| Usage principal | Navigation, filtres, lecture du royaume |
| Support initial | Villages possédés par le joueur uniquement |

## Rôles proposés

Liste fixe MVP :

- `Favori`
- `Capitale`
- `Raid`
- `Défense`
- `Économie`
- `Frontière`
- `Conquête`

Interprétation :

| Rôle | Intention UI |
| --- | --- |
| `Favori` | Accès rapide aux villages importants |
| `Capitale` | Centre symbolique du royaume, sans bonus mécanique MVP |
| `Raid` | Village utilisé pour attaques barbares ou raids |
| `Défense` | Village à surveiller / renforcer |
| `Économie` | Village orienté production |
| `Frontière` | Village exposé ou avancé |
| `Conquête` | Village préparant un Seigneur ou une expansion |

## Garde-fous

- Un rôle n'est pas un **style stratégique** : les bonus de combat restent dans [`12-village-styles.md`](./12-village-styles.md).
- `Capitale` est symbolique au MVP : pas de bonus défensif, pas de protection spéciale, pas de logistique liée.
- Pas de tags libres au MVP, pour éviter bruit UI et modération inutile.
- Pas de partage tribu ou public.
- Pas de presets automatiques de recrutement, construction ou attaque.

## UX attendue

Le rôle doit servir à aller plus vite :

- filtre dans la liste des villages ;
- icône ou badge discret dans le sélecteur de village ;
- favori accessible en premier ;
- affichage compact sur mobile.

Le rôle ne doit pas devenir un écran de configuration lourd. Si le joueur ignore totalement la feature, le jeu reste jouable.

## Évolutions post-MVP

À étudier seulement après observation du multi-village :

- tags personnalisés ;
- plusieurs rôles simultanés par village ;
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
