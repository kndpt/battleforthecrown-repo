# Événements et rétention

Mécaniques de rétention : raids barbares globaux, événements serveur _Oyez_, bénédictions quotidiennes, quêtes journalières et hebdomadaires.

## Raids barbares globaux

> ⚠️ À ne pas confondre avec les **villages barbares** (entités neutres sur la carte que le joueur attaque) — leur spec est dans [`06-barbarians.md`](./06-barbarians.md). Le raid barbare **global** ci-dessous est un événement serveur que le joueur **subit**, pas qu'il déclenche.

Voir aussi [`01-overview.md` § Monde persistant](./01-overview.md#monde-persistant-et-raids).

- Se déclenchent globalement toutes les **3 à 5 jours**.
- Difficulté adaptée au niveau du joueur.
- **Victoire** : gain de couronnes + loot.
- **Défaite** : perte de quelques ressources / troupes + perte de niveau de bâtiment.
- Après plusieurs défaites consécutives (ex : 3), le village **passe en ruines** (niveau bâtiments −50 %), reconquérable gratuitement.

> 🔹 Pas de destruction complète = pas de frustration irréversible.

## Événements "Oyez" (Almanax)

### Principe

- **Événement serveur à durée limitée**, annoncé par le héraut.
- **Un seul Oyez actif à la fois** pour tout le monde.
- Bonus thématiques simples (production, entraînement, vision, vitesse) qui **orientent la méta quelques jours** sans créer d'injustice.
- **Cadence** : 1–2 Oyez par semaine ou par mois, démarrage à **04:00 Europe/Paris**.
- **Empilement** : non cumulable avec un bonus de même catégorie (on prend la meilleure valeur entre Oyez et Bénédictions quotidiennes).

### Catalogue d'événements

| Nom | Effet | Durée |
| --- | --- | --- |
| **Semaine du Fer** | +25 % production fer | 7 jours |
| **Lune de guerre** | +15 % vitesse entraînement | 2 jours |
| **Jour des barbares** | +loot barbares, raids plus fréquents | 24 h |
| **Bénédiction royale** | +25 % production de couronnes | 5 jours |
| **Jour des bâtisseurs** | Temps de construction −10 % | 24 h |
| **Marche forcée** | +15 % vitesse de déplacement | 24 h |
| **Œil du Guet** | +2 cases de vision | 24 h |
| **Coffres d'État** | Capacité d'entrepôt +15 % | 2 jours |

### Reco UI

- Titre section : **Oyez**.
- Bouton/Badge : "Oyez actif".
- Micro-copy : _« Oyez ! Le Héraut proclame l'événement du jour. »_
- Icône : parchemin + sceau (rouge), animation d'ouverture.

## Bénédictions quotidiennes

> 🔮 **Hors scope MVP** — système conservé en spec mais l'implémentation est reportée en post-MVP. Les questions ouvertes (notamment l'application temporelle des bonus, cf. ticket archivé `tasks/archive/17-blessings-temporal-effects.md`) seront tranchées au moment de la mise en chantier réelle.

Mini-plan tactique quotidien incitant à la connexion régulière.

### Règle de base

- Chaque joueur reçoit **3 bénédictions aléatoires uniques** chaque **24 h**.
- Il **en choisit 1** qui dure **4 h** (temps réel).
- **Aucune cumulabilité** avec les effets d'Almanax ou d'autres bonus similaires.
- Objectif : offrir une **décision rapide et gratifiante** chaque jour.

### Chiffrage et garde-fous

| Élément | Valeur / règle |
| --- | --- |
| **Reset** | Tous les jours à 04:00 (heure du monde) |
| **Durée** | 4 h par bénédiction sélectionnée |
| **Effet** | Non cumulable (même catégorie) |
| **Tirage** | Individuel par joueur. Chaque slot des 3 bénédictions proposées est tiré selon la table de rareté ci-dessous, puis une bénédiction est piochée dans le pool de la rareté obtenue. |
| **Rareté (probabilité par slot)** | Commun 70 %, Rare 25 %, Épique 5 %. Ces % décrivent le **tirage**, pas la composition du catalogue : un joueur peut très bien recevoir 3 communs, ou 1 épique + 2 communs. |

### Liste des bénédictions

| Nom | Effet | Rareté |
| --- | --- | --- |
| **Maçon** | Temps de construction −10 % | Commun |
| **Maréchal** | Temps d'entraînement −10 % | Commun |
| **Pilleur** | +20 % butin sur barbares | Commun |
| **Guetteur** | +2 cases de vision (temporaire) | Commun |
| **Éclaireur** | Vitesse de déplacement +5 % | Rare |
| **Logisticien** | Capacité de loot +15 % | Rare |
| **Intendant** | Production globale +8 % | Rare |
| **Bastion** | Défense +15 % contre barbares | Rare |
| **Gardien** | Pertes de troupes −10 % en défense vs barbares | Rare |
| **Trésorier** | Capacité d'entrepôt +15 % | Rare |
| **Forgeron** | Attaque des unités +10 % vs barbares | Rare |
| **Architecte** | +1 slot de construction | Épique |
| **Maître d'armes** | +1 slot d'entraînement | Épique |
| **Fermier** | Population disponible +5 % | Épique |

