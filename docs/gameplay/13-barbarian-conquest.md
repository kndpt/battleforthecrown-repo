# Conquête de villages barbares

Spec complète de la conquête de villages **barbares** par le joueur. Les règles communes à toute conquête (recrutement et coût du [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles), période de capture variable) sont dans [`10-conquest.md`](./10-conquest.md). La conquête PvP est dans [`14-pvp-conquest.md`](./14-pvp-conquest.md).

## Principe directeur

- La **conquête barbare = boucle accessible**. Le joueur peut la viser dès qu'il a un Seigneur.
- Le **vrai cadeau** est le village lui-même (un emplacement supplémentaire), pas son contenu. Les bâtiments matérialisés restent **modestes**.
- Cohérence narrative : les barbares sont **primitifs**. Pas d'organisation politique, pas de bâtiments avancés.
- La conquête ne doit **pas remplacer** la progression organique du joueur : un T5 conquis ≠ un village max niveau gratuitement.

## Bâtiments matérialisés

À la conquête, le village barbare devient un village joueur. Les bâtiments matérialisés sont **uniquement ceux qui ont du sens narrativement** pour un campement primitif :

| Bâtiment | Matérialisé ? | Justification narrative |
| --- | :---: | --- |
| Château | ✅ | Chef du campement, structure de pouvoir basique |
| Camp de bûcherons | ✅ | Extraction primitive du bois |
| Carrière | ✅ | Extraction primitive de la pierre |
| Mine de fer | ✅ | Extraction primitive du fer |
| Entrepôt | ✅ | Réserves communautaires |
| Moulin | ✅ | Subsistance |
| Caserne | ✅ | Camp de guerriers |
| Tour de guet | ❌ | Organisation militaire avancée — joueur la construit |
| Salle du Conseil | ❌ | Politique structurée — joueur la construit pour spécialiser |
| Salle du Trône | ❌ | Pouvoir royal — joueur doit la construire pour spécialiser ce village en hub de conquête (évite un effet boule-de-neige où un village fraîchement conquis pourrait immédiatement recruter un nouveau Seigneur) |

## Niveaux à la conquête

Niveau modeste, aligné sur l'identité primitive des barbares. Tous les bâtiments matérialisés sont initialisés au **même niveau**, dérivé du tier conquis :

| Tier conquis | Niveau de tous les bâtiments matérialisés |
| ---: | ---: |
| T1 | 1 |
| T2 | 1 |
| T3 | 2 |
| T4 | 3 |
| T5 | 4 |

