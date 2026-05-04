# 🎮 GAMEPLAY_FOUNDATIONS.md

> **Battle for the Crown — Système de Jeu & Boucles Fondamentales**

---

## 🏰 1. Vision Globale

> _“Un jeu de stratégie médiévale lisible mais profond : des choix clairs, des décisions lourdes de conséquences, et un monde vivant où chaque village a une identité.”_

### 🎯 Objectif

Créer une expérience de **stratégie simplifiée mais tactique**, pensée pour mobile :

- Pas de micro-décisions ou d’arbres de talents.
- Des **boucles claires et gratifiantes** (production → expansion → défense).
- Une **stratégie macro visible** à travers des _styles de villages_ et des _zones d’influence_.
- Une **rétention douce** (raids barbares, événements, classements périodiques).

---

## ⚙️ 2. Structure du Jeu

### 2.1. Les Villages

Chaque joueur commence avec **un village**.\
Il peut ensuite **conquérir** d’autres villages (barbares ou joueurs).

| Élément               | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| **Village joueur**    | Entité appartenant à un joueur pouvant être attaqués, pillés ou conquis. |
| **Villages barbares** | PNJ neutres pouvant être attaqués, pillés ou conquis.                    |

---

### 2.2. Types de Ressources

| Type           | Rôle                                                           | Produit par                 |
| -------------- | -------------------------------------------------------------- | --------------------------- |
| **Bois**       | Construction, unités de base                                   | Camp de bûcherons           |
| **Pierre**     | Construction défensive                                         | Carrière                    |
| **Fer**        | Unités avancées                                                | Mine de fer                 |
| **Population** | Ressource humaine limitée                                      | Déterminée par le Moulin    |
| **Couronnes**  | Ressource stratégique principale (taxes, seigneurs, stratégie) | Gains par villages possédés |

---

### 2.3. Les Bâtiments

Chaque bâtiment a un **passif automatique** et une **fonction unique**.\
Les passifs évoluent avec le **niveau du bâtiment**.
Ils sont constructibles dans le panel du château.

| Bâtiment                                              | Rôle principal        | Effets passifs par niveau                                                  |
| ----------------------------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| 🏰 [**Château**](./buildings/CASTLE.md)               | Cœur du village       | +vitesse construction, +file construction max, débloque d'autres bâtiments |
| 🪓 [**Camp de bûcherons**](./buildings/WOOD.md)       | Produit du bois       | +production bois                                                           |
| ⛏️ [**Carrière**](./buildings/STONE.md)               | Produit de la pierre  | +production pierre                                                         |
| ⚒️ [**Mine de fer**](./buildings/IRON.md)             | Produit du fer        | +production fer                                                            |
| 🏻 [**Entrepôt**](./buildings/WAREHOUSE.md)           | Stockage              | +capacité max ressources                                                   |
| 🌾 [**Moulin**](./buildings/FARM.md)                  | Population            | +population                                                                |
| ⚔️ [**Caserne**](./buildings/BARRACKS.md)             | Entraînement unités   | +vitesse entraînement, +types unités débloquées                            |
| 🔭 [**Tour de guet**](./buildings/WATCHTOWER.md)      | Vision carte          | +rayon de visibilité monde                                                 |
| 🧱 [**Rempart**](./buildings/WALL.md) _(nouveau)_     | Défense passive       | +défense globale village                                                   |
| 🕯️ [**Cachette**](./buildings/HIDEOUT.md) _(nouveau)_ | Cacher les ressources | _(à définir)_ (bonus spy ?)                                                |
| 🕯️ **Salle du Conseil** _(nouveau)_                   | Choix de stratégie    | Interface de stratégie de village (voir §4)                                |
| 🕯️ **Salle du Trône** _(nouveau)_                     | Nommage de seigneur   | +vitesse entraînement, +vitesse de noblage                                 |

> 💡 **Notes** :
>
> - Chaque bâtiment a un niveau max qui lui est propre.

#### Mécanique d'upgrade

- **File d'attente** : 2 upgrade en file d'attente par défaut
- **Consommation de population** : Les upgrade occupent de la population
- **Annulation** : Remboursement complet des ressources et population

---

### 2.4. Les Troupes (Unités)

Chaque unité a un **coût**, un **temps d'entraînement** et des **stats de combat**.\
Les unités se débloquent progressivement via le niveau de la **Caserne**.

#### Catalogue des unités