> 🎯 Crée une habitude quotidienne simple et gratifiante, sans impacter l'équilibrage global ni créer d'injustice PvP.

## Quêtes quotidiennes

Récompense lourde quotidienne incitant à la connexion régulière et à l'engagement actif.

### Principe

- **1 quête unique** par jour, adaptée au niveau du joueur.
- **Récompense substantielle** : équivalent à **4–10 h de production passive**.
- **Objectif simple** : atteignable en 10–20 min de jeu actif.
- **Reset quotidien** : 04:00 (heure du monde).
- **Carotte claire** : sensation d'attendre chaque jour sa récompense.

### Règles

| Élément | Valeur / règle |
| --- | --- |
| **Fréquence** | 1 quête / jour + 1 quête VIP / semaine |
| **Durée validité** | 24 h (disparaît au reset si non complétée) |
| **Progression** | Sauvegardée jusqu'au reset (ex : 5/10 raids conservés) |
| **Adaptation** | Tier selon niveau Château (1–4, 5–7, 8–10) |
| **Rotation** | Pool de 8–10 quêtes par tier, tirage aléatoire quotidien |

### Paliers de récompenses

| Palier | Valeur totale | Équivalent | Cible |
| --- | --- | --- | --- |
| **Tier 1** | ~2 000 – 3 000 | 2–3 h de production | Château niveau 1–4 |
| **Tier 2** | ~4 000 – 6 000 | 4–6 h de production | Château niveau 5–7 |
| **Tier 3** | ~7 000 – 10 000 | 7–10 h de production | Château niveau 8–10 |
| **Tier VIP** | ~12 000 – 15 000 | 12–15 h de production | 1× / semaine (tous) |

### Exemples de quêtes

#### Tier 1 — Early Game (niveaux 1–4)

| Quête | Objectif | Récompense |
| --- | --- | --- |
| **Premier pas** | Construire ou améliorer 2 bâtiments | 800 bois + 800 pierre + 600 fer |
| **Défenseur du royaume** | Repousser 1 raid barbare | 1 000 bois + 800 pierre + 800 fer |
| **Pilleur novice** | Piller 3 villages barbares | 700 bois + 700 pierre + 700 fer + 50 couronnes |
| **Recrutement massif** | Entraîner 20 unités | 900 bois + 900 pierre + 800 fer |

#### Tier 2 — Mid Game (niveaux 5–7)

| Quête | Objectif | Récompense |
| --- | --- | --- |
| **Expansion stratégique** | Améliorer le Château d'1 niveau | 1 500 bois + 1 800 pierre + 1 200 fer |
| **Raid du jour** | Piller 5 villages barbares (min 2 000 loot) | 2 000 bois + 1 500 pierre + 1 500 fer + 100 couronnes |
| **Armée du peuple** | Entraîner 40 unités population | 1 800 bois + 1 800 pierre + 2 000 fer |
| **Forteresse imprenable** | Améliorer Watchtower de 2 niveaux | 1 400 bois + 2 000 pierre + 1 100 fer |

#### Tier 3 — Late Game (niveaux 8–10)

| Quête | Objectif | Récompense |
| --- | --- | --- |
| **Domination totale** | Piller 10 villages barbares (min 5 000 loot) | 3 000 bois + 2 500 pierre + 3 000 fer + 200 couronnes |
| **Conquérant** | Conquérir 1 village barbare | 4 000 bois + 3 500 pierre + 3 500 fer + 500 couronnes |
| **Architecte royal** | Améliorer 3 bâtiments d'1 niveau | 2 800 bois + 3 200 pierre + 2 500 fer |
| **Légion d'élite** | Entraîner 100 unités population | 3 500 bois + 3 000 pierre + 4 000 fer |

#### Tier VIP — Hebdomadaire (dimanche)

| Quête | Objectif | Récompense |
| --- | --- | --- |
| **Seigneur de guerre** | Gagner 15 combats (défense / attaque) | 5 000 bois + 5 000 pierre + 5 000 fer + 1 000 couronnes |
| **Maître bâtisseur** | Construire ou améliorer 10 bâtiments | 6 000 bois + 6 000 pierre + 4 000 fer |
| **Roi des pillards** | Piller 50 000 ressources totales | 7 000 bois + 6 000 pierre + 7 000 fer + 2 000 couronnes |

### Impact économique

| Source | Ressources / jour | Contribution |
| --- | --- | --- |
| **Production passive** | ~24 000 | 50 % |
| **Pillage actif** | ~24 000 | 50 % |
| **Quête quotidienne** | 5 000 – 10 000 | **+10–15 %** |

> 🎯 Crée une habitude quotidienne gratifiante sans déséquilibrer l'économie. La quête accélère légèrement la progression tout en valorisant le jeu actif.

## Classements

Levier de rétention périodique (hebdo + mensuel). Catalogue complet et récompenses : [`09-power-and-rankings.md` § Classements](./09-power-and-rankings.md#classements).
