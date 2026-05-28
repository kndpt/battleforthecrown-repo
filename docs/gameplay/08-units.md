# Unités

Catalogue des troupes du jeu : stats, coûts, archétypes. Le combat lui-même (résolution, puissance, conquête) est dans [`04-combat.md`](./04-combat.md).

## Catalogue

Chaque unité a un **coût**, un **temps d'entraînement** et des **stats de combat**. Les unités se débloquent progressivement via le niveau de la **Caserne**.

| Unité | Rôle | Bois | Pierre | Fer | Pop | Temps | Caserne | Attaque | Déf. inf. | Déf. cav. | Déf. arch. | Capacité | Mobilité | Poids |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 🗡️ **MILICE** | Infanterie de base | 50 | 30 | 10 | 1 | 10 s | 1 | 5 | 5 | 5 | 5 | 25 | 10 | 2 |
| 🛡️ **ÉCUYER** | Infanterie avancée | 80 | 50 | 30 | 1 | 15 s | 2 | 10 | 10 | 10 | 10 | 50 | 15 | 8 |
| ⚔️ **GUERRIER** | Infanterie offensive | 120 | 80 | 50 | 2 | 45 s | 3 | 20 | 5 | 5 | 5 | 35 | 20 | 12 |
| ✝️ **TEMPLIER** | Chevalier lourd | 80 | 150 | 120 | 2 | 45 s | 4 | 5 | 15 | 15 | 15 | 40 | 10 | 12 |
| 🏹 **ARCHER** | Tir à distance | 60 | 40 | 30 | 1 | 25 s | 3 | 12 | 6 | 20 | 6 | 20 | 12 | 6 |
| 🐴 **CAVALIER** | Cavalerie | 200 | 100 | 150 | 3 | 60 s | 5 | 15 | 8 | 8 | 8 | 100 | 35 | 15 |
| 🕵️ **ESPION** | Reconnaissance | 50 | 50 | 20 | 1 | 25 s | 3 | 8 | 2 | 2 | 2 | 0 | 100 | 10 |
| 🪨 **BÉLIER** | Siège | 300 | 400 | 200 | 4 | 90 s | 7 | 50 | 10 | 10 | 10 | 0 | 5 | 30 |
| 🎯 **CATAPULTE** | Siège | 400 | 600 | 300 | 5 | 120 s | 8 | 80 | 5 | 5 | 5 | 0 | 3 | 40 |
| 👑 **SEIGNEUR** | Conquête (unique) | 5 000 | 5 000 | 5 000 | 15 | 2 h | — ⚠️ | 500 | 500 | 500 | 500 | 0 | 5 | 100 |

### Légende

