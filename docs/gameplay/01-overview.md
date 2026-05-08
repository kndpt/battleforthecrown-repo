# Overview — Vision et boucles

## Vision globale

> _« Un jeu de stratégie médiévale lisible mais profond : des choix clairs, des décisions lourdes de conséquences, et un monde vivant où chaque village a une identité. »_

### Objectif

Créer une expérience de **stratégie simplifiée mais tactique**, pensée pour mobile :

- Pas de micro-décisions ni d'arbres de talents.
- Des **boucles claires et gratifiantes** (production → expansion → défense).
- Une **stratégie macro visible** à travers des _styles de villages_ et des _zones d'influence_.
- Une **rétention douce** (raids barbares, événements, classements périodiques).

### Principes de design

- **Décisions** : choix significatifs avec impact long terme.
- **Feedback** : retours rapides et lisibles aux actions.
- **Rétention** : progression gratifiante + défis périodiques.

## Structure du jeu

Chaque joueur commence avec **un village**. Il peut ensuite **conquérir** d'autres villages (barbares ou joueurs).

| Type de village | Description |
| --- | --- |
| **Village joueur** | Entité appartenant à un joueur, attaquable, pillable, conquérable |
| **Village barbare** | PNJ neutres, attaquables, pillables, conquérables |

Les détails sur les ressources, la population et les couronnes sont dans [`02-economy-and-progression.md`](./02-economy-and-progression.md). Les bâtiments dans [`03-buildings.md`](./03-buildings.md). Les troupes et le combat dans [`04-combat-and-army.md`](./04-combat-and-army.md).

## Boucles de gameplay

### Boucle économique

1. Les bâtiments produisent passivement des ressources.
2. Le joueur les investit dans de nouvelles constructions ou des unités.
3. Les entrepôts limitent la production (nécessitent upgrades).
4. Le joueur équilibre population / production / défense.

🎯 **Objectif** : créer une progression visible et régulière, même en mode idle.

### Boucle militaire

1. Le joueur entraîne des unités dans la Caserne (vitesse dépend du niveau).
2. Il attaque des villages barbares pour piller ressources et expérience.
3. Plus tard, il attaque ou défend contre d'autres joueurs.
4. Les troupes vaincues ou en formation consomment de la population.

🎯 **Objectif** : combats simples à comprendre mais stratégiques. Combat automatique basé sur stats + bonus stratégie de village.

### Boucle de conquête

1. Le joueur nomme un **Seigneur**.
2. Il attaque un village ennemi.
3. Si toutes les troupes ennemies sont vaincues et le Seigneur survit :
   - le Seigneur s'installe pendant **6h** (capture en cours).
   - Si non-attaqué durant ce temps → conquête réussie.
4. Le village appartient maintenant au joueur.

🔹 Un Seigneur est **unique** et se sacrifie après conquête réussie.
🔹 Chaque village est **unique**, avec ses features. Le joueur peut donc se créer un réseau de villages.

### Boucle de rétention

1. **Raid barbare global** toutes les 3–5 jours.
2. **Événements temporaires ("Oyez")** : bonus production, entraînement, vision, etc.
3. **Classements hebdo/mensuels** : Offensive, Défensive, Économique, Architecte.
4. **Calendrier saisonnier léger** : récompenses cosmétique / ressource en fin de semaine.

Détail dans [`05-events-and-retention.md`](./05-events-and-retention.md).

## Exploration & brouillard de guerre

