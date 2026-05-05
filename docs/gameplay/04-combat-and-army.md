# Armée et combat

## Catalogue des unités

Chaque unité a un **coût**, un **temps d'entraînement** et des **stats de combat**. Les unités se débloquent progressivement via le niveau de la **Caserne**.

| Unité | Rôle | Bois | Pierre | Fer | Pop | Temps | Caserne | Attaque | Défense | Capacité | Mobilité | Poids | Passif |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 🗡️ **MILICE** | Infanterie de base | 50 | 30 | 10 | 1 | 30 s | 1 | 5 | 5 | 25 | 10 | 2 | — |
| 🛡️ **ÉCUYER** | Infanterie avancée | 80 | 50 | 30 | 1 | 60 s | 2 | 10 | 10 | 50 | 15 | 8 | +10 % attaque vs archer |
| **GUERRIER** | Infanterie offensive | 120 | 80 | 50 | 2 | 180 s | 3 | 20 | 5 | 35 | 20 | 12 | _to define_ |
| ⚡ **TEMPLIER** | Chevalier lourd | 80 | 150 | 120 | 2 | 180 s | 4 | 5 | 15 | 40 | 10 | 12 | _to define_ |
| 🏹 **ARCHER** | Tir à distance | 60 | 40 | 30 | 1 | 90 s | 3 | 12 | 6 | 20 | 12 | 6 | _to define_ |
| 🐴 **CAVALIER** | Cavalerie | 200 | 100 | 150 | 3 | 240 s | 5 | 15 | 8 | 100 | 8 | 15 | Pilleur optimal |
| 🕵️ **SPY** | Espion | 50 | 50 | 20 | 1 | 90 s | 5 | 8 | 2 | 0 | 100 | 10 | _to define_ |
| **BÉLIER** | Siège | 300 | 400 | 200 | 4 | 360 s | 7 | 50 | 10 | 0 | 5 | 30 | Bonus vs défenses |
| 🎯 **CATAPULTE** | Siège | 400 | 600 | 300 | 5 | 480 s | 8 | 80 | 5 | 0 | 3 | 40 | Dégâts de zone |
| 👑 **SEIGNEUR** | Conquête (unique) | 1 000 | 800 | 500 | 5 | 600 s | 10 | 500 | 500 | 0 | 5 | 100 | Sacrifié à la conquête |

### Légende

