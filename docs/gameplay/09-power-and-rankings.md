# Puissance

Métrique de force globale entre joueurs. La **puissance** mesure la force d'un village ou d'un royaume ; les **classements** périodiques sont spécifiés séparément dans [`24-rankings.md`](./24-rankings.md).

## Système de puissance

La **puissance** représente la force globale d'un village ou d'un royaume. Elle pilote :

- Le **revenu en couronnes** : `couronnes/h = puissance_bâtiments_cumulée × 0.05`, sommée sur tous les villages possédés. Détail et tableau de gains par phase : [`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes).
- L'**évaluation stratégique** : estimer la difficulté d'une cible avant attaque (cf. [`04-combat.md`](./04-combat.md)).
- Le **classement public de Puissance du Royaume** (cf. [`24-rankings.md`](./24-rankings.md#puissance-du-royaume)).

### Calcul

**Puissance d'un village** = Puissance Bâtiments + Puissance Unités (armée).

```
Puissance Bâtiments = Σ (POIDS_BÂTIMENT × niveau)
Puissance Armée    = Σ (POIDS_UNITÉ × quantité)
```

La **Puissance Armée** est rattachée au **village d'origine des troupes**, pas à leur position physique :

- les unités dans l'inventaire local comptent pour leur village ;
- les attaques, scouts, retours et rappels en trajet comptent encore pour le village d'origine ;
- les renforts stationnés chez un autre village comptent pour le village d'origine, pas pour le village hôte ;
- les pertes diminuent la puissance du village d'origine au moment où les unités meurent.

La **force présente locale** d'un village reste séparée : c'est la somme des troupes locales + renforts hébergés utilisée par combat/scout pour évaluer la défense effective à un instant T.

**Puissance d'un royaume** = somme des puissances de tous les villages possédés.

### Visibilité

| Élément | Visibilité |
| --- | --- |
| **Puissance Village** (bâtiments) | Visible pour tous (information publique) |
| **Puissance Armée** | Cachée pour les ennemis (révélée par espion) |
| **Puissance Royaume** | Visible pour tous |

### Système de poids des bâtiments

Le poids des bâtiments reflète leur coût cumulé et leur importance stratégique :

```
Poids = (Coût_cumulé_level_10 / 500) × Multiplicateur_stratégique
```

| Bâtiment | Poids/niveau | Multiplicateur | Logique |
| --- | ---: | ---: | --- |
| Château | 40 | ×1.5 | Cœur du village |
| Wall | 38 | ×1.3 | Défense massive (coûts élevés) |
| Caserne | 35 | ×1.2 | Militaire offensif |
| Tour de guet | 30 | ×1.3 | Vision stratégique |
| Hideout | 28 | ×1.2 | Renseignement (post-MVP) |
| Salle du Conseil | 25 | ×1.0 | Choix de [style stratégique](./12-village-styles.md) — bâtiment 1 niveau, poids unique |
| Quartier | 25 | ×1.0 | Population = stratégique |
| Entrepôt | 20 | ×1.0 | Support économique |
| Mines (Bois/Pierre/Fer) | 15 | ×1.0 | Production basique |

> 💡 Poids des unités : voir [`08-units.md`](./08-units.md).

### Utilisation stratégique

- **Espionnage** : les espions (Hideout) révèlent la composition exacte des troupes ennemies, et donc la puissance armée réelle d'un village cible.
- **Évaluation de cible** : la puissance bâtiments est publique, ce qui permet d'estimer la difficulté d'une attaque sans espion.
- **Villages cachés** : un village peut avoir peu de bâtiments mais une armée massive (piège) — d'où l'intérêt du scout avant un raid sérieux.

### Réactivité temps réel

La puissance affichée côté HUD se rafraîchit par invalidation REST après les events Outbox métier :

- `unit.trained` à chaque unité fabriquée rafraîchit la puissance village et royaume pendant un training en cours.
- `building.completed` rafraîchit la puissance village et royaume à la fin d'un upgrade.
- Les events combat qui mutent l'inventaire ou la propriété (`battle.resolved`, `battle.returned`, `village.attacked`, `village.conquered`) rafraîchissent aussi la puissance village et royaume sans F5.

## Articulation avec les classements

La puissance n'est pas une performance périodique : elle indique la taille et la force actuelle du royaume. Les classements de performance vivent dans [`24-rankings.md`](./24-rankings.md) et sont séparés en trois signaux :

- **Puissance du Royaume** : classement live, non reset, basé sur la puissance décrite ici.
- **Gloire d'Assaut** : points PvP gagnés en tuant des unités ennemies quand le joueur attaque.
- **Gloire du Rempart** : points PvP gagnés en tuant des unités ennemies quand le joueur défend.

Les classements de performance ne donnent pas de couronnes, ressources, bonus de production ou bonus offensifs par défaut. Les rewards sont cosmétiques afin d'éviter de transformer le leaderboard en accélérateur de snowball.

## Liens connexes

- [`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes) — la puissance bâtiments pilote le rendement en couronnes.
- [`03-buildings.md`](./03-buildings.md) — détail par bâtiment, dont le Château (poids le plus élevé).
- [`04-combat.md`](./04-combat.md) — combat et conquête (consommateur principal de l'évaluation stratégique).
- [`24-rankings.md`](./24-rankings.md) — classements Puissance du Royaume, Gloire d'Assaut et Gloire du Rempart.
- [`08-units.md`](./08-units.md) — catalogue des unités, dont les poids alimentent la puissance armée.
- Backend : [`docs/architecture/backend-modules.md` § power](../architecture/backend-modules.md) — endpoints `GET /power?villageId=…`, `GET /power/kingdom`, `GET /power/leaderboard` pour la puissance.