La carte du monde n'est pas révélée d'un coup. Le joueur **construit sa vision** via la **tour de guet** (voir [`03-buildings.md`](./03-buildings.md#tour-de-guet-watchtower)), et trois états cohabitent :

| État | Ce qui s'affiche | Quand |
| --- | --- | --- |
| **Visible** | Entité complète : type, owner, niveau, nom | Dans le rayon d'au moins une de mes tours de guet |
| **Blip** | Un point gris anonyme — "il y a quelque chose" | Hors rayon, **uniquement pour les villages** (joueurs + barbares) |
| **Hors monde** | Rien | Au-delà des bornes du monde |

### Règles

- **Rayon** = `WATCHTOWER_VISION_LEVELS[level].visibilityRadius`. Lvl 1 = 5 cases, +5 / niveau, **lvl 10 = monde entier**.
- **Vision = union** des disques de toutes mes tours de guet (un joueur avec 3 villages voit l'union de 3 cercles).
- **Pas de mémoire** : une entité qui sort de mon rayon redevient un blip. Pas de "déjà découvert".
- **Expéditions** : visibles **uniquement** dans la vision. Hors vision, rien — pas même un blip. C'est la simplification volontaire qui évite de transformer la carte en radar.
- **Blip non-cliquable** : impossible de sélectionner, attaquer ou tooltip un blip. Il faut le révéler en étendant sa vision.
- **Blip non-attaquable côté serveur** : un POST `/combat/attack` avec une cible hors vision est rejeté en 403, même si le client triche en réutilisant l'`id` du blip. La règle est server-authoritative, pas seulement UI.

### Pourquoi un blip plutôt que rien

Un brouillard noir total = carte vide = peu engageant. Le blip apporte la tension narrative — _« il y a quelque chose là, mais quoi ? »_ — sans révéler d'info exploitable. Il pousse le joueur à investir dans sa tour de guet pour dissiper ses zones d'ombre les plus suspectes.

### Côté technique

C'est une vraie règle de jeu **server-authoritative**, pas un effet visuel : le backend filtre les payloads avant de les envoyer. Détail dans [`../architecture/decisions.md`](../architecture/decisions.md) (ADR-11).

## Monde persistant et raids

### Raids barbares

- Se déclenchent globalement toutes les 3–5 jours.
- Difficulté adaptée au niveau du joueur.
- **Victoire** : gain de Couronnes + loot.
- **Défaite** : perte de quelques ressources / troupes et perte de niveau de bâtiment.
- Après plusieurs défaites consécutives (ex : 3), le village **passe en ruines** :
  - Niveau bâtiments −50 %.
  - Peut être reconquis gratuitement par le joueur en se reconnectant.
- **Protection post-perte** : si un joueur perd un village, bouclier 12 h sur les autres villages (évite le snowball nocturne).

> 🔹 Pas de destruction complète = pas de frustration irréversible.

### Monde persistant

- Les barbares peuvent **reprendre un village abandonné** (retour à la barbarie).
- Villages trop éloignés du centre → plus de barbares / plus de loot.
- Système de **zones d'influence** :
  - Bonus déplacement si plusieurs villages proches.
  - Bonus dégressif (+15 % → +10 % → +5 % → max 30 %).
  - Perdu si un village barbare ou joueur ennemi s'intercale.

## Classements

| Type | Critère | Récompense |
| --- | --- | --- |
| **Pillards de la semaine** | Ressources pillées | Bonus Couronnes |
| **Boucliers d'acier** | Attaques défensives gagnées | Cosmétiques |
| **Architectes** | Bâtiments construits / upgradés | Production +5 % temporaire |
| **Chevaliers du peuple** | Population totale | Prestige visuel |

Réinitialisation **hebdomadaire + mensuelle** (douce, pas de wipe complet).

## Philosophie mobile

| Principe | Application |
| --- | --- |
| **Décision simple, effet clair** | 1 clic = 1 conséquence visible |
| **Zéro frustration définitive** | Villages en ruines, jamais détruits |
| **Rétention par intérêt** | Raids barbares, classements, Almanax |
| **Feedback visuel constant** | Icônes, effets de niveaux, jauges, musiques dynamiques |
| **Sessions courtes mais utiles** | Chaque session (2–5 min) = construction ou attaque utile |

## Extensions post-MVP

| Feature | Description |
| --- | --- |
| **Marché royal** | Échanges entre joueurs contre couronnes |
| **Alliances / Tribus** | Petits regroupements défensifs |
| **Techno globale** | Arbre léger centré sur économie |
| **Prestige visuel** | Skins, bannières, effets |
| **Campagne solo** | Tutoriel interactif et quêtes dynamiques |

## Résumé design

| Axe | Intention | Statut |
| --- | --- | --- |
| Macro-stratégie par styles | Décision simple, effet lisible | ✅ |
| Monde vivant et raids | Pression douce, rétention | ✅ |
| Monnaie Couronne | Liaison entre gameplay et pouvoir | ✅ |
| Conquête | Capture simple, tension maîtrisée | ✅ |
| Pas de moral ni buffs lourds | Fluidité mobile | ✅ |
| Passifs bâtiments | Profondeur structurelle | ✅ |
| Classements / Almanax | Rétention positive | ✅ |

> _« Chaque joueur dirige un royaume vivant.
> Ses choix façonnent l'histoire de ses villages,
> pas à travers des chiffres, mais à travers des décisions lisibles, gratifiantes et visibles. »_
