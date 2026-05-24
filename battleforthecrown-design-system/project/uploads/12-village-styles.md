# Styles stratégiques de village

Mécanique de **spécialisation par village**. Chaque village du joueur peut adopter un **style** qui applique des bonus et malus à son fonctionnement (production, combat, stockage, mobilité). Le style est **caché** des autres joueurs : il fait partie de la stratégie privée du joueur.

## Cadre

| Élément | Valeur |
| --- | --- |
| Granularité | Par village — chaque village du joueur a son propre style |
| Nombre de styles | 4 (3 spécialisés + 1 neutre) |
| Style par défaut à la création | Équilibré (neutre, aucun bonus/malus) |
| Déblocage du choix | Construction de la **Salle du Conseil** (Château niveau 4 requis) |
| Visibilité externe | Caché — révélé uniquement par scout ESPION (cf. [`11-scouting.md`](./11-scouting.md)) |
| Cooldown changement | 24 h |
| Coût changement | Ressources thématiques + couronnes, **scalé sur le niveau du Château** (cf. § Coûts de changement) |
| Premier choix après construction | **Payant** (pas de gratuité — chaque changement compte dès le début) |

## Les 4 styles

| Style | Bonus | Malus |
| --- | --- | --- |
| 🛡️ **Forteresse** | +25 % défense unité, +10 % stockage | −20 % vitesse déplacement unités |
| ⚔️ **Raiders** | +15 % vitesse déplacement, +10 % loot | −10 % défense |
| ⚙️ **Économique** | +20 % production, +10 % pop max | −10 % attaque, −10 % défense |
| ⚖️ **Équilibré** | Aucun | Aucun |

🎯 **Intention** : forcer un **vrai compromis** sur les 3 styles spécialisés (chaque bonus a un malus). L'Équilibré reste l'option neutre par défaut, sans engagement.

> 💡 **Fenêtre Château 4-5 (avant conquête)** : la Salle du Conseil débloque la spécialisation à **Château 4**, alors que la conquête (Salle du Trône) demande **Château 6**. Pendant 1-2 paliers, le style choisi cible donc **les raids barbares**, pas la conquête. Pas un trou de design — c'est cohérent : un Raiders (+15 % vitesse, +10 % loot) se rentabilise immédiatement sur les raids, un Forteresse (+25 % défense) protège les ressources accumulées, un Économique accélère la course vers Château 6. La fenêtre 4-5 est un **mid-game à part entière**, pas une attente.

### À qui s'appliquent les bonus/malus

Les troupes **appartiennent à leur village d'origine** (= le village où elles ont été entraînées). Le style de ce village les suit en permanence :

