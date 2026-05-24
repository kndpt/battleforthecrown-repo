# Overview — Vision et boucles

## Vision globale

> _« Un jeu de stratégie de conquête médiévale lisible mais profond : des choix clairs, des décisions lourdes de conséquences, et un monde vivant où chaque village a une identité. »_

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

Chaque joueur commence avec **un village**. Il peut ensuite **conquérir** d'autres villages — joueurs ou barbares. Spec dédiée : [`10-conquest.md`](./10-conquest.md) (hub) + [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) (barbare) + [`14-pvp-conquest.md`](./14-pvp-conquest.md) (PvP, en chantier).

| Type de village | Description |
| --- | --- |
| **Village joueur** | Entité appartenant à un joueur, attaquable, pillable, conquérable |
| **Village barbare** | Mini-joueurs IA, attaquables, pillables — détail dans [`06-barbarians.md`](./06-barbarians.md) |

Les détails sur les ressources, la population et les couronnes sont dans [`02-economy-and-progression.md`](./02-economy-and-progression.md). Les bâtiments dans [`03-buildings.md`](./03-buildings.md). Le combat dans [`04-combat.md`](./04-combat.md), les unités dans [`08-units.md`](./08-units.md). Les villages barbares dans [`06-barbarians.md`](./06-barbarians.md).

## Boucles de gameplay

### Boucle économique

1. Les bâtiments produisent passivement des ressources.
2. Le joueur les investit dans de nouvelles constructions ou des unités.
3. Les entrepôts limitent la production (nécessitent upgrades).
4. Le joueur équilibre population / production / défense.

🎯 **Objectif** : créer une progression visible et régulière, même en mode idle.

### Boucle militaire

1. Le joueur entraîne des unités dans la Caserne (vitesse dépend du niveau).
2. Il attaque des villages barbares pour piller ressources et apprendre le combat (cf. [`06-barbarians.md`](./06-barbarians.md)).
3. Plus tard, il attaque ou défend contre d'autres joueurs.
4. Les troupes vaincues ou en formation consomment de la population.

🎯 **Objectif** : combats simples à comprendre mais stratégiques. Combat automatique basé sur stats + bonus stratégie de village.

### Boucle de conquête

1. Le joueur nomme un **Seigneur**.
2. Il attaque un village ennemi.
3. Si toutes les troupes ennemies sont vaincues et le Seigneur survit :
   - le Seigneur s'installe pendant une **fenêtre de capture variable** (selon le tier barbare ou le niveau de Château cible).
   - Si non-attaqué durant ce temps → conquête réussie.
4. Le village appartient maintenant au joueur.

🔹 Un Seigneur est **unique** et se sacrifie après conquête réussie.
🔹 Chaque village est **unique**, avec ses features. Le joueur peut donc se créer un réseau de villages.
🔹 Les rôles privés (`Favori`, `Raid`, `Défense`, etc.) aident à lire ce réseau sans ajouter de bonus mécanique. Détail : [`22-village-roles-and-navigation.md`](./22-village-roles-and-navigation.md).

### Boucle de rétention

1. **Cartes quotidiennes** : action personnelle courte, backlog limité, récompense modérée.
2. **Oyez** : contexte monde léger qui oriente les cartes et la priorité du moment.
3. **Notifications** : retour mobile au bon moment pour les timers et menaces critiques.
4. **Classements / progression de saison** : post-MVP, à retravailler seulement si le besoin de rétention long terme apparaît.

Détail cartes + Oyez : [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md). Notifications : [`16-notifications.md`](./16-notifications.md).

## Exploration & brouillard de guerre

La carte du monde n'est pas révélée d'un coup. Le joueur **construit sa vision** via la **tour de guet** (voir [`03-buildings.md`](./03-buildings.md#tour-de-guet-watchtower)), et trois états cohabitent :

| État | Ce qui s'affiche | Quand |
| --- | --- | --- |
| **Visible** | Entité complète : type, owner, niveau, nom | Dans le rayon d'au moins une de mes tours de guet |
| **Blip** | Un point gris anonyme — "il y a quelque chose" | Hors rayon, **uniquement pour les villages** (joueurs + barbares) |
| **Hors monde** | Rien | Au-delà des bornes du monde |

### Règles

- **Rayon** = `WATCHTOWER_VISION_LEVELS[level].visibilityRadius`. Lvl 1 = 5 cases, +5 / niveau, **lvl 10 = 50 cases**.
- **Vision = union** des disques de toutes mes tours de guet (un joueur avec 3 villages voit l'union de 3 cercles). Aucune tour ne donne une vision mondiale : la couverture large vient de villages multiples, conquis ou développés à des positions stratégiques.
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

> 🔹 Pas de destruction complète = pas de frustration irréversible.

### Monde persistant

- Les barbares peuvent **reprendre un village abandonné** (retour à la barbarie). Voir aussi l'algorithme de génération des villages barbares à l'arrivée d'un joueur : [`07-barbarian-spawning.md`](./07-barbarian-spawning.md).
- Villages trop éloignés du centre → plus de barbares / plus de loot. Distribution des tiers détaillée dans [`06-barbarians.md` § Distribution sur la carte](./06-barbarians.md#distribution-sur-la-carte).

> 🔮 **Post-MVP** : un système de **zones d'influence** (bonus déplacement entre villages proches du même joueur, perdu si un ennemi s'intercale) a été envisagé mais reporté. Il sera spécifié quand le PvP émergent sera observé sur le playtest. Pas de promesse fantôme dans le MVP.

## Classements

> 🚧 **Post-MVP — à retravailler.** L'esquisse de 4 classements (Pillards, Boucliers, Architectes, Chevaliers du peuple) reste documentée pour traçabilité mais sort du scope MVP : les récompenses chiffrées créent un snowball mécanique non maîtrisé. Détail et points à reprendre : [`09-power-and-rankings.md` § Classements](./09-power-and-rankings.md#classements).

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
| **Campagne solo** | Tutoriel interactif au-delà du tuto MVP |

## Résumé design

| Axe | Intention | Statut |
| --- | --- | --- |
| Macro-stratégie par styles | Décision simple, effet lisible | ✅ |
| Monde vivant et raids | Pression douce, rétention | ✅ |
| Monnaie Couronne | Liaison entre gameplay et pouvoir | ✅ |
| Conquête | Capture simple, tension maîtrisée | ✅ |
| Pas de moral ni buffs lourds | Fluidité mobile | ✅ |
| Passifs bâtiments | Profondeur structurelle | ✅ |
| Classements / Almanax | Rétention positive | Almanax ✅ — Classements 🚧 post-MVP |

> _« Chaque joueur dirige un royaume vivant.
> Ses choix façonnent l'histoire de ses villages,
> pas à travers des chiffres, mais à travers des décisions lisibles, gratifiantes et visibles. »_