| Unité            | Rôle                 | Bois | Pierre | Fer | Pop | Temps | Caserne | Attaque | Défense | Capacité | Mobilité | Poids | Passif                     |
| ---------------- | -------------------- | ---- | ------ | --- | --- | ----- | ------- | ------- | ------- | -------- | -------- | ----- | -------------------------- |
| 🗡️ **MILICE**    | Infanterie de base   | 50   | 30     | 10  | 1   | 30s   | 1       | 5       | 5       | 25       | 10       | 2     | -                          |
| 🛡️ **ÉCUYER**    | Infanterie avancée   | 80   | 50     | 30  | 1   | 60s   | 2       | 10      | 10      | 50       | 15       | 8     | +10% attaque contre archer |
| **GUERRIER**     | Infanterie offensive | 120  | 80     | 50  | 2   | 180s  | 3       | 20      | 5       | 35       | 20       | 12    | to define                  |
| ⚡ **TEMPLIER**  | Chevalier lourd      | 80   | 150    | 120 | 2   | 180s  | 4       | 5       | 15      | 40       | 10       | 12    | to define                  |
| 🕵️ **SPY**       | Espion               | 50   | 50     | 20  | 1   | 90s   | 5       | 8       | 2       | 0        | 100      | 10    | to define                  |
| 👑 **Seigneur**  | Conquête unique      | 1000 | 800    | 500 | 5   | 600s  | 10      | 500     | 500     | 0        | 5        | 100   | -                          |
| 🏹 **ARCHER**    | Archer à distance    | 60   | 40     | 30  | 1   | 90s   | 3       | 12      | 6       | 20       | 12       | 6     | to define                  |
| 🐴 **CAVALIER**  | Cavalier             | 200  | 100    | 150 | 3   | 240s  | 5       | 15      | 8       | 100      | 8        | 15    | Pilleur optimal            |
| **BÉLIER**       | Siège                | 300  | 400    | 200 | 4   | 360s  | 7       | 50      | 10      | 0        | 5        | 30    | Bonus vs défenses          |
| 🎯 **CATAPULTE** | Siège                | 400  | 600    | 300 | 5   | 480s  | 8       | 80      | 5       | 0        | 3        | 40    | Dégâts zone                |