- **Bois / Pierre / Fer** : coût en ressources par unité.
- **Pop** : consommation de population à l'entraînement (libérée à la mort).
- **Temps** : temps d'entraînement de base (multiplié par le bonus Caserne, cf. [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks)).
- **Caserne** : niveau minimum requis.
- **Mobilité** : vitesse de déplacement sur la carte (plus le chiffre est bas, plus c'est rapide).
- **Attaque / Défense** : valeurs brutes utilisées dans les calculs de combat.
- **Capacité** : transport de loot par unité.
- **Poids** : utilisé pour calculer la puissance du village.

> ⚠️ Au MVP, certaines unités sont désactivées via `requiredBarracksLevel: 99` dans la config (Bélier, Catapulte, Seigneur si non finalisés). Voir le code shared `@battleforthecrown/shared/army` pour les valeurs effectives.

## Mécanique d'entraînement

- **File d'attente** : une seule formation à la fois (file parallèle prévue post-MVP).
- **Consommation de population** : les unités en formation occupent de la population.
- **Annulation** : remboursement complet ressources + population.
- **Déblocage progressif** : plus la Caserne monte, plus d'unités deviennent disponibles.

## Stratégies d'utilisation

| Style | Unités prioritaires | Raison |
| --- | --- | --- |
| 🛡️ **Forteresse** | SQUIRE, TEMPLAR, ARCHER | Défense élevée, survivabilité |
| ⚔️ **Raiders** | MILITIA, CAVALRY | Attaque rapide, mobilité |
| ⚙️ **Économique** | MILITIA, ARCHER | Production ressources, défense légère |
| ⚖️ **Équilibré** | Mélange adapté à la menace | Flexibilité tactique |

## Système de puissance

La **puissance** représente la force globale d'un village ou d'un royaume. Sert aux classements et à l'évaluation stratégique.

### Calcul

**Puissance d'un village** = Puissance Bâtiments + Puissance Unités (armée).

```
Puissance Bâtiments = Σ (POIDS_BÂTIMENT × niveau)
Puissance Armée    = Σ (POIDS_UNITÉ × quantité)
```

**Puissance d'un royaume** = somme des puissances de tous les villages possédés.

### Visibilité

| Élément | Visibilité |
| --- | --- |
| **Puissance Village** (bâtiments) | Visible pour tous (information publique) |
| **Puissance Armée** | Cachée pour les ennemis (révélée par espion) |
| **Puissance Royaume** | Visible pour tous |

### Système de poids (équilibrage)

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
| Hideout | 28 | ×1.2 | Renseignement |
| Farm | 25 | ×1.0 | Population = stratégique |
| Entrepôt | 20 | ×1.0 | Support économique |
| Mines (Bois/Pierre/Fer) | 15 | ×1.0 | Production basique |

### Utilisation stratégique

- **Espionnage** : les espions révèlent la composition exacte des troupes ennemies (et donc la puissance réelle d'un village).
- **Évaluation** : permet d'estimer la difficulté d'une cible avant attaque.
- **Villages cachés** : un village peut avoir peu de bâtiments mais une armée massive (piège).

## Combat

### Mécanique générale

- **Combat automatique**, basé sur stats brutes (attaque vs défense) + bonus de stratégie de village.
- L'armée envoyée parcourt la distance euclidienne à la mobilité de l'unité **la plus lente** du groupe (`findSlowestUnitSpeed`).
- À l'arrivée, résolution instantanée : pertes calculées des deux côtés, butin (loot) déterminé selon la victoire.
- L'armée survivante revient avec le loot, à la même vitesse qu'à l'aller.

Détail technique côté backend dans [`docs/architecture/backend-modules.md` § Combat](../architecture/backend-modules.md#combat-le-plus-dense).

### Conquête

1. Le joueur **nomme un Seigneur** (coûte 3 000+ couronnes, niveau Caserne 10 requis).
2. Il attaque un village ennemi avec son Seigneur dans l'armée.
3. Si toutes les troupes ennemies sont vaincues **et le Seigneur survit** :
   - Le Seigneur s'installe pendant **6 h** (capture en cours).
   - Si non-attaqué durant ce temps → conquête réussie, le village change de propriétaire.
4. Le Seigneur est **sacrifié** à la conquête (unique par utilisation).

### Pertes et raids

- **Raid victorieux** : pertes selon le ratio puissance attaque vs défense, butin proportionnel à la capacité de transport restante.
- **Raid perdu** : armée détruite, retour à vide. Cible peut perdre quelques ressources stockées.
- **Défense** : armée stationnée applique sa puissance défensive + bonus stratégie + Wall (post-MVP).

## Styles stratégiques de village

> Chaque village peut adopter une **stratégie** depuis la **Salle du Conseil** (post-MVP).

| Style | Bonus | Malus | Recommandations |
| --- | --- | --- | --- |
| 🛡️ **Forteresse** | +25 % défense unité, +10 % stockage | −20 % vitesse déplacement unités | Murs, Archers, Tour de guet |
| ⚔️ **Raiders** | +15 % vitesse déplacement, +10 % loot | −10 % défense | Caserne, Cavaliers |
| ⚙️ **Économique** | +20 % production, +10 % pop max | −10 % attaque, −10 % défense | Fermes, Mines, Entrepôts |
| ⚖️ **Équilibré** | Aucun bonus / malus | — | Mélange intelligent |

### Mécanique

- Changement instantané → cooldown 24 h.
- Coût en couronnes (50–100 selon le style).
- Icône de stratégie visible sur la carte du monde.
- Effets appliqués aux calculs **backend** (production, combat, vitesse).

## Liens connexes

- Mécanique de population (limiteur stratégique armée vs infrastructure) : [`02-economy-and-progression.md` § Population](./02-economy-and-progression.md#population).
- Détail Caserne (déblocages + vitesse entraînement) : [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks).
- Boucles de gameplay militaire et conquête : [`01-overview.md` § Boucles](./01-overview.md#boucles-de-gameplay).
- Architecture combat backend : [`docs/architecture/backend-modules.md`](../architecture/backend-modules.md).