> 💡 Ce mapping est **identique** à celui utilisé pour le cap stockage barbare (cf. [`06-barbarians.md` § Cap stockage par tier](./06-barbarians.md#cap-stockage-par-tier)). Cohérence : un barbare reste primitif tant qu'il l'est, et conserve ses bâtiments à ce niveau quand il bascule en village joueur.

## Conséquences concrètes

**T5 conquis** :
- Château 4 → débloque la Salle du Conseil (pas matérialisée — joueur peut la construire ensuite).
- Mines / Entrepôt / Farm / Caserne au niveau 4.
- Pop max dérivée du Moulin niveau 4 ; pop occupée = somme des coûts de pop des bâtiments matérialisés à leur niveau hérité ; le reste est disponible pour recruter. Calcul standard, sans bonus ni malus.

**T1 conquis** :
- Tout en niveau 1. Quasi-vide. Le village est le cadeau, le contenu est minime.

### Vision propre = 0 (tous tiers barbares)

La **Tour de guet n'est jamais matérialisée** à la conquête, quel que soit le tier (cf. tableau § Bâtiments matérialisés). Conséquence pour **tous les tiers** :

- Vision propre du village fraîchement conquis = **0 case**.
- Si le village conquis sort du rayon des Watchtowers existantes du joueur (ex : conquête éloignée de la capitale), il devient une **tâche aveugle** sur la carte.
- Pour récupérer la vision, le joueur doit **construire une Tour de guet de niveau 1** (~15 min). Aucun rayon par défaut, aucune Watchtower offerte — règle stricte assumée, alignée sur la mécanique générale (vision = union des disques Watchtower, cf. [`01-overview.md` § Brouillard de guerre](./01-overview.md#exploration--brouillard-de-guerre)).

🎯 **Lecture design** : la conquête est un **emplacement + un socle**, pas un cadeau-vision. Le joueur arbitre entre développement éco (mines, farm) et infrastructure militaire (Watchtower) sur la nouvelle base.

🎯 **Lecture design** : le joueur reçoit un **emplacement + un socle**. Il doit investir pour faire monter le village. Pas broken, pas frustrant — boucle "conquête → développement" claire.

> 💡 **Petit ou grand barbare = un village en plus**. Un T1 conquis vaut son Seigneur autant qu'un T5, parce que **c'est l'emplacement qui se rentabilise**, pas le socle hérité. Et comme les barbares **se raréfient progressivement** (consommation joueur > recyclage, cf. [`06-barbarians.md` § Génération](./06-barbarians.md)), chaque barbare disponible devient une cible de plus en plus précieuse. Le ratio coût-Seigneur / contenu-hérité est trompeur : ce n'est pas le bon arbitrage.

## Stock ressources et population

| Élément | Valeur à la conquête |
| --- | --- |
| **Ressources** | **Reset complet** (0 bois / 0 pierre / 0 fer). Le joueur a déjà eu le loot du combat précédent ; pas de double récompense. |
| **Population** | Dérivée mécaniquement du Moulin matérialisé. Identique au calcul pour un village joueur. |
| **Armée résidente** | 0 — toutes les troupes barbares ont été vaincues lors du combat de pré-conquête. |

## Période de capture variable par tier

Le Seigneur s'installe pendant une fenêtre **dépendante du tier conquis**. Conquête réussie si non-attaqué durant cette fenêtre.

| Tier conquis | Période de capture |
| ---: | ---: |
| T1 | 30 min |
| T2 | 1 h |
| T3 | 1 h 30 |
| T4 | 2 h 15 |
| T5 | 3 h |

🎯 **Lecture design** : trois objectifs poursuivis par cette courbe.

1. **Faire payer la valeur du village** : conquérir un T5 = vrai investissement, conquérir un T1 = découverte rapide.
2. **Créer une vraie fenêtre PvP** : un Seigneur immobilisé 3 h près d'une zone disputée devient une cible. Sous 1 h 30 la fenêtre est trop courte pour qu'un voisin réagisse (rallye d'attaque).
3. **Cohérence narrative** : un campement primitif (T1) se rallie en quelques heures ; une garnison (T5) demande de vraies négociations.

**Calage avec les temps existants** : T5 = 3 h ≈ Château lvl 9 compressé (3 h 10). Cap volontaire à 3 h pour rester mobile-friendly (« une grosse session + retour plus tard »), au-delà le Seigneur immobilisé devient trop punitif dans le Standard MVP compressé.

**Conséquences pratiques** :
- Le Seigneur reste **immobilisé** toute la fenêtre, pas dispo ailleurs — vraie contrainte tactique qui s'aggrave avec le tier.
- Aucun allié naturel barbare ne défendra → la fenêtre reste une **formalité contre les barbares**, mais la durée crée une **opportunité PvP** (un voisin opportuniste peut intervenir).

## Visibilité de la durée

La durée de la fenêtre de capture est **pré-affichée** sur le panneau d'info au clic sur un village barbare, en regard du tier. Le joueur sait à l'avance combien de temps il va devoir tenir s'il lance la conquête.

🎯 **Lecture design** : la planification d'une conquête est une décision stratégique majeure (cf. [`10-conquest.md`](./10-conquest.md) § Le Seigneur). Cacher la durée forcerait le joueur à apprendre par essai-erreur ou à consulter une doc externe — friction inutile sur une décision déjà coûteuse. **Cohérent avec le cas PvP** ([`14-pvp-conquest.md` § Visibilité de la durée](./14-pvp-conquest.md#période-de-capture-variable-selon-le-niveau-du-château)) : pas d'asymétrie barbare/PvP entre joueurs.

## Coût Seigneur

Identique au cas commun, **sans réduction barbare** : voir [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles).

🎯 **Lecture design** : le coût Seigneur est l'**effort principal** d'une conquête. C'est ce qui en fait une décision, pas un acquis. La cible (joueur ou barbare) ne change pas le poids de cet investissement.

## Interaction avec l'algo de spawn

Un village barbare conquis sort du **pool barbare** local. La densité barbare dans la zone diminue → c'est une **récompense implicite** (moins de cibles de farm, moins de menaces potentielles).

L'algo défini dans [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) doit en tenir compte : la conquête ne déclenche **pas** automatiquement un re-spawn ailleurs. Le rééquilibrage se fait via le mécanisme normal (arrivée de nouveaux joueurs).

## Liens

- [`10-conquest.md`](./10-conquest.md) — règles communes à toute conquête (Seigneur, coût, période de capture variable).
- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — conquête de villages joueurs (à définir).
- [`04-combat.md` § Conquête](./04-combat.md#conquête) — mécanisme général.
- [`06-barbarians.md`](./06-barbarians.md) — vision design des villages barbares (cap stockage aligné sur la matérialisation).
- [`02-economy-and-progression.md` § Conquête et reset](./02-economy-and-progression.md#conquête-et-reset) — règle existante de reset à la conquête.
- [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — interaction avec l'algo de spawn.
- [`08-units.md`](./08-units.md) — Seigneur (unité de conquête).
- [`12-village-styles.md`](./12-village-styles.md) — un village conquis démarre en Équilibré ; le joueur peut spécialiser après avoir construit la Salle du Conseil.