> 💡 **Légende** :
>
> - **Bois, Pierre, Fer** : Coût en ressources par unité
> - **Pop** : Consommation de population (coûtée lors de l'entraînement)
> - **Temps** : Temps d'entraînement d'une unité (en secondes, s'applique à vitesse × multiplicateur)
> - **Caserne** : Niveau minimum requis de la Caserne pour débloquer
> - **Vitesse** : Vitesse de déplacement sur la carte (plus le chiffre est bas, plus c'est rapide)
> - **Attaque** : Puissance d'attaque (valeur brute utilisée dans les calculs de combat)
> - **Déf. Inf/Cav/Arc** : Défense contre infanterie, cavalerie et archers (valeur de résistance)
> - **Capacité** : Capacité de transport pour le loot (unités de ressources par unité)
> - **Poids** : Utilisé pour calculer la puissance du village (voir §2.5)
>
> _Note_ : Les unités marquées `*` sont désactivées au MVP (requièrent `requiredBarracksLevel: 99` en config)

#### Mécanique d'entraînement

- **File d'attente** : Une seule formation à la fois (future : queue parallèle)
- **Consommation de population** : Les unités en entraînement occupent de la population
- **Annulation** : Remboursement complet des ressources et population
- **Déblocage progressif** : Plus la Caserne monte, plus d'unités deviennent disponibles

#### Stratégies d'utilisation

| Style             | Unités prioritaires        | Raison                                |
| ----------------- | -------------------------- | ------------------------------------- |
| 🛡️ **Forteresse** | SQUIRE, TEMPLAR, ARCHER    | Défense élevée, survivabilité         |
| ⚔️ **Raiders**    | MILITIA, CAVALRY (future)  | Attaque rapide, mobilité              |
| ⚙️ **Économique** | MILITIA, ARCHER            | Production ressources, défense légère |
| ⚖️ **Équilibré**  | Mélange adapté à la menace | Flexibilité tactique                  |

---

### 2.5. Système de Puissance

La **puissance** représente la force globale d'un village ou d'un royaume. Elle sert aux classements et à l'évaluation stratégique.

#### Calcul de la puissance

**Puissance d'un village** = Puissance Bâtiments + Puissance Unités (armée)

```
Puissance Bâtiment = Σ (POIDS_BÂTIMENT × niveau)
Puissance Armée   = Σ (POIDS_UNITÉ × quantité)
```

**Puissance d'un royaume** = Somme de la puissance de tous les villages du joueur

#### Caractéristiques importantes

| Élément               | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| **Puissance Village** | Visible pour tous (bâtiments = information publique)       |
| **Puissance Armée**   | Cachée pour les ennemis (nécessite espion pour la révéler) |
| **Puissance Royaume** | Visible pour tous                                          |

#### Utilisation stratégique

- **Espionnage** : Les espions révèlent la composition exacte des troupes ennemies (et donc rend visible la véritable puissance d'un village)
- **Évaluation** : Permet d'estimer la difficulté d'une cible avant attaque
- **Villages cachés** : Un village peut avoir peu de bâtiments mais une armée massive (piège)

---

### 2.6. Système de population

La **population** est une **ressource finie et permanente** qui représente les citoyens d'un village. Elle crée un **trade-off stratégique fondamental** : chaque bâtiment construit ou unité entraînée consomme de la population.

#### Principes fondamentaux

| Élément            | Description                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Population max** | **Identique pour tous les joueurs et tous leurs villages** (défini par tous les levels du moulin) |
| **Source**         | **Moulin** : chaque niveau ajouté augmente la population totale disponible                        |
| **Coût**           | Chaque bâtiment et chaque unité consomment de la population (définitivement)                      |
| **Libération**     | Seulement si un bâtiment est détruit ou une unité meurt                                           |

> 💡 **Notes** :
>
> - **Population max cumulée** : somme de tous les bonus du Moulin (ex : avec Moulin level 3 = pop lvl 1 + pop lvl 2 + pop lvl 3)
> - **Cohérence** : Chaque level permet des choix strategiques différents (armée massive OU infrastructure complète)
> - La population totale d'un village = bonus cumulé du Moulin (chaque village possède son Moulin avec son propre niveau)

#### Mécanique de consommation

La population est **allouée définitivement** aux bâtiments et unités :

- **Construction d'un bâtiment** → `-X population` (permanent)
- **Entraînement d'une unité** → `-Y population` (permanent jusqu'a mort de l'unité)
- **Destruction de bâtiment** → `+X population` (libérée)
- **Mort d'une unité** → `+Y population` (libérée)

**Formule** :

```
Population disponible = Population max - Σ(Pop bâtiments) - Σ(Pop unités)
```

#### Limites et contraintes

| Règle                | Impact stratégique                                                        |
| -------------------- | ------------------------------------------------------------------------- |
| **Population finie** | Impossible de tout construire ET d'entraîner une armée massive            |
| **Choix exclusif**   | "Bâtiments ?", "Armée ?", ou "Mélange ?" → chaque joueur décide son style |
| **Coût de l'erreur** | Mal équilibrer = village faible en offensif OU en ressources              |

#### Stratégies de gestion

| Stratégie      | Approche                                              | Population utilisée                            |
| -------------- | ----------------------------------------------------- | ---------------------------------------------- |
| **Économique** | Priorité bâtiments de production                      | Moulin, Fermes, Mines → armée minimaliste      |
| **Militaire**  | Priorité armée (attaque/défense)                      | Caserne remplie → bâtiments basiques seulement |
| **Forteresse** | Armée défensive + bâtiments de défense                | Rempart, Tour de guet + défenseurs             |
| **Raider**     | Armée offensive légère + production min               | Caserne + unités rapides mobiles               |
| **Équilibré**  | Mélange adapté au contexte (guerre ? développement ?) | Flexible selon situation                       |

#### Impact sur les autres systèmes

- **Bâtiments** : Chaque upgrade consomme pop → limite la croissance si armée forte
- **Armée** : Chaque unité "bloque" pop → empêche autre développement
- **Défense** : Armée de défense = investissement permanent en population
- **Raids/Conquêtes** : Pertes d'unités = libération de pop → opportunité de reconstruction rapide
- **Stratégies de village** :
  - **Économique** (+10% pop max) : Plus de population → plus de flexibilité
  - **Forteresse** (-20% vitesse armée) : Troupes lénètes mais bâtiments défensifs efficaces
  - **Raiders** (+10% loot) : Armée plus efficace → compétence militaire vs développement

---

## ⚔️ 3. Boucles de Gameplay

### 3.1. Boucle Économique

1. Les bâtiments produisent passivement des ressources.
2. Le joueur les investit dans de nouvelles constructions ou des unités.
3. Les entrepôts limitent la production (nécessitent upgrades).
4. Le joueur équilibre population / production / défense.

🎯 **Objectif :** Créer une progression visible et régulière, même en mode idle.

---

### 3.2. Boucle Militaire

1. Le joueur entraîne des unités dans la Caserne (vitesse dépend du niveau).
2. Il attaque des villages barbares pour piller ressources et expérience.
3. Plus tard, il attaque ou défend contre d’autres joueurs.
4. Les troupes vaincues ou en formation consomment de la population.

🎯 **Objectif :** Offrir des combats simples à comprendre mais stratégiques :

- **Types d’unités** : Milice, Archer, Cavalier, Catapulte, Espion, Seigneur.
- **Unités débloquées** par niveaux de Caserne.
- **Combat automatique**, basé sur stats + bonus stratégie du village.

---

### 3.3. Boucle de Conquête

1. Le joueur nomme un **Seigneur**.
2. Il attaque un village ennemi.
3. Si toutes les troupes ennemies sont vaincues et le Seigneur survit :
   - le Seigneur s’installe pendant **6h** (capture en cours).
   - Si non-attaqué durant ce temps → conquête réussie.
4. Le village appartient maintenant au joueur.

🔹 Un Seigneur est **unique** et se sacrifie après conquête réussie.
🔹 Chaque village est **unique**, avec les features. Le joueur peut donc se créer un réseau de village.

---

### 3.4. Boucle de Rétention

1. **Raid barbare global** toutes les 3–5 jours.
   - Objectif : connecter les joueurs régulièrement.
   - Récompenses si défendu, pertes limitées sinon.
2. **Événements temporaires ("Oyez")** :
   - Bonus production, entraînement, vision, etc.
3. **Classements hebdo/mensuels** :
   - Offensive, Défensive, Économique, Architecte.
4. **Calendrier saisonnier léger** :
   - Petites récompenses cosmétique / ressource à la fin de la semaine.

---

## 💰 4. Système de Monnaie — Couronnes

La puissance des villages du joueur (uniquement le poids des batiments) déduit le taux de rendement de couronnes par heure.

| Source                   | Gain            |
| ------------------------ | --------------- |
| Villages possédés        | +X/h            |
| Raids barbares repoussés | +Y instantané   |
| Classement hebdo         | +Z bonus        |
| Événements Almanax       | multiplicateurs |

| Dépense                                   | Coût            |
| ----------------------------------------- | --------------- |
| Changer stratégie de village              | 50–100 Autorité |
| Nommer un Seigneur                        | 3000+           |
| Activer un bonus temporaire (bénédiction) | 150             |
| Déplacer un village / resettlement        | 200             |

🎯 **Rôle central :** tout passe par cette monnaie → elle lie toutes les boucles.

---

## 🧭 5. Styles Stratégiques de Village

> Chaque village peut adopter une **stratégie** depuis la **Salle du Conseil**

| Style             | Bonus                                        | Malus                            | Recommandations automatiques |
| ----------------- | -------------------------------------------- | -------------------------------- | ---------------------------- |
| 🛡️ **Forteresse** | +25 % défense unité +10 % stockage           | -20 % vitesse déplacement unités | Murs, Archers, Tour de guet  |
| ⚔️ **Raiders**    | +15 % vitesse déplacement unités, +10 % loot | -10 % défense                    | Caserne, Cavaliers           |
| ⚙️ **Économique** | +20 % production, +10 % pop max              | -10 % attaque - 10% défense      | Fermes, Mines, Entrepôts     |
| ⚖️ **Équilibré**  | Aucun bonus/malus                            | —                                | Mélange intelligent          |

### Mécanique :

- Changement instantané → cooldown 24h.
- Coût en couronnes.
- Icône de stratégie visible sur la carte.
- Effets appliqués aux calculs backend (production, combat, vitesse).

---

## 🔥 6. Raids Barbares & Monde Vivant

### Raids barbares

- Se déclenchent globalement toutes les 3–5 jours.
- Difficulté adaptée au niveau du joueur.
- Si victoire : gain de Couronnes + loot.
- Si défaite : perte de quelques ressources / troupes et perte de level de batiment.
- Après plusieurs défaites consécutives (ex. 3), le village **passe en ruines** :
  - Niveau bâtiments -50 %.
  - Peut être reconquis gratuitement par le joueur en se reconnectant et validant la reprise.
- **Protection post-perte** : Si un joueur perd un village, bouclier 12h sur les autres villages (évite snowball nocturne).

> 🔹 Pas de destruction complète = pas de frustration irréversible.

---

### Monde persistant

- Les barbares peuvent **reprendre un village abandonné** (retour à la barbarie).
- Villages trop éloignés du centre → plus de barbares / plus de loot.
- Système de **zones d’influence** :
  - Bonus déplacement si plusieurs villages proches.
  - Bonus dégressif (+15 % → +10 % → +5 % → max 30 %).
  - Perdu si un village barbare ou joueur ennemi s’intercale.

---

## 🧱 7. Progression des Bâtiments

| Niveaux        | Type de progression | Description                                       |
| -------------- | ------------------- | ------------------------------------------------- |
| 1–5            | Découverte rapide   | Augmentation linéaire, feedback immédiat          |
| 6–10           | Investissement      | Temps ×1.5, coût ×2 par niveau                    |
| >10 (post-MVP) | Prestige            | Rendement décroissant, bonus visuel ou symbolique |

### Exemples :

- **Château** : +5 % vitesse construction par niveau.
- **Caserne** : -3 % temps d’entraînement / niveau.
- **Tour de guet** : +2 cases vision par niveau.
- **Moulin** : +10 % population max / niveau.
- **Entrepôt** : +20 % capacité / niveau.
- **Rempart** : +5 % défense globale / niveau.

---

## 🏆 8. Classements et Rétention

| Type                       | Critère                       | Récompense                 |
| -------------------------- | ----------------------------- | -------------------------- |
| **Pillards de la semaine** | Ressources pillées            | Bonus Couronnes            |
| **Boucliers d’acier**      | Attaques défensives gagnées   | Cosmétiques                |
| **Architectes**            | Bâtiments construits/upgradés | Production +5 % temporaire |
| **Chevaliers du peuple**   | Population totale             | Prestige visuel            |

Classements **hebdomadaires + mensuels** (réinitialisation douce).

---

## 🌍 9. Événements Temporaires

### 9.1 - Évènement "Oyez" - Type almanax

**Définition courte.** _Oyez_ = événement serveur à durée limitée, annoncé par le héraut. Un seul **Oyez** actif à la fois pour tout le monde.  
**Concept.** Bonus thématiques simples (production, entraînement, vision, vitesse) qui **orientent la méta quelques jours** sans créer d’injustice.  
**Cadence.** 1–2 Oyez par semaine/mois, démarrage à 04:00 Europe/Paris.  
**Empilement.** Non cumulable avec un bonus de même catégorie (on prend la meilleure valeur entre Oyez et [Bénédictions quotidiennes](##14-benedictions-quotidiennes)).

| Nom                    | Effet                                | Durée   |
| ---------------------- | ------------------------------------ | ------- |
| “Semaine du Fer”       | +25 % prod fer                       | 7 jours |
| “Lune de guerre”       | +15 % vitesse entraînement           | 2 jours |
| “Jour des barbares”    | +loot barbares, raids plus fréquents | 24h     |
| “Bénédiction royale”   | +gain couronnes                      | 5 jours |
| “Jours des bâtisseurs” | Temps de construction −10 %          | 24h     |
| “Marche forcée”        | +15 % vitesse de déplacement         | 24h     |
| “Œil du Guet”          | +2 cases de vision                   | 24h     |
| “Coffres d’État”       | Capacité d’entrepôt +15 %            | 2 jours |

RECO UI (prêt à poser)
• Titre section : Oyez
• Bouton/Badge : Oyez actif
• Micro-copy : “Oyez ! Le Héraut proclame l’événement du jour.”
• Icône : parchemin + sceau (rouge), animation d’ouverture.

## 📱 10. Philosophie Mobile

| Principe                         | Application                                              |
| -------------------------------- | -------------------------------------------------------- |
| **Décision simple, effet clair** | 1 clic = 1 conséquence visible                           |
| **Zéro frustration définitive**  | Villages en ruines, jamais détruits                      |
| **Rétention par intérêt**        | Raids barbares, classements, Almanax                     |
| **Feedback visuel constant**     | Icônes, effets de niveaux, jauges, musiques dynamiques   |
| **Sessions courtes mais utiles** | Chaque session (2–5 min) = construction ou attaque utile |

---

## 🧩 11. Prochaines Extensions (post-MVP)

| Feature                | Description                              |
| ---------------------- | ---------------------------------------- |
| **Marché royal**       | Échanges entre joueurs contre couronnes  |
| **Alliances / Tribus** | Petits regroupements défensifs           |
| **Techno globale**     | Arbre léger centré sur économie          |
| **Prestige visuel**    | Skins, bannières, effets                 |
| **Campagne solo**      | Tutoriel interactif et quêtes dynamiques |

---

## 🧠 12. Résumé Design

| Axe                          | Intention                         | Statut |
| ---------------------------- | --------------------------------- | ------ |
| Macro-stratégie par styles   | Décision simple, effet lisible    | ✅     |
| Monde vivant et raids        | Pression douce, rétention         | ✅     |
| Monnaie Couronne             | Liaison entre gameplay et pouvoir | ✅     |
| Conquête                     | Capture simple, tension maîtrisée | ✅     |
| Pas de moral ni buffs lourds | Fluidité mobile                   | ✅     |
| Passifs bâtiments            | Profondeur structurelle           | ✅     |
| Classements / Almanax        | Rétention positive                | ✅     |

---

## 🔢 13. Système d'Équilibrage Économique

### 🎯 Objectifs de Progression

| Objectif                    | Cible                                                   |
| --------------------------- | ------------------------------------------------------- |
| **Durée pour maxer**        | ~1 mois (30 jours) pour un village level 10 complet     |
| **Sessions de jeu**         | 2-5 min (début) → sessions plus longues (multi-village) |
| **Connexions quotidiennes** | 2-4 fois/jour (début) → plus fréquent (late game)       |
| **Temps effectif total**    | ~100 heures sur 30 jours ≈ 3-4h/jour                    |

## ☀️ 14. Bénédictions Quotidiennes

> Mini-plan tactique quotidien incitant à la connexion régulière.

### Règle de base

- Chaque joueur reçoit **3 bénédictions aléatoires uniques** chaque **24h**.
- Il en **choisit 1** qui dure **4h** (temps réel).
- **Aucune cumulabilité** avec les effets d’Almanax ou d’autres bonus similaires.
- Objectif : offrir une **décision rapide et gratifiante** chaque jour.

### Chiffrage & garde-fous

| Élément    | Valeur / Règle                               |
| ---------- | -------------------------------------------- |
| **Reset**  | Tous les jours à 04:00 (heure du monde)      |
| **Durée**  | 4h par bénédiction sélectionnée              |
| **Reroll** | -                                            |
| **Effet**  | Non cumulable (même catégorie)               |
| **Tirage** | Individuel par joueur, aléatoire équilibré   |
| **Rareté** | 3 tiers (Commun 70 %, Rare 25 %, Épique 5 %) |

### Liste des bénédictions possibles

| Nom                | Effet                                             | Rareté |
| ------------------ | ------------------------------------------------- | ------ |
| **Maçon**          | Temps de construction −10 %                       | 1      |
| **Maréchal**       | Temps d’entraînement −10 %                        | 1      |
| **Pilleur**        | +20 % butin sur barbares                          | 1      |
| **Guetteur**       | +2 cases de vision (temporaire)                   | 1      |
| **Éclaireur**      | Vitesse de déplacement +5 %                       | 2      |
| **Logisticien**    | Capacité de loot +15 %                            | 2      |
| **Intendant**      | Production globale +8 %                           | 2      |
| **Bastion**        | Défense +15 % contre barbares                     | 2      |
| **Gardien**        | Perte de troupes −10 % en défense contre barbares | 2      |
| **Trésorier**      | Capacité d’entrepôt +15 %                         | 2      |
| **Forgeron**       | Attaque des unités +10 % contre barbares          | 2      |
| **Architecte**     | +1 slot de construction                           | 3      |
| **Maître d’armes** | +1 slot d’entraînement                            | 3      |
| **Fermier**        | Population disponible +5 %                        | 3      |

TODO: à compléter pour respecter => (Commun 70 %, Rare 25 %, Épique 5 %)

<!-- | **Commerçant**     | Temps de transport entre villages −15 %           |        | -->

> 🎯 Crée une habitude quotidienne simple et gratifiante, sans impacter l’équilibrage global ni créer d’injustice PvP.

---

## 🎯 15. Quêtes Quotidiennes

> Récompense lourde quotidienne incitant à la connexion régulière et à l'engagement actif.

### Principe

- **1 quête unique** par jour, adaptée au niveau du joueur
- **Récompense substantielle** : équivalent à **4-10h de production passive**
- **Objectif simple** : atteignable en 10-20 min de jeu actif
- **Reset quotidien** : 04:00 (heure du monde)
- **Carotte claire** : sensation d'attendre chaque jour sa récompense

### Règles

| Élément            | Valeur / Règle                                           |
| ------------------ | -------------------------------------------------------- |
| **Fréquence**      | 1 quête/jour + 1 quête VIP/semaine                       |
| **Durée validité** | 24h (disparaît au reset si non complétée)                |
| **Progression**    | Sauvegardée jusqu'au reset (ex: 5/10 raids conservés)    |
| **Adaptation**     | Tier selon niveau Château (1-4, 5-7, 8-10)               |
| **Rotation**       | Pool de 8-10 quêtes par tier, tirage aléatoire quotidien |

### Paliers de Récompenses

| Palier       | Valeur Totale  | Équivalent           | Cible                 |
| ------------ | -------------- | -------------------- | --------------------- |
| **Tier 1**   | ~2,000-3,000   | 2-3h de production   | Château niveau 1-4    |
| **Tier 2**   | ~4,000-6,000   | 4-6h de production   | Château niveau 5-7    |
| **Tier 3**   | ~7,000-10,000  | 7-10h de production  | Château niveau 8-10   |
| **Tier VIP** | ~12,000-15,000 | 12-15h de production | 1× par semaine (tous) |

### Exemples de Quêtes

#### Tier 1 — Early Game (Niveaux 1-4)

| Quête                    | Objectif                            | Récompense                                     |
| ------------------------ | ----------------------------------- | ---------------------------------------------- |
| **Premier pas**          | Construire ou améliorer 2 bâtiments | 800 bois + 800 pierre + 600 fer                |
| **Défenseur du royaume** | Repousser 1 raid barbare            | 1,000 bois + 800 pierre + 800 fer              |
| **Pilleur novice**       | Piller 3 villages barbares          | 700 bois + 700 pierre + 700 fer + 50 Couronnes |
| **Recrutement massif**   | Entraîner 20 unités                 | 900 bois + 900 pierre + 800 fer                |

#### Tier 2 — Mid Game (Niveaux 5-7)

| Quête                     | Objectif                                    | Récompense                                            |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| **Expansion stratégique** | Améliorer le Château d'1 niveau             | 1,500 bois + 1,800 pierre + 1,200 fer                 |
| **Raid du jour**          | Piller 5 villages barbares (min 2,000 loot) | 2,000 bois + 1,500 pierre + 1,500 fer + 100 Couronnes |
| **Armée du peuple**       | Entraîner 40 population d'unités            | 1,800 bois + 1,800 pierre + 2,000 fer                 |
| **Forteresse imprenable** | Améliorer Wall ou Watchtower de 2 niveaux   | 1,400 bois + 2,000 pierre + 1,100 fer                 |

#### Tier 3 — Late Game (Niveaux 8-10)

| Quête                 | Objectif                                     | Récompense                                            |
| --------------------- | -------------------------------------------- | ----------------------------------------------------- |
| **Domination totale** | Piller 10 villages barbares (min 5,000 loot) | 3,000 bois + 2,500 pierre + 3,000 fer + 200 Couronnes |
| **Conquérant**        | Conquérir 1 village barbare                  | 4,000 bois + 3,500 pierre + 3,500 fer + 500 Couronnes |
| **Architecte royal**  | Améliorer 3 bâtiments d'1 niveau             | 2,800 bois + 3,200 pierre + 2,500 fer                 |
| **Légion d'élite**    | Entraîner 100 population d'unités            | 3,500 bois + 3,000 pierre + 4,000 fer                 |

#### Tier VIP — Hebdomadaire (Dimanche)

| Quête                  | Objectif                             | Récompense                                              |
| ---------------------- | ------------------------------------ | ------------------------------------------------------- |
| **Seigneur de guerre** | Gagner 15 combats (défense/attaque)  | 5,000 bois + 5,000 pierre + 5,000 fer + 1,000 Couronnes |
| **Maître bâtisseur**   | Construire ou améliorer 10 bâtiments | 6,000 bois + 6,000 pierre + 4,000 fer                   |
| **Roi des pillards**   | Piller 50,000 ressources totales     | 7,000 bois + 6,000 pierre + 7,000 fer + 2,000 Couronnes |

### Impact Économique

| Source                 | Ressources/jour | Contribution |
| ---------------------- | --------------- | ------------ |
| **Production passive** | ~24,000         | 50%          |
| **Pillage actif**      | ~24,000         | 50%          |
| **Quête quotidienne**  | ~5,000-10,000   | **+10-15%**  |

> 🎯 **Objectif** : Créer une habitude quotidienne gratifiante sans déséquilibrer l'économie. La quête accélère légèrement la progression tout en valorisant le jeu actif.

---

### 📊 Phases de Progression

La progression suit un modèle non-linéaire inspiré de Clash of Clans, avec trois phases distinctes :

#### **Early Game (Niveaux 1-3)** — Découverte

- **Objectif** : Hook rapide, apprentissage des mécaniques
- **Temps de construction** : Quelques minutes à 1 heure
- **Production** : ~200 ressources/h (6 mines level 2-3)
- **Gameplay** : Construction rapide, premiers raids, découverte du monde

#### **Mid Game (Niveaux 4-7)** — Développement

- **Objectif** : Compréhension profonde, stratégie émergente
- **Temps de construction** : 2-6 heures par upgrade
- **Production** : ~800 ressources/h (6 mines level 5-6)
- **Gameplay** : Pillage devient rentable (+50% ressources), gestion population, choix stratégiques

#### **Late Game (Niveaux 8-10)** — Prestige

- **Objectif** : Grind, optimisation, conquête
- **Temps de construction** : 8-24 heures par upgrade
- **Production** : ~2,000 ressources/h (6 mines level 8-10)
- **Gameplay** : Pillage nécessaire (+100% ressources), multi-village, domination

---

### 💰 Économie Équilibrée : Production vs Pillage

**Principe fondamental** : Production passive et Pillage sur un pied d'égalité (50/50)

| Source                       | Contribution            | Impact                                 |
| ---------------------------- | ----------------------- | -------------------------------------- |
| **Production passive**       | ~54,000 ressources/jour | Baseline, permet progression constante |
| **Pillage actif**            | ~54,000 ressources/jour | Double la vitesse de progression       |
| **Raids barbares défensifs** | Bonus légers            | Récompenses si défense réussie         |

> 💡 **Note** : Un joueur qui pille activement (10-15 raids/jour) se développera **2× plus vite** qu'un joueur passif.

**Stratégie de pillage optimal** :

- 20 Cavaliers + 10 Écuyers = ~2,500 capacité de loot/raid
- 10 raids/jour = +25,000 ressources supplémentaires

---

### 📐 Formules de Progression

#### **Production de ressources (Bois/Pierre/Fer)**

```
Production_niveau_n = 50 × (1.4 ^ (n-1))
```

| Niveau | Production/h | Production/jour |
| ------ | ------------ | --------------- |
| 1      | 50           | 1,200           |
| 3      | 100          | 2,400           |
| 5      | 190          | 4,560           |
| 7      | 375          | 9,000           |
| 10     | 1,035        | 24,840          |

#### **Coûts d'upgrade des bâtiments**

Les coûts suivent une progression exponentielle adaptée à la catégorie :

| Catégorie                   | Formule de base               | Multiplicateur |
| --------------------------- | ----------------------------- | -------------- |
| **Château**                 | 250 × (1.17 ^ (n-1))          | 1.17           |
| **Production (Mines)**      | 150 × (1.20 ^ (n-1))          | 1.20           |
| **Militaire (Caserne)**     | 400 × (1.18 ^ (n-1))          | 1.18           |
| **Stockage (Entrepôt)**     | 150 × (1.15 ^ (n-1))          | 1.15           |
| **Stratégique (Farm/Tour)** | 180-350 × (1.18-1.19 ^ (n-1)) | 1.18-1.19      |
| **Défense (Wall)**          | 2000 × (1.25 ^ (n-1))         | 1.25           |
| **Espionnage (Hideout)**    | 300 × (1.30 ^ (n-1))          | 1.30           |

#### **Distribution des ressources par type de bâtiment**

Chaque bâtiment consomme les ressources selon sa spécialisation :

| Type                           | Bois | Pierre | Fer |
| ------------------------------ | ---- | ------ | --- |
| **Château/Défense/Tour**       | 25%  | 50%    | 25% |
| **Militaire (Caserne)**        | 30%  | 30%    | 40% |
| **Production Bois**            | 50%  | 30%    | 20% |
| **Production Pierre**          | 30%  | 50%    | 20% |
| **Production Fer**             | 25%  | 25%    | 50% |
| **Économique (Farm/Entrepôt)** | 40%  | 35%    | 25% |
| **Espionnage (Hideout)**       | 35%  | 35%    | 30% |

> 💡 **Principe** : Chaque mine coûte plus cher dans la ressource qu'elle produit, créant un équilibre naturel.

#### **Temps de construction**

```
Temps_niveau_n = Temps_base × (multiplicateur ^ (n-1)) × Bonus_château
```

| Catégorie   | Temps base | Multiplicateur |
| ----------- | ---------- | -------------- |
| Château     | 180s       | 2.0            |
| Production  | 120s       | 1.8            |
| Militaire   | 600s       | 1.7            |
| Stockage    | 300s       | 1.6            |
| Stratégique | 400-500s   | 1.7-1.8        |

**Bonus Château** : Réduction de 4% par niveau (max -40% à niveau 10)

---

### ⚖️ Système de Poids (Puissance)

Le poids des bâtiments reflète leur coût cumulé et leur importance stratégique :

```
Poids = (Coût_cumulé_level_10 / 500) × Multiplicateur_stratégique
```

| Bâtiment                | Poids/niveau | Multiplicateur | Logique                        |
| ----------------------- | ------------ | -------------- | ------------------------------ |
| Château                 | 40           | 1.5×           | Cœur du village                |
| Wall                    | 38           | 1.3×           | Défense massive (coûts élevés) |
| Caserne                 | 35           | 1.2×           | Militaire offensif             |
| Tour de guet            | 30           | 1.3×           | Vision stratégique             |
| Hideout                 | 28           | 1.2×           | Renseignement                  |
| Farm                    | 25           | 1.0×           | Population = stratégique       |
| Entrepôt                | 20           | 1.0×           | Support économique             |
| Mines (Bois/Pierre/Fer) | 15           | 1.0×           | Production basique             |

---

### 🎮 Paliers de Déblocage (Château)

Le niveau du Château détermine l'accès aux autres bâtiments, créant des objectifs intermédiaires :

| Niveau Château | Déblocage                                 |
| -------------- | ----------------------------------------- |
| **1**          | Mines (Bois, Pierre, Fer), Entrepôt, Farm |
| **2**          | **Caserne** (militaire de base)           |
| **3**          | **Tour de guet** (exploration carte)      |
| **4**          | **Hideout**                               |
| **5**          | **Wall** (défense avancée)                |
| **6**          | **Salle du Conseil** (stratégie)          |
| **7**          | **Salle du Trône** (conquête, seigneurs)  |

---

### 📈 Validation Économique : Exemple de Progression

**Joueur type — 1 mois pour maxer un village :**

#### Semaine 1 (Early game — niveaux 1-3)

- Production : ~200 ressources/h
- Temps construction : 10-60 min/upgrade
- Objectif : Débloquer Caserne, premiers raids
- **Temps effectif : 15-20 heures**

#### Semaines 2-3 (Mid game — niveaux 4-7)

- Production : ~800 ressources/h
- Temps construction : 2-6h/upgrade
- Pillage : +50% ressources
- **Temps effectif : 30-40 heures**

#### Semaine 4 (Late game — niveaux 8-10)

- Production : ~2,000 ressources/h
- Temps construction : 8-24h/upgrade
- Pillage : +100% ressources (nécessaire)
- **Temps effectif : 40-50 heures**

**Total : ~100 heures / 30 jours = 3-4h/jour** ✅

---

### 🔑 Principes d'Équilibrage

| Principe                              | Application                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| **Aucune ressource plus rare**        | Bois = Pierre = Fer (production identique)                     |
| **Progression exponentielle**         | Chaque niveau est significativement plus long que le précédent |
| **Pillage récompensé**                | Joueur actif progresse 2× plus vite                            |
| **Population = limiteur stratégique** | Trade-off permanent : armée vs infrastructure                  |
| **Arrondis au multiple de 5**         | Lisibilité et clarté des valeurs                               |
| **Distribution spécialisée**          | Chaque bâtiment consomme plus de sa ressource thématique       |
| **Paliers de déblocage**              | Objectifs intermédiaires clairs (Château 2, 3, 4, 5, 6, 7)     |

---

## Philosophie de Design Final

> "Chaque joueur dirige un royaume vivant.
> Ses choix façonnent l'histoire de ses villages,
> pas à travers des chiffres, mais à travers des décisions lisibles, gratifiantes et visibles."
