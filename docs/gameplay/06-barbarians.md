# Villages barbares

Vision design des **villages barbares** : leurs principes, leur cycle de vie, leur rôle dans la boucle militaire du joueur.

> ⚠️ Ce doc traite uniquement des **villages barbares** (entités neutres sur la carte du monde, attaquables et pillables). Le **raid barbare global** (événement serveur subi par le joueur tous les 3 à 5 jours) est documenté dans [`05-events-and-retention.md`](./05-events-and-retention.md#raids-barbares-globaux). Ce sont deux mécaniques distinctes.

## Identité

Les villages barbares sont des **mini-joueurs IA** persistants sur la carte. Ils possèdent leurs propres mines, leur caserne et leur armée, et fonctionnent globalement comme un village joueur — sans connexion humaine derrière. C'est leur identité de fond : **ce ne sont pas des coffres au trésor avec une étiquette de difficulté, ce sont des adversaires**.

| Trait | Valeur |
| --- | --- |
| Tiers | 5 (T1 → T5) |
| Compo d'armée | Blueprint à **diversité progressive** selon le tier (cf. § Blueprint d'armée) |
| Effet du tier | Quantité totale (×10 entre T1 et T5) **et** nombre de types d'unités |
| Initiative | ❌ **Aucune au MVP** — les villages barbares ne lancent pas d'attaques (cf. [§ Initiative barbare au MVP](#initiative-barbare-au-mvp)) |
| Riposte automatique au pillage | ❌ Aucune — le joueur garde l'initiative |
| Conquête par le joueur | ✅ Oui — spec dédiée [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) |
| Style stratégique | ❌ Aucun — réservé aux villages joueurs (cf. [`12-village-styles.md`](./12-village-styles.md)) |

## Blueprint d'armée

Le tier détermine **deux choses** : la quantité totale d'unités, **et** le nombre de types disponibles. Un T1 est un campement basique (que des miliciens) ; un T5 est une garnison complète. Le blueprint est calé sur les unités de base et défensives — pas de CAVALIER, BÉLIER, CATAPULTE, ESPION ou SEIGNEUR (cf. catalogue [`08-units.md`](./08-units.md)).

### Diversité par tier

| Tier | Types présents | Lecture narrative |
| ---: | --- | --- |
| T1 | MILICE seul | Simple campement de paysans armés |
| T2 | + ARCHER | Avant-poste : la garde tire à distance |
| T3 | + ÉCUYER | Garnison structurée, infanterie avancée |
| T4 | + TEMPLIER | Forteresse barbare, tank de garnison |
| T5 | (idem T4) | Garnison maximale — quantité massive sur la compo complète |

🎯 **Intention** : la diversité progressive donne une **identité par tier** au-delà du simple "plus d'unités". Un joueur très early-game (caserne 1, MILICE seul) peut affronter un T1 à compo équivalente — la leçon de combat est juste, pas brutale. Plus haut, l'apparition de l'ARCHER puis du TEMPLIER force une vraie réflexion sur la compo offensive.

### Proportions et quantités par tier

Pour les tiers qui contiennent un type donné, les proportions relatives restent **stables** : 60 % MILICE / 25 % ARCHER / 10 % ÉCUYER / 5 % TEMPLIER. Pour un tier qui ne contient qu'une partie du blueprint, on **normalise** la part des types présents.

| Tier | Total max | MILICE | ARCHER | ÉCUYER | TEMPLIER |
| ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | 15 | 15 | — | — | — |
| T2 | 35 | 25 | 10 | — | — |
| T3 | 70 | 44 | 18 | 8 | — |
| T4 | 110 | 66 | 28 | 11 | 5 |
| T5 | 150 | 90 | 38 | 15 | 7 |

> 💡 Les valeurs ci-dessus sont **fixes par tier** : tous les T3 du monde naissent avec exactement 70 unités max (44/18/8). La pente totale T1→T5 ≈ ×10 ; T4 et T5 partagent la même compo relative, T5 vaut surtout par sa **masse**.

### Sources de variabilité entre deux villages d'un même tier

Bien que le plafond soit identique, **deux villages du même tier ne sont jamais dans le même état** au moment où le joueur les examine :

- **Stock initial de troupes et de ressources** rollé à la création dans une fourchette du max/cap (un T3 fraîchement né peut être presque plein, à moitié, ou faible).
- **Historique de pillage** : combien d'unités ont été tuées et combien de ressources volées par d'autres joueurs depuis sa création.
- **Phase de régénération courante** : un village récemment vidé est mou pendant plusieurs jours.

🎯 **Intention** : la variabilité vient de l'**état actuel**, pas du **plafond théorique**. Le scout reste utile pour photographier la cible au moment T, et le tier reste un indicateur fiable de difficulté maximale.

