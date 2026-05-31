# Bâtiments

Catalogue des 12 bâtiments du village — **rôle, mécaniques, déblocages, effets stratégiques**. Niveau max = **10** pour tous (rationale + comparatif Century Games dans [`architecture/decisions.md` § ADR-14](../architecture/decisions.md#adr-14--niveau-max--10-pour-tous-les-bâtiments-vs-courbe--façon-century-)). Déblocages liés au niveau du Château (cf. [`02-economy-and-progression.md` § Paliers](./02-economy-and-progression.md#paliers-de-déblocage-château)).

> 📌 **Les valeurs numériques (coûts, temps, population, capacités, productions, vision, bonus de vitesse) vivent dans `packages/shared/src/village/buildings.ts`** — source de vérité unique. Cette doc ne les duplique volontairement pas pour éviter la dérive (cf. [`AGENTS.md` § docs](../../AGENTS.md)). Pour les vérifier ou les modifier, ouvrir `BUILDING_DEFINITIONS`, `CASTLE_CONSTRUCTION_SPEED_BONUS`, `WATCHTOWER_VISION_LEVELS` directement.

## Vue d'ensemble

| Bâtiment | Rôle principal | Effet passif par niveau | Poids | Statut MVP |
| --- | --- | --- | --- | --- |
| 🏰 [**Château**](#château-castle) | Cœur du village | +vitesse construction, débloque autres bâtiments | 40 | ✅ Actif |
| 🪓 [**Camp de bûcherons**](#camp-de-bûcherons-wood) | Produit du bois | +production bois | 15 | ✅ Actif |
| ⛏️ [**Carrière**](#carrière-stone) | Produit de la pierre | +production pierre | 15 | ✅ Actif |
| ⚒️ [**Mine de fer**](#mine-de-fer-iron) | Produit du fer | +production fer | 15 | ✅ Actif |
| 🏣 [**Entrepôt**](#entrepôt-warehouse) | Stockage | +capacité max ressources | 20 | ✅ Actif |
| 🏘️ [**Quartier**](#quartier-quarter) | Population | +population max | 25 | ✅ Actif |
| ⚔️ [**Caserne**](#caserne-barracks) | Entraînement unités | +vitesse entraînement, débloque unités | 35 | ✅ Actif |
| 🔭 [**Tour de guet**](#tour-de-guet-watchtower) | Vision carte | +rayon visibilité monde | 30 | ✅ Actif |
| 🕯️ [**Salle du Conseil**](#salle-du-conseil) | Choix de [style stratégique de village](./12-village-styles.md) | (1 niveau, débloque le choix) | 25 | ✅ Actif |
| 👑 [**Salle du Trône**](#salle-du-trône) | Recrutement du [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles) (conquête) | (1 niveau MVP, débloque le recrutement) | 35 | ✅ Actif |
| 🧱 [**Rempart**](#rempart-wall) | Défense passive | +défense globale village | 38 | ⏸️ Désactivé MVP |
| 🕵️ [**Cachette**](#cachette-hideout) | Espionnage | (prévu : capacité espion) | 28 | ⏸️ Désactivé MVP |

## Mécanique de construction

- **File d'attente** : `MAX_CONSTRUCTION_QUEUE` upgrades simultanés (3 au MVP).
- **Consommation de population** : chaque upgrade occupe de la population (récupérée si annulé ou détruit).
- **Annulation** : remboursement complet des ressources et de la population.
- **Bonus Château** : à partir du niveau 2, le Château réduit le temps de construction global (`CASTLE_CONSTRUCTION_SPEED_BONUS`). Le facteur s'applique à toutes les nouvelles constructions du village.
- **Tempo monde** : toutes les durées sont multipliées par `WorldConfig.tempo.constructionSpeed` (à défaut `tempo.global`). Cf. [`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md).
- **Coûts ressources** : les coûts sont calibrés comme une fraction significative de la capacité d'Entrepôt atteignable au palier concerné. Un upgrade doit rester stockable, mais ne doit plus représenter un coût négligeable face au plafond de stockage.

## Courbe de progression

La courbe walled-v1 (cf. ADR-14, recalibrée par [ADR-15](../architecture/decisions.md#adr-15--recalibration-courbe-construction--max-village-78-j-via-bonus-château-renforcé)) suit trois phases marquées :

- **L1-L5 (early)** : secondes → minutes. Onboarding mobile, première dopamine compressée.
- **L6-L7 (premier wall)** : minutes → heures. Marque l'entrée du « vrai jeu », alignée avec la conquête (Château 6 = Salle du Trône).
- **L8-L10 (wall final)** : heures → jours. Réservé aux profils « tall » (max village). En ressources passives seules, un village max demande ~35-36 j ; le pillage sert à compresser fortement ce délai (cf. [`00-game-flow.md`](./00-game-flow.md)). Le dernier palier du Château (9→10) ≈ 18 h de construction, mais ≈35 h de production passive sur la ressource limitante.

Cette stratification crée naturellement les profils joueur **tall / wide / army-focused / defensive** (cf. ADR-14) sans cap dur.

---

## Château (Castle)

**Cœur du village.** Détermine l'accès aux autres bâtiments et accélère la construction.

### Déblocages

| Niveau Château | Bâtiments déverrouillés |
| --- | --- |
| 1 | Mines (Bois, Pierre, Fer), Entrepôt, Quartier |
| 2 | +Caserne |
| 3 | +Tour de guet |
| 4 | +Salle du Conseil _(Hideout prévu post-MVP)_ |
| 5 | _(Wall prévu post-MVP — palier libre au MVP)_ |
| 6 | +Salle du Trône _(entrée end-game — débloque la conquête)_ |
| 7 | _(palier libre au MVP)_ |

> 💡 Le Château est le **bâtiment le plus influent pour la [puissance](./09-power-and-rankings.md)** (poids 40 constant). Il porte aussi le bonus de vitesse de construction (cf. `CASTLE_CONSTRUCTION_SPEED_BONUS` dans `packages/shared/src/village/buildings.ts`).

---

## Camp de bûcherons (Wood) / Carrière (Stone) / Mine de fer (Iron)

**Production passive** de la ressource éponyme. Mêmes mécaniques pour les trois mines, coût principal inversé selon la ressource produite. Niveau requis : Château 1.

- Production accumulée en arrière-plan, **plafonnée par la capacité de l'Entrepôt**.
- Taux modulé par `WorldConfig.tempo.resourceProduction` (cf. doc 23).
- Production cumulative par niveau : voir constantes `packages/shared/src/economy/` (ou `BUILDING_DEFINITIONS.WOOD/STONE/IRON.levels[n]` selon l'évolution).

---

## Entrepôt (Warehouse)

**Capacité de stockage** des trois ressources (bois/pierre/fer). Plafond commun par ressource. Niveau requis : Château 1.

> 💡 Le stockage **plafonne la production** : si l'entrepôt est plein, les mines arrêtent de produire. Les conquêtes héritent du niveau de l'Entrepôt mais reset le stock (cf. [`14-pvp-conquest.md` § Bâtiments hérités](./14-pvp-conquest.md#bâtiments-hérités)).

---

## Quartier (Quarter)

**Limite de population** du village — workforce pour bâtiments et armée. Niveau requis : Château 1. Représente l'extension du tissu urbain (foyers, habitations) du village.

> 💡 Pop partagée entre **bâtiments** (occupation permanente, récupérée si annulé/détruit) et **unités** (consommation à l'entraînement, libérée à la mort). Cf. [`02-economy-and-progression.md` § Population](./02-economy-and-progression.md#population).

---

## Caserne (Barracks)

**Entraînement militaire.** Niveau requis : Château 2.

### Unités déverrouillées

| Niveau | Unités déverrouillées |
| --- | --- |
| 1 | MILITIA (infanterie de base) |
| 2 | SQUIRE (infanterie avancée) |
| 3 | WARRIOR + ARCHER + SPY |
| 4 | TEMPLAR (chevalier lourd) |
| 5 | CAVALIER |
| 7 | BÉLIER (siège) |
| 8 | CATAPULTE (siège) |

La Caserne porte aussi une **réduction du temps d'entraînement** par niveau (cf. constantes shared). Détails des unités : [`08-units.md`](./08-units.md).

---

## Tour de guet (Watchtower)

**Rayon de visibilité** sur la carte du monde. Niveau requis : Château 3. Valeurs exactes (rayon par niveau) dans `WATCHTOWER_VISION_LEVELS` (`packages/shared/src/village/buildings.ts`).

- Vision = **union des disques** de toutes les Watchtower du joueur. Aucune tour seule ne révèle toute la carte.
- Vision **offensive/exploratoire uniquement** — n'augmente pas la défense (voir Rempart, post-MVP).
- La Watchtower niveau 1 doit révéler au moins une cible barbare T1 créée pour le joueur fraîchement arrivé (invariant d'onboarding : cible visible et attaquable sans brouillard). La portée reste finie ; les niveaux suivants élargissent progressivement le disque sans révélation globale.

### Effet sur le brouillard de guerre

Hors du rayon, les villages voisins (joueurs + barbares) apparaissent comme un **blip anonyme** — un point gris non-cliquable, sans owner, niveau ou nom. Le joueur sait qu'une entité existe mais pas ce que c'est. Même au niveau 10, le brouillard reste présent hors du disque de vision.

La vision large doit venir de la **position des villages** : conquérir un village avancé puis y développer une Tour de guet ouvre un nouveau disque de vision. La Watchtower devient donc un outil de contrôle territorial, pas un bouton de révélation globale.

Les **expéditions** sont visibles uniquement dans le rayon ; hors vision, elles sont invisibles (pas de blip pour elles, par simplification volontaire).

Vue d'ensemble du système d'exploration : [`01-overview.md`](./01-overview.md#exploration--brouillard-de-guerre). Implémentation server-side : [`architecture/decisions.md` § ADR-11](../architecture/decisions.md#adr-11--brouillard-de-guerre-server-authoritative).

---

## Salle du Conseil

**Bâtiment administratif** qui débloque le choix de [style stratégique de village](./12-village-styles.md). Niveau requis : Château 4.

Particularité : **bâtiment simple à 1 seul niveau** — pas d'upgrade infini, un coût unique pour débloquer la mécanique de choix de style. Le coût des **changements de style** ultérieurs est défini dans [`12-village-styles.md` § Coûts de changement](./12-village-styles.md#coûts-de-changement-de-style).

### Effet

- Permet au joueur de **choisir le style stratégique** du village depuis l'UI.
- Aucun bonus passif intrinsèque (le bâtiment est l'**outil**, pas l'effet).
- L'effet réel vient du style choisi (Forteresse / Raiders / Économique / Équilibré).

---

## Salle du Trône

**Bâtiment de recrutement du [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles)** — entrée du end-game, débloque la conquête de villages. Niveau requis : Château 6.

Particularité : **bâtiment simple à 1 seul niveau au MVP** — comme la Salle du Conseil. Un coût unique pour débloquer la mécanique de recrutement du Seigneur dans ce village. Les bonus passifs annoncés à terme (vitesse d'entraînement, vitesse de noblage) arriveront avec les niveaux 2+ post-MVP.

### Effet

- Permet de **recruter le Seigneur** dans ce village (1 Seigneur en garnison maximum à la fois).
- Aucun bonus passif au MVP (le bâtiment est l'**outil**, pas l'effet).
- Toutes les règles de recrutement, coût Seigneur, cap par village, devenir post-conquête sont consolidées dans [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles).

---

## Rempart (Wall)

**Défense passive** du village. ⏸️ **Désactivé au MVP** (`enabled: DISABLED` dans `BUILDING_DEFINITIONS.WALL`). Réactivation post-équilibrage.

> 💡 Synergie prévue : Wall + Watchtower + Caserne = **village forteresse**. Désactivé au MVP car impact méta trop fort sans équilibrage spécifique. Coûts et bonus de défense par niveau définis dans les constantes shared (à recalibrer à l'activation).

---

## Cachette (Hideout)

**Centre d'espionnage** (prévisionnel). ⏸️ **Désactivé au MVP** — réactivé après implémentation du système d'espionnage. Niveau requis (prévu) : Château 4.

### Rôle stratégique (prévu)

- **Exploration de menaces** : connaître les forces armées cachées d'une cible.
- **Stratégie de raid** : évaluer la richesse avant attaque.
- **Diplomatie** : comparer puissance avec alliés potentiels.
- **Défense anticipée** : détecter les attaques entrantes (futur).

---

## Bâtiments futurs (post-MVP)

| Bâtiment | Rôle | Statut |
| --- | --- | --- |
| 👑 **Salle du Trône (niveaux 2+)** | Niveaux supplémentaires apportant +vitesse d'entraînement et +vitesse de noblage | Roadmap |