- **En attaque** : une armée envoyée depuis un village Raiders bénéficie de +15 % vitesse de déplacement et +10 % loot, peu importe la cible.
- **En défense** : les troupes en garnison appliquent les bonus défensifs du village qui les a entraînées, peu importe le village où elles défendent.
- **Production / stockage / pop max** : ces bonus sont **locaux** (s'appliquent au village qui a le style, pas aux troupes qui le quittent).

🎯 **Conséquence** : le style « voyage » avec les troupes pour les bonus combat, mais reste local pour les bonus économiques. Cohérent avec l'idée qu'une unité Raiders est *formée* à raider — son entraînement la suit.

## Mécanique de cycle de vie

```
1. Création du village
   → style = Équilibré (par défaut, automatique)
2. Joueur atteint Château 4
   → peut construire la Salle du Conseil (1 niveau, coût unique)
3. Salle du Conseil construite
   → l'UI du village permet de choisir un style spécialisé
4. Tout changement de style (y compris le premier après construction)
   → coûte des ressources thématiques + couronnes (cf. § Coûts de changement)
   → cooldown 24 h avant prochain changement
```

**Pas de premier choix gratuit** : la construction de la Salle du Conseil est un investissement séparé. Chaque changement de style est ensuite payant — empêche que le joueur "réinitialise" gratuitement une stratégie en passant par Équilibré à chaque attaque/défense.

## Coûts de changement de style

Les coûts suivent une **logique narrative** par ressource dominante : un style militaire offensif demande surtout du fer (armes, armures), un style défensif du bois (palissades, structures de garnison), un style économique de la pierre (fondations civiles permanentes), et l'Équilibré est neutre.

### Coûts de base (Château 4)

| Style cible | Bois | Pierre | Fer | Couronnes | Logique |
| --- | ---: | ---: | ---: | ---: | --- |
| 🛡️ **Forteresse** | **200** | 100 | 50 | 80 | Palissades, structures défensives |
| ⚔️ **Raiders** | 50 | 100 | **200** | 80 | Armes et armures |
| ⚙️ **Économique** | 100 | **200** | 50 | 60 | Infrastructure civile |
| ⚖️ **Équilibré** | 100 | 100 | 100 | 80 | Neutre — pas une porte de sortie bon marché |

> 💡 **Équilibré = pas un raccourci**. Les couronnes (80) sont au même niveau que Forteresse / Raiders pour empêcher l'abus tactique : passer en Équilibré pour annuler ses malus pendant une attaque puis revenir à son style coûte aussi cher qu'un changement spécialisé.

### Scaling par niveau de Château

Pour éviter que le coût devienne trivial en late game (production ×5 à Château 10 vs Château 4), le coût de changement est **multiplié par `1.25^(N - 4)`** où `N` = niveau actuel du Château au moment du changement.

| Niveau Château | Multiplicateur | Exemple Forteresse (B/P/F) | Couronnes |
| ---: | ---: | --- | ---: |
| 4 | ×1.00 | 200 / 100 / 50 | 80 |
| 5 | ×1.25 | 250 / 125 / 63 | 100 |
| 6 | ×1.56 | 312 / 156 / 78 | 125 |
| 7 | ×1.95 | 390 / 195 / 98 | 156 |
| 8 | ×2.44 | 488 / 244 / 122 | 195 |
| 9 | ×3.05 | 610 / 305 / 153 | 244 |
| 10 | ×3.81 | 762 / 381 / 191 | 305 |

🎯 **Intention** : le coût grandit moins vite que la production passive du joueur (×3.8 vs ×5). Le late-game devient un peu plus permissif sur la flexibilité macro (cohérent avec multi-village), mais reste un investissement sérieux à chaque changement.

### Salle du Conseil — coût de construction

Bâtiment **simple à 1 niveau**, débloqué à Château 4. Coût fixe (pas de scaling), construction unique :

| Bois | Pierre | Fer | Pop | Temps |
| ---: | ---: | ---: | ---: | ---: |
| 150 | 200 | 100 | 4 | 1 000 s (~17 min) |

Détail dans [`03-buildings.md`](./03-buildings.md).


## Lisibilité externe — caché par scout

Le style d'un village **n'est pas affiché publiquement** sur la carte. Cela protège la stratégie macro du joueur (un voisin ne sait pas quel village est sa capitale Forteresse vs son outpost Raiders).

Pour révéler le style d'un village ennemi, le joueur doit envoyer un **scout ESPION** (cf. [`11-scouting.md`](./11-scouting.md)). Le rapport scout inclut :

- Composition d'armée
- Stock de ressources
- **Style** du village

🎯 **Intention** : ajouter une vraie valeur au scout. Sans scout, l'attaquant ne sait pas s'il va affronter un Forteresse (+25 % défense) ou un Économique (−10 % défense). Vrai impact tactique.

## Stratégies macro multi-village

La granularité par village permet des compositions stratégiques riches :

| Configuration | Logique |
| --- | --- |
| Capitale Forteresse + outposts Raiders | Cœur défensif intouchable, satellites mobiles pour piller |
| Plusieurs villages Économique loin du front + 1 Forteresse en frontière | Production à l'arrière, mur défensif en avant |
| Tout en Raiders | Joueur agressif, peu de stockage, prend ses ressources sur les voisins |
| Tout en Économique | Joueur passif/turtle — vulnérable mais riche |

🎯 **Intention** : la décision n'est jamais "quel style choisir ?" mais "**comment combiner** mes styles à travers mes villages ?". Profondeur émergente du multi-village.

## Cas particuliers

### Villages barbares

Les villages barbares **n'ont pas de style**. Leur composition d'armée est fixée par le blueprint barbare (cf. [`06-barbarians.md`](./06-barbarians.md)) et leur production est dérivée du tier — aucun bonus/malus de style ne s'applique.

### Cumul avec autres bonus

| Source | Cumul avec style ? |
| --- | --- |
| Cartes quotidiennes / récompenses temporaires (cf. [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md)) | Non-cumul si même catégorie |
| Oyez | Même règle : le meilleur bonus de même catégorie gagne |
| Bonus de bâtiments (Watchtower ; Wall post-MVP) | Cumul **OUI** — natures différentes |

> ⚠️ Le cumul exact entre styles, cartes et Oyez est à finaliser. Cible actuelle : non-cumul même catégorie.

## Questions ouvertes

- **Cumul styles ↔ cartes / Oyez** : règle à clarifier précisément. Cible actuelle : non-cumul même catégorie.
- **Styles post-MVP** : envisager Renseignement (+scout, +vision) et Conquérant (+vitesse Seigneur, +capture). La Salle du Trône est MVP en mono-niveau (recrutement seul) ; les bonus passifs liés (vitesse entraînement, vitesse de noblage) arriveront avec ses niveaux 2+ et pourront alimenter le style Conquérant.

## Liens connexes

- [`03-buildings.md` § Salle du Conseil](./03-buildings.md) — bâtiment de déblocage.
- [`04-combat.md`](./04-combat.md) — application des bonus/malus dans les calculs de combat.
- [`02-economy-and-progression.md`](./02-economy-and-progression.md) — application des bonus de production / pop.
- [`11-scouting.md`](./11-scouting.md) — scout ESPION qui révèle le style.
- [`06-barbarians.md`](./06-barbarians.md) — barbares (pas de style applicable).
- [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes et Oyez (interaction de cumul à clarifier).