## Génération

Les villages barbares sont **générés à l'arrivée d'un nouveau joueur** dans le monde, autour de sa zone de spawn. **Pas** de pool fixe au lancement du monde, **pas** de spawn aléatoire au fil du temps déconnecté des joueurs. La règle de fond : un joueur qui rejoint un monde trouve toujours des cibles barbares à proximité, mais sans submerger le monde global.

L'algorithme de génération doit donc s'adapter à **deux variables vivantes** : le volume de barbares déjà présents dans la zone, et le volume de joueurs voisins. Spec dédiée : [`07-barbarian-spawning.md`](./07-barbarian-spawning.md).

À la création d'un village barbare (par cet algorithme) :

- **Max d'unités fixé par le tier** (cf. § Blueprint d'armée). Ce nombre est le **plafond durable** du village : il ne sera jamais dépassé.
- **Roll d'un stock initial de troupes** : **60 à 100 %** du max. Les proportions du blueprint restent respectées — on roll la valeur totale puis on applique les % par type. Logique : un campement naît armé, mais pas systématiquement plein.
- **Roll d'un stock initial de ressources** : **30 à 100 %** du cap stockage du tier. Fourchette plus large que les troupes — un village peut avoir épuisé son stock par dépense interne, ou être intact. Le loot du premier raid est donc imprévisible.
- Les deux rolls sont **indépendants** : un village peut naître armé mais avec peu de stock, ou inversement (cohérent avec la régen ressources ×2 plus rapide que les troupes).
- Les bâtiments internes (mines, caserne) sont implicites : ils servent à **justifier la régénération** et à fixer le **cap stockage** du village. Le joueur n'interagit pas avec eux directement, et un village barbare n'a **pas de [puissance](./09-power-and-rankings.md)** tant qu'il reste barbare — elle n'est calculée qu'à la **conquête**, une fois les bâtiments matérialisés (cf. § Questions ouvertes).

### Cap stockage par tier

Aligné sur le **niveau modeste des bâtiments barbares**. Un village barbare est narrativement **primitif** (campement de gens pas très organisés) — ses bâtiments internes restent bas niveau, et le cap stockage suit. Le mapping reprend les capacités de l'Entrepôt joueur (cf. [`03-buildings.md` § Entrepôt](./03-buildings.md#entrepôt-warehouse)) à des niveaux faibles :

| Tier | Niveau Entrepôt équivalent | Capacité / ressource |
| --- | --- | --- |
| T1 | 1 | 3 000 |
| T2 | 1 | 3 000 |
| T3 | 2 | 3 450 |
| T4 | 3 | 3 970 |
| T5 | 4 | 4 565 |

> 💡 Pente T5/T1 ≈ ×1,5 sur le stockage, contre ×10 sur les troupes. Loot max d'un T5 ≈ 13 700 cumulés. Cohérent narrativement : les barbares sont des guerriers primitifs, pas des marchands ; leur village vaut surtout par son armée et l'**emplacement** qu'il représente une fois conquis.

Ce mapping est **le même** que celui utilisé pour la matérialisation des bâtiments à la conquête (cf. [`13-barbarian-conquest.md`](./13-barbarian-conquest.md)) — un barbare conserve ses bâtiments à leur niveau primitif quand il bascule en village joueur.

**Conséquence design** : deux villages T3 voisins ne sont pas identiques. Le scout devient utile pour identifier les cibles juteuses dans un même tier.

## Distribution sur la carte

Distribution **concentrique** autour des spawns joueurs :

| Zone | Densité de tiers |
| --- | --- |
| Proche des spawns | T1-T2 abondants — zone d'apprentissage |
| Couronne intermédiaire | T3 dominants |
| Centre / zones contestées | T4-T5 rares — zones de dispute haut niveau |

🎯 **Intention** : créer une montée en puissance naturelle. Le joueur apprend à attaquer sur les T1-T2 sans risque excessif, puis doit s'aventurer plus loin pour trouver des cibles plus rentables, ce qui amène mécaniquement le contact PvP.

## Régénération

Deux flux indépendants : **troupes** et **ressources**.

### Troupes — % horaire du max initial du village

| Tier | Régen / h |
| --- | --- |
| T1 | 0,5 % |
| T2 | ~0,6 % |
| T3 | ~0,75 % |
| T4 | ~0,9 % |
| T5 | 1 % |

> 💡 Les chiffres intermédiaires (T2-T4) sont indicatifs. La courbe doit rester **minime** pour qu'un village barbare ne soit jamais "constamment plein", sinon le pillage perd toute friction. Ordre de grandeur : entre 100 h et 200 h pour repasser de 0 à plein.

