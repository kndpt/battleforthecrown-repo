# Unités

Catalogue des troupes du jeu : stats, coûts, passifs, archétypes. Le combat lui-même (résolution, puissance, conquête) est dans [`04-combat.md`](./04-combat.md).

## Catalogue

Chaque unité a un **coût**, un **temps d'entraînement** et des **stats de combat**. Les unités se débloquent progressivement via le niveau de la **Caserne**.

| Unité | Rôle | Bois | Pierre | Fer | Pop | Temps | Caserne | Attaque | Défense | Capacité | Mobilité | Poids | Passif |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 🗡️ **MILICE** | Infanterie de base | 50 | 30 | 10 | 1 | 30 s | 1 | 5 | 5 | 25 | 10 | 2 | — |
| 🛡️ **ÉCUYER** | Infanterie avancée | 80 | 50 | 30 | 1 | 60 s | 2 | 10 | 10 | 50 | 15 | 8 | +10 % attaque vs ARCHER |
| ⚔️ **GUERRIER** | Infanterie offensive | 120 | 80 | 50 | 2 | 180 s | 3 | 20 | 5 | 35 | 20 | 12 | +10 % attaque en raid offensif (sortie de son village) |
| ✝️ **TEMPLIER** | Chevalier lourd | 80 | 150 | 120 | 2 | 180 s | 4 | 5 | 15 | 40 | 10 | 12 | +15 % défense quand stationné en garnison |
| 🏹 **ARCHER** | Tir à distance | 60 | 40 | 30 | 1 | 90 s | 3 | 12 | 6 / 20 vs Cavalerie | 20 | 12 | 6 | +10 % attaque vs MILICE et GUERRIER (anti-infanterie sans armure) |
| 🐴 **CAVALIER** | Cavalerie | 200 | 100 | 150 | 3 | 240 s | 5 | 15 | 8 | 100 | 35 | 15 | Pilleur optimal — meilleure capacité/mobilité du jeu |
| 🕵️ **ESPION** | Reconnaissance | 50 | 50 | 20 | 1 | 90 s | 3 | 8 | 2 | 0 | 100 | 10 | Scoute la cible : révèle composition d'armée et stockage avant attaque (cf. [`11-scouting.md`](./11-scouting.md)) |
| 🪨 **BÉLIER** | Siège | 300 | 400 | 200 | 4 | 360 s | 7 | 50 | 10 | 0 | 5 | 30 | +50 % attaque vs Wall (anti-fortification) |
| 🎯 **CATAPULTE** | Siège | 400 | 600 | 300 | 5 | 480 s | 8 | 80 | 5 | 0 | 3 | 40 | Dégâts de zone : touche plusieurs unités défensives à la fois |
| 👑 **SEIGNEUR** | Conquête (unique) | 5 000 | 5 000 | 5 000 | 15 | 8 h | — ⚠️ | 500 | 500 | 0 | 5 | 100 | Recruté à la **Salle du Trône** (Château 6), pas à la Caserne. Coûte aussi des couronnes. Devient le Seigneur du village conquis — règles et coût complets : [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles) |

### Légende

- **Bois / Pierre / Fer** : coût en ressources par unité.
- **Pop** : consommation de population à l'entraînement (libérée à la mort).
- **Temps** : temps d'entraînement de base (multiplié par le bonus Caserne, cf. [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks)).
- **Caserne** : niveau minimum requis. ⚠️ **Exception SEIGNEUR** : recruté à la **Salle du Trône** (Château 6), pas à la Caserne. Détail dans [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles).
- **Mobilité** : vitesse de déplacement sur la carte. **Échelle directe** : la valeur représente la vitesse — 100 (ESPION) = quasi-instantané, 3 (CATAPULTE) = très lent. Le temps de trajet d'une armée est calé sur l'unité **la moins rapide** du groupe (la plus petite valeur de mobilité parmi les unités envoyées). Formule : `minutes = distance × 100 / (mobilité_min × travelMultiplier × armySpeedBonus)`. La constante `100` correspond à la mobilité de référence (l'ESPION) : à mobilité 100, une armée parcourt 1 tuile par minute. Source de vérité : `packages/shared/src/logic/travel-time.ts`.
- **Attaque / Défense** : valeurs brutes utilisées dans les calculs de combat.
- **Capacité** : transport de loot par unité.
- **Poids** : utilisé pour calculer la puissance du village (cf. [`09-power-and-rankings.md` § Système de puissance](./09-power-and-rankings.md#système-de-puissance)).

> ⚠️ Au MVP, certaines unités sont désactivées via `requiredBarracksLevel: 99` dans la config (Bélier, Catapulte). Le Seigneur a son propre flag de déblocage lié à la Salle du Trône — cf. [`10-conquest.md`](./10-conquest.md). Voir le code shared `@battleforthecrown/shared/army` pour les valeurs effectives.

## Archétypes et contre-relations

Le système est volontairement simple — pas un vrai pierre-feuille-ciseaux strict, mais des **spécialités** qui rendent la composition d'armée significative.

| Archétype | Unités | Force | Faiblesse |
| --- | --- | --- | --- |
| **Infanterie polyvalente** | MILICE, ÉCUYER | Disponibles tôt, équilibrées | Aucune spécialité forte |
| **Damage offensif** | GUERRIER, ARCHER | Attaque élevée pour le coût | Défense faible — fragiles en garnison |
| **Tank défensif** | TEMPLIER | Défense élevée + bonus garnison | Lent, peu d'attaque |
| **Raider** | CAVALIER | Mobilité + capacité de loot | Coût élevé, faiblesse de masse |
| **Scout** | ESPION | Information avant combat | Aucune utilité au combat direct |
| **Siège** | BÉLIER, CATAPULTE | Anti-fortification, anti-masse | Très lents, sans capacité de loot |
| **Conquête** | SEIGNEUR | Permet la prise de village | Unité unique, sacrificielle |

**Boucles de contre fortes** :

- **ÉCUYER → ARCHER** (anti-archer, +10 % attaque vs).
- **ARCHER → MILICE / GUERRIER** (anti-infanterie sans armure, +10 % attaque vs).
- **TEMPLIER → tout en garnison** (+15 % défense stationné).
- **GUERRIER → tout en raid** (+10 % attaque offensive).
- **BÉLIER → Wall** (+50 % attaque vs fortification, post-MVP Wall).

> 💡 Les passifs sont volontairement modérés (10-15 %). L'objectif est de récompenser une compo réfléchie sans rendre une unité strictement obligatoire.

## Mécanique d'entraînement

- **File d'attente** : une seule formation à la fois (file parallèle prévue post-MVP).
- **Consommation de population** : les unités en formation occupent de la population.
- **Annulation** : remboursement complet ressources + population.
- **Déblocage progressif** : plus la Caserne monte, plus d'unités deviennent disponibles.

Détail des paliers de déblocage : [`03-buildings.md` § Caserne](./03-buildings.md#caserne-barracks).

## Stratégies d'utilisation par style de village

| Style | Unités prioritaires | Raison |
| --- | --- | --- |
| 🛡️ **Forteresse** | ÉCUYER, TEMPLIER, ARCHER | Défense élevée, survivabilité, anti-archer |
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