- **Bois / Pierre / Fer** : coût en ressources par unité.
- **Pop** : consommation de population à l'entraînement (libérée à la mort).
- **Temps** : temps d'entraînement de base (multiplié par le bonus Caserne, cf. [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks)).
- **Caserne** : niveau minimum requis. ⚠️ **Exception SEIGNEUR** : recruté à la **Salle du Trône** (Château 6), pas à la Caserne. Détail dans [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles).
- **Mobilité** : vitesse de déplacement sur la carte. **Échelle directe** : la valeur représente la vitesse — 100 (ESPION) = très rapide, 3 (CATAPULTE) = très lent. Le temps de trajet d'une armée est calé sur l'unité **la moins rapide** du groupe (la plus petite valeur de mobilité parmi les unités envoyées). Formule : `minutes = distance × REFERENCE_SPEED / (mobilité_min × travelMultiplier × armySpeedBonus)`. `REFERENCE_SPEED = 6` : à mobilité 6, une armée parcourt 1 tuile par minute ; à mobilité 100 (ESPION), elle parcourt 1 tuile en environ 3,6 s. Source de vérité : `packages/shared/src/logic/travel-time.ts`.
- **Attaque** : valeur brute utilisée côté offensif dans les calculs de combat.
- **Déf. inf. / cav. / arch.** : défense consommée selon l'archétype de l'attaquant. Infanterie, siège, scout et conquête consomment `defenseInfantry`; cavalerie consomme `defenseCavalry`; archers consomment `defenseArcher`.
- **Capacité** : transport de loot par unité.
- **Poids** : utilisé pour calculer la puissance du village (cf. [`09-power-and-rankings.md` § Système de puissance](./09-power-and-rankings.md#système-de-puissance)).

> ⚠️ Au MVP, certaines unités sont désactivées via `requiredBarracksLevel: 99` dans la config (Bélier, Catapulte). Le Seigneur a son propre flag de déblocage lié à la Salle du Trône — cf. [`10-conquest.md`](./10-conquest.md). Voir le code shared `@battleforthecrown/shared/army` pour les valeurs effectives.

## Archétypes et contre-relations

Le système est volontairement simple — pas un vrai pierre-feuille-ciseaux strict, mais des **spécialités** qui rendent la composition d'armée significative.

| Archétype | Unités | Force | Faiblesse |
| --- | --- | --- | --- |
| **Infanterie polyvalente** | MILICE, ÉCUYER | Disponibles tôt, équilibrées | Aucune spécialité forte |
| **Damage offensif** | GUERRIER, ARCHER | Attaque élevée pour le coût | Défense faible — fragiles en garnison |
| **Tank défensif** | TEMPLIER | Défense élevée stable | Lent, peu d'attaque |
| **Raider** | CAVALIER | Mobilité + capacité de loot | Coût élevé, faiblesse de masse |
| **Scout** | ESPION | Information avant combat | Aucune utilité au combat direct |
| **Siège** | BÉLIER, CATAPULTE | Anti-fortification, anti-masse | Très lents, sans capacité de loot |
| **Conquête** | SEIGNEUR | Permet la prise de village | Unité unique, sacrificielle |

**Boucles de contre lisibles** :

- **ARCHER défensif anti-cavalerie** : `defenseCavalry` élevée, utile contre les raids rapides.
- **TEMPLIER tank** : défense stable contre tous les archétypes, mais attaque faible.
- **GUERRIER / CAVALIER offensifs** : attaque, mobilité ou capacité élevées, mais défense plus basse.
- **ESPION** : garde sa fonction de reconnaissance via la mission `SPY` dédiée (cf. [`11-scouting.md`](./11-scouting.md)), pas via un bonus de combat.

L'objectif est de garder un seul levier de matchup lisible : les trois colonnes défensives, consommées par le résolveur selon la composition attaquante.

## Mécanique d'entraînement

- **File d'attente** : une seule formation à la fois (file parallèle prévue post-MVP).
- **Consommation de population** : les unités en formation occupent de la population.
- **Annulation** : remboursement complet ressources + population.
- **Déblocage progressif** : plus la Caserne monte, plus d'unités deviennent disponibles.

Détail des paliers de déblocage : [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks).

## Stratégies d'utilisation par style de village

| Style | Unités prioritaires | Raison |
| --- | --- | --- |
| 🛡️ **Forteresse** | ÉCUYER, TEMPLIER, ARCHER | Défense élevée, survivabilité, anti-cavalerie |
| ⚔️ **Raiders** | MILICE, CAVALIER | Attaque rapide, mobilité, capacité de loot |
| ⚙️ **Économique** | MILICE, ARCHER | Coût bas, défense légère, prod ressources |
| ⚖️ **Équilibré** | Mélange adapté à la menace | Flexibilité tactique |

Les **styles stratégiques de village** (bonus/malus, mécanique de choix, déblocage Salle du Conseil) sont définis dans [`12-village-styles.md`](./12-village-styles.md).

## Liens connexes

- [`04-combat.md`](./04-combat.md) — résolution combat, conquête, styles stratégiques de village.
- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — système de puissance (poids unités, calcul, visibilité) et classements.
- [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks) — déblocages d'unités et vitesse d'entraînement.
- [`02-economy-and-progression.md` § Population](./02-economy-and-progression.md#population) — limiteur stratégique armée vs infrastructure.
- [`06-barbarians.md`](./06-barbarians.md) — armée des villages barbares (consommateur du blueprint d'unités).