### Ressources — % horaire du cap stockage du tier

**Découplé** des troupes : les ressources reviennent **plus vite** (≈ ×2 le rythme des troupes au même tier). Un barbare redevient farmable pour le loot **avant** de redevenir dangereux militairement.

| Tier | Régen ressources / h | Temps cap vide → plein |
| --- | --- | --- |
| T1 | 1 % | ~100 h (~4 j) |
| T2 | ~1,25 % | ~80 h (~3,3 j) |
| T3 | ~1,5 % | ~67 h (~2,8 j) |
| T4 | ~1,75 % | ~57 h (~2,4 j) |
| T5 | 2 % | ~50 h (~2 j) |

🎯 **Intention** : créer une rotation vivante de cibles. Le joueur peut revenir tirer du loot sur un village dont il a vidé l'armée, sans que la cible redevienne immédiatement menaçante. Sur un T5 vidé, le loot redevient pleinement intéressant en ~2 jours alors que l'armée met ~4 jours à revenir.

> 💡 Les chiffres intermédiaires (T2-T4) sont indicatifs et seront affinés à la simulation. Les bornes T1 = 1 %/h et T5 = 2 %/h sont les ancres design.

### Vidage total

Si le joueur vide complètement un village (zéro troupes, zéro ressources), il **ne respawn pas**. Pas de floor magique, pas de reset automatique. La régen lente continue normalement, et le village reste "mou" plusieurs jours.

🎯 **Intention** : créer une vraie **décision** au moment de l'attaque. Vider un T5 maintenant = gros loot immédiat mais cible morte longtemps. Écrémer = loot moindre mais re-raid possible bientôt.

**Pas de suppression auto** : un village barbare vidé reste sur la carte **indéfiniment**, même s'il reste 0/0 longtemps. La régen lente (cf. § Régénération naturelle) finit toujours par le remplir. Pas de pollution carte attendue : le faible volume de villages parfaitement à 0/0 + la régen naturelle suffisent. Si l'observation playtest révèle de l'accumulation, on rouvrira en post-MVP avec un délai (7-14 j sans activité = suppression).

## Lisibilité joueur

Sur la carte du monde, un village barbare affiche son tier sans révéler son contenu :

| Élément | Visible sur la carte | Visible après scout |
| --- | --- | --- |
| Tier (1 à 5) | Sprite + couleur (lecture visuelle). Label texte au clic seulement. | — |
| Nom / propriétaire | ✅ — "Village barbare" générique | — |
| Composition d'armée | ❌ | ✅ |
| Stock de ressources | ❌ | ✅ |

**Affichage du tier** :

| Surface | Quoi est visible |
| --- | --- |
| Carte tactique (vue principale) | Sprite + couleur du village barbare (différenciation visuelle). Pas de label texte. |
| Au clic sur le village | Le label texte explicite "Tier N" apparaît dans le panneau d'info. |
| Mini-map monde | Aucune info de tier — un village barbare y est juste un point. |

**Brief sprites — 5 variantes d'un même asset de base** :

Décision design : un **sprite de base unique** (campement barbare paléo) + 5 variantes progressives qui ajoutent des accents narratifs et une palette de couleurs croissante en intensité.

| Tier | Variantes ajoutées par-dessus la base | Lecture au coup d'œil |
| ---: | --- | --- |
| T1 | Sprite de base nu — quelques tentes / huttes en bois brut | "Campement de paysans armés" |
| T2 | + palissade légère + petit feu de camp | "Avant-poste organisé" |
| T3 | + watchtower en bois + bannière simple | "Garnison structurée" |
| T4 | + donjon en pierre + multiples bannières | "Forteresse barbare" |
| T5 | + remparts + bannières héraldiques + accents dorés | "Garnison maximale" |

**Palette de couleurs** : escalade en intensité du tier, du **gris-marron** (T1) au **rouge-or sombre** (T5). Le rouge signale la menace au premier coup d'œil sur la carte.

**Avantages** :
- **Cohérence narrative** : c'est le même type de campement qui se développe, pas 5 entités différentes.
- **Coût de production réduit** : un seul asset de base + couches d'accents → 5 sprites cohérents.
- **Animations partagées** : si on anime le campement plus tard (fumée du feu, mouvement des bannières), une seule logique pour les 5 tiers.

> 💡 Le tier renseigne sur le **plafond** du village, pas sur son **état actuel**. Un T5 récemment vidé est moins dangereux qu'un T3 plein. C'est précisément pour ça que le scout est utile.

### Rapport de combat

L'information révélée à l'issue d'une attaque dépend du résultat. La règle de fond : **un rapport détaillé suppose qu'au moins une troupe attaquante revienne pour témoigner**. Si tout meurt, il n'y a personne pour ramener l'info.

| Issue de l'attaque | Affiché dans le rapport |
| --- | --- |
| **Victoire (au moins une troupe survit)** | Tout : tier, troupes barbares rencontrées, troupes perdues côté attaquant, ressources volées, ressources restantes dans le village. Le combat agit alors comme un **scout a posteriori** : la prochaine attaque part avec une vraie photo de la cible. |
| **Défaite (toutes les troupes attaquantes mortes)** | Tier uniquement + troupes perdues par l'attaquant (= toutes celles envoyées). Aucune info sur la composition barbare ni sur les ressources. |

🎯 **Intention** : la défaite a une vraie pénalité informationnelle, en plus de la perte de troupes. Le joueur qui sous-estime un tier ne saura même pas pourquoi il a perdu — ce qui donne du poids au scout préalable et à une attaque mesurée.

## Boucle gameplay

Cycle d'engagement type d'un joueur avec les villages barbares :

```
1. Découverte    → expansion vision (Watchtower) → repère des cibles par tier
2. Sélection    → choisit un tier accessible à son armée actuelle
3. Scout (opt.)  → connaît la compo et le stock avant attaque
4. Attaque      → engage avec une compo adaptée, accepte des pertes réelles
5. Loot         → ramène des ressources, accélère sa progression économique
6. Rotation     → le village vidé se reconstitue lentement, joueur change de cible
7. Montée       → progresse vers les tiers supérieurs au fil du développement
```

🎯 **Intention** : que **chaque attaque demande de réfléchir** (compo, cible, timing) — c'est la profondeur de décision —, **et** que **le joueur explore la carte au fil des sessions** — c'est la rotation. Les deux ont été identifiées comme priorités rétention.

## Initiative barbare au MVP

**Décision** : ❌ **OFF au MVP**. Les villages barbares ne lancent **aucune attaque** sur les joueurs. Ils restent des cibles passives (raid pour piller, conquête pour annexer).

**Pression défensive du joueur, sans initiative barbare** :
- **Raids barbares globaux** (événement, 3-5 jours) — cf. [`05-events-and-retention.md`](./05-events-and-retention.md). Vague d'attaques mondiales, à durée limitée.
- **PvP** entre joueurs — la principale source de menace défensive du MVP (raids, conquêtes).
- **Vautour PvP autour des conquêtes** — un voisin opportuniste peut frapper la garnison fraîchement installée pendant la fenêtre de capture (cf. [`14-pvp-conquest.md` § Cooldown de re-conquête](./14-pvp-conquest.md#3-cooldown-de-re-conquête)).

🎯 **Lecture design** : ajouter une initiative barbare propre demande de trancher 3 dimensions (déclencheurs, choix de cible, calage fréquence) qui interagissent avec le PvP émergent. Au MVP on observe d'abord la pression défensive PvP réelle ; si elle s'avère insuffisante, on rouvrira le sujet en post-MVP avec un bon réflexe sur les paramètres.

> 🔓 **Statut** : décision MVP stable — pas une dette à reprendre dans la fenêtre actuelle. Le sujet pourra être rouvert si le playtest révèle un manque de pression défensive sur les joueurs isolés.

## Questions ouvertes

### Détails UX

(Plus de questions ouvertes au MVP — voir § Lisibilité joueur > Brief sprites pour la spec d'asset.)

## Liens

- [`01-overview.md`](./01-overview.md) — vision globale du monde et des boucles.
- [`02-economy-and-progression.md`](./02-economy-and-progression.md) — équilibre 50/50 production/pillage qui justifie le rôle des barbares.
- [`04-combat.md`](./04-combat.md) — mécanique de combat appliquée aux raids barbares.
- [`08-units.md`](./08-units.md) — catalogue des unités (source du blueprint d'armée barbare).
- [`05-events-and-retention.md`](./05-events-and-retention.md) — raid barbare **global** (événement, à ne pas confondre avec les villages barbares).
- [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — algorithme de génération adaptatif des villages barbares (à rédiger).
- [`10-conquest.md`](./10-conquest.md) — règles communes de conquête (Seigneur, période de capture variable, garde-fous globaux).
- [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) — spec complète de la conquête barbare (matérialisation, niveaux, stock).
- [`11-scouting.md`](./11-scouting.md) — mécanique de scout (ESPION), feature transversale appliquée aux barbares pour révéler troupes et ressources cachées.
- [`audit/01-barbarian-raids-no-risk.md`](./audit/01-barbarian-raids-no-risk.md) — constat à l'origine de cette spec.
