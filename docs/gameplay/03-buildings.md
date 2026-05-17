# Bâtiments

Catalogue détaillé des 10 bâtiments du village (coûts, temps, bonus passifs par niveau). Niveau max = **10** pour tous. Déblocages liés au niveau du Château (cf. [`02-economy-and-progression.md` § Paliers](./02-economy-and-progression.md#paliers-de-déblocage-château)).

## Vue d'ensemble

| Bâtiment | Rôle principal | Effet passif par niveau | Poids | Statut MVP |
| --- | --- | --- | --- | --- |
| 🏰 [**Château**](#château-castle) | Cœur du village | +vitesse construction, débloque autres bâtiments | 40 | ✅ Actif |
| 🪓 [**Camp de bûcherons**](#camp-de-bûcherons-wood) | Produit du bois | +production bois | 15 | ✅ Actif |
| ⛏️ [**Carrière**](#carrière-stone) | Produit de la pierre | +production pierre | 15 | ✅ Actif |
| ⚒️ [**Mine de fer**](#mine-de-fer-iron) | Produit du fer | +production fer | 15 | ✅ Actif |
| 🏣 [**Entrepôt**](#entrepôt-warehouse) | Stockage | +capacité max ressources | 20 | ✅ Actif |
| 🌾 [**Moulin**](#moulin-farm) | Population | +population max | 25 | ✅ Actif |
| ⚔️ [**Caserne**](#caserne-barracks) | Entraînement unités | +vitesse entraînement, débloque unités | 35 | ✅ Actif |
| 🔭 [**Tour de guet**](#tour-de-guet-watchtower) | Vision carte | +rayon visibilité monde | 30 | ✅ Actif |
| 🕯️ [**Salle du Conseil**](#salle-du-conseil) | Choix de [style stratégique de village](./12-village-styles.md) | (1 niveau, débloque le choix) | 25 | ✅ Actif |
| 👑 [**Salle du Trône**](#salle-du-trône) | Recrutement du [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles) (conquête) | (1 niveau MVP, débloque le recrutement) | 35 | ✅ Actif |
| 🧱 [**Rempart**](#rempart-wall) | Défense passive | +défense globale village | 38 | ⏸️ Désactivé MVP |
| 🕵️ [**Cachette**](#cachette-hideout) | Espionnage | (prévu : capacité espion) | 28 | ⏸️ Désactivé MVP |

## Mécanique de construction

- **File d'attente** : 3 upgrades simultanés par défaut (peut évoluer avec d'autres bâtiments).
- **Consommation de population** : chaque upgrade occupe de la population (récupérée si annulé ou détruit).
- **Annulation** : remboursement complet des ressources et de la population.
- **Bonus Château** : à partir du niveau 2, le Château réduit le temps de construction global. Le facteur s'applique à toutes les nouvelles constructions du village.

## Mécanique de progression

| Niveaux | Type de progression | Description |
| --- | --- | --- |
| 1–5 | Découverte rapide | Augmentation linéaire, feedback immédiat |
| 6–10 | Investissement | Temps ×1.5, coût ×2 par niveau |
| >10 (post-MVP) | Prestige | Rendement décroissant, bonus visuel ou symbolique |

Exemples de bonus par niveau :
- **Château** : +5 % vitesse construction par niveau (cumulatif).
- **Caserne** : −3 % temps d'entraînement / niveau.
- **Tour de guet** : +5 cases vision / niveau (paliers).
- **Moulin** : croissance non-linéaire (cf. tableau Farm).
- **Entrepôt** : +15 % capacité / niveau.
- **Rempart** : +5 % défense globale / niveau.

---

## Château (Castle)

**Cœur du village.** Détermine l'accès aux autres bâtiments et accélère la construction.

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 0 | 0 | 0 | 2 | 0 |
| 2 | 75 | 145 | 75 | 0 | 90 |
| 3 | 85 | 170 | 85 | 1 | 180 |
| 4 | 100 | 200 | 100 | 0 | 360 |
| 5 | 120 | 235 | 120 | 1 | 720 |
| 6 | 140 | 275 | 140 | 0 | 1 440 |
| 7 | 160 | 320 | 160 | 1 | 2 880 |
| 8 | 190 | 375 | 190 | 0 | 5 760 |
| 9 | 220 | 440 | 220 | 1 | 11 520 |
| 10 | 260 | 515 | 260 | 0 | 23 040 |

### Bonus de vitesse de construction

| Niveau | Multiplicateur | Bonus (-% temps) |
| --- | --- | --- |
| 1 | ×1.00 | −0 % |
| 2 | ×0.96 | −4 % |
| 3 | ×0.92 | −8 % |
| 4 | ×0.88 | −12 % |
| 5 | ×0.84 | −16 % |
| 6 | ×0.80 | −20 % |
| 7 | ×0.76 | −24 % |
| 8 | ×0.72 | −28 % |
| 9 | ×0.68 | −32 % |
| 10 | ×0.64 | −36 % |

### Déblocages

| Niveau Château | Bâtiments déverrouillés |
| --- | --- |
| 1 | Mines (Bois, Pierre, Fer), Entrepôt, Farm |
| 2 | +Caserne |
| 3 | +Tour de guet |
| 4 | +Salle du Conseil _(Hideout prévu post-MVP)_ |
| 5 | _(Wall prévu post-MVP — palier libre au MVP)_ |
| 6 | +Salle du Trône _(entrée end-game — débloque la conquête)_ |
| 7 | _(palier libre au MVP)_ |

> 💡 Le Château est le **bâtiment le plus influent pour la [puissance](./09-power-and-rankings.md)** (poids 40 constant).

---

## Camp de bûcherons (Wood)

**Production passive de bois.**

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 75 | 45 | 30 | 5 | 30 |
| 2 | 90 | 55 | 35 | 0 | 55 |
| 3 | 110 | 65 | 45 | 1 | 100 |
| 4 | 130 | 80 | 50 | 0 | 180 |
| 5 | 155 | 95 | 60 | 1 | 320 |
| 6 | 185 | 110 | 75 | 0 | 575 |
| 7 | 220 | 135 | 90 | 1 | 1 035 |
| 8 | 265 | 160 | 105 | 0 | 1 865 |
| 9 | 320 | 190 | 125 | 1 | 3 355 |
| 10 | 385 | 230 | 150 | 0 | 6 035 |

### Production / heure

| Niveau | Production / h | Multiplicateur cumulatif |
| --- | --- | --- |
| 1 | 200 | ×1.0 |
| 2 | 280 | ×1.4 |
| 3 | 400 | ×2.0 |
| 4 | 540 | ×2.7 |
| 5 | 760 | ×3.8 |
| 6 | 1 060 | ×5.3 |
| 7 | 1 500 | ×7.5 |
| 8 | 2 100 | ×10.5 |
| 9 | 2 940 | ×14.7 |
| 10 | 4 120 | ×20.6 |

> 💡 Production accumulée en arrière-plan, **plafonnée par la capacité de l'Entrepôt**.

---

## Carrière (Stone)

**Production passive de pierre.** Mêmes mécaniques que Wood, ressources principales inversées.

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 45 | 75 | 30 | 5 | 30 |
| 2 | 55 | 90 | 35 | 0 | 55 |
| 3 | 65 | 110 | 45 | 1 | 100 |
| 4 | 80 | 130 | 50 | 0 | 180 |
| 5 | 95 | 155 | 60 | 1 | 320 |
| 6 | 110 | 185 | 75 | 0 | 575 |
| 7 | 135 | 220 | 90 | 1 | 1 035 |
| 8 | 160 | 265 | 105 | 0 | 1 865 |
| 9 | 190 | 320 | 125 | 1 | 3 355 |
| 10 | 230 | 385 | 150 | 0 | 6 035 |

### Production / heure

Identique au Wood (cf. tableau ci-dessus) : 200 → 4 120 par heure du niveau 1 au 10.

---

## Mine de fer (Iron)

**Production passive de fer.** Mêmes mécaniques, coût principal en fer.

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 40 | 40 | 75 | 5 | 30 |
| 2 | 45 | 45 | 90 | 0 | 55 |
| 3 | 55 | 55 | 110 | 1 | 100 |
| 4 | 65 | 65 | 130 | 0 | 180 |
| 5 | 80 | 80 | 155 | 1 | 320 |
| 6 | 95 | 95 | 185 | 0 | 575 |
| 7 | 115 | 115 | 220 | 1 | 1 035 |
| 8 | 135 | 135 | 265 | 0 | 1 865 |
| 9 | 160 | 160 | 320 | 1 | 3 355 |
| 10 | 190 | 190 | 385 | 0 | 6 035 |

### Production / heure

Identique au Wood : 200 → 4 120 par heure.

---

## Entrepôt (Warehouse)

**Capacité de stockage** des trois ressources (bois/pierre/fer). Plafond commun par ressource.

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 60 | 55 | 40 | 0 | 75 |
| 2 | 70 | 60 | 45 | 1 | 120 |
| 3 | 80 | 70 | 50 | 0 | 195 |
| 4 | 90 | 80 | 60 | 1 | 310 |
| 5 | 105 | 90 | 70 | 0 | 495 |
| 6 | 120 | 105 | 75 | 1 | 790 |
| 7 | 140 | 120 | 85 | 0 | 1 260 |
| 8 | 160 | 140 | 100 | 1 | 2 020 |
| 9 | 185 | 160 | 115 | 0 | 3 230 |
| 10 | 210 | 185 | 130 | 1 | 5 165 |

### Capacité par niveau

| Niveau | Capacité / ressource | Total (B+P+F) |
| --- | --- | --- |
| 1 | 3 000 | 9 000 |
| 2 | 3 450 | 10 350 |
| 3 | 3 970 | 11 910 |
| 4 | 4 565 | 13 695 |
| 5 | 5 250 | 15 750 |
| 6 | 6 040 | 18 120 |
| 7 | 6 945 | 20 835 |
| 8 | 7 990 | 23 970 |
| 9 | 9 190 | 27 570 |
| 10 | 10 570 | 31 710 |

> 💡 Le stockage **plafonne la production** : si l'entrepôt est plein, les mines arrêtent de produire.

---

## Moulin (Farm)

**Limite de population** du village (workforce pour bâtiments et armée).

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 70 | 65 | 45 | 5 | 100 |
| 2 | 85 | 75 | 55 | 0 | 170 |
| 3 | 100 | 90 | 65 | 1 | 290 |
| 4 | 120 | 105 | 75 | 0 | 495 |
| 5 | 140 | 125 | 90 | 1 | 840 |
| 6 | 165 | 145 | 105 | 0 | 1 425 |
| 7 | 195 | 170 | 125 | 1 | 2 420 |
| 8 | 230 | 200 | 145 | 0 | 4 115 |
| 9 | 270 | 235 | 170 | 1 | 6 995 |
| 10 | 320 | 280 | 200 | 0 | 11 890 |

### Population par niveau

| Niveau | Bonus pop | Population cumulée |
| --- | --- | --- |
| 1 | +50 | 50 |
| 2 | +60 | 110 |
| 3 | +70 | 180 |
| 4 | +80 | 260 |
| 5 | +95 | 355 |
| 6 | +110 | 465 |
| 7 | +125 | 590 |
| 8 | +145 | 735 |
| 9 | +170 | 905 |
| 10 | +195 | 1 100 |

> 💡 Pop partagée entre bâtiments (occupation permanente) et unités (consommation à l'entraînement, libérée à la mort).

---

## Caserne (Barracks)

**Entraînement militaire.** Niveau requis : Château 2.

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 120 | 120 | 160 | 8 | 150 |
| 2 | 140 | 140 | 190 | 0 | 255 |
| 3 | 170 | 170 | 225 | 1 | 435 |
| 4 | 200 | 200 | 265 | 0 | 740 |
| 5 | 235 | 235 | 315 | 1 | 1 255 |
| 6 | 280 | 280 | 370 | 0 | 2 130 |
| 7 | 330 | 330 | 440 | 1 | 3 625 |
| 8 | 390 | 390 | 520 | 0 | 6 160 |
| 9 | 460 | 460 | 615 | 1 | 10 470 |
| 10 | 545 | 545 | 725 | 0 | 17 800 |

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

### Réduction temps d'entraînement

| Niveau | Réduction | Multiplicateur effectif |
| --- | --- | --- |
| 1 | 0 % | ×1.00 |
| 2 | −3 % | ×0.97 |
| 3 | −6 % | ×0.94 |
| 4 | −9 % | ×0.91 |
| 5 | −12 % | ×0.88 |
| 6 | −15 % | ×0.85 |
| 7 | −18 % | ×0.82 |
| 8 | −21 % | ×0.79 |
| 9 | −24 % | ×0.76 |
| 10 | −27 % | ×0.73 |

---

## Tour de guet (Watchtower)

**Rayon de visibilité** sur la carte du monde. Niveau requis : Château 3.

### Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 90 | 175 | 90 | 6 | 125 |
| 2 | 105 | 210 | 105 | 0 | 220 |
| 3 | 130 | 250 | 130 | 1 | 385 |
| 4 | 150 | 300 | 150 | 0 | 670 |
| 5 | 180 | 355 | 180 | 1 | 1 175 |
| 6 | 215 | 425 | 215 | 0 | 2 050 |
| 7 | 255 | 505 | 255 | 1 | 3 590 |
| 8 | 305 | 605 | 305 | 0 | 6 285 |
| 9 | 360 | 720 | 360 | 1 | 10 995 |
| 10 | 430 | 860 | 430 | 0 | 19 240 |

### Rayon de visibilité

| Niveau | Rayon | Monde déverrouillé |
| --- | --- | --- |
| 0 | 0 cases | ❌ Non |
| 1 | 5 cases | ✅ Oui |
| 2 | 10 cases | ✅ Oui |
| 3 | 15 cases | ✅ Oui |
| 4 | 20 cases | ✅ Oui |
| 5 | 25 cases | ✅ Oui |
| 6 | 30 cases | ✅ Oui |
| 7 | 35 cases | ✅ Oui |
| 8 | 40 cases | ✅ Oui |
| 9 | 45 cases | ✅ Oui |
| 10 | 50 cases | ✅ Oui |

> 💡 Vision **offensive/exploratoire uniquement** — n'augmente pas la défense (voir Rempart). Le niveau 10 reste localement puissant, mais ne révèle jamais toute la carte à lui seul.

### Effet sur le brouillard de guerre

Hors du rayon, les villages voisins (joueurs + barbares) apparaissent comme un **blip anonyme** — un point gris non-cliquable, sans owner, niveau ou nom. Le joueur sait qu'une entité existe mais pas ce que c'est. Même au niveau 10, le brouillard reste présent hors du disque de 50 cases.

La vision large doit venir de la **position des villages** : conquérir un village avancé puis y développer une Tour de guet ouvre un nouveau disque de vision. La Watchtower devient donc un outil de contrôle territorial, pas un bouton de révélation globale.

Les **expéditions** sont visibles uniquement dans le rayon ; hors vision, elles sont invisibles (pas de blip pour elles, par simplification volontaire).

Vue d'ensemble du système d'exploration : [`01-overview.md`](./01-overview.md#exploration--brouillard-de-guerre).

---

## Rempart (Wall)

**Défense passive** du village. ⏸️ **Désactivé au MVP** (`enabled: DISABLED` dans la config). Réactivation post-équilibrage.

### Coûts de construction (prévu)

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 500 | 1 000 | 500 | 8 | 225 |
| 2 | 625 | 1 250 | 625 | 0 | 405 |
| 3 | 780 | 1 560 | 780 | 1 | 730 |
| 4 | 975 | 1 950 | 975 | 0 | 1 315 |
| 5 | 1 220 | 2 440 | 1 220 | 1 | 2 360 |
| 6 | 1 525 | 3 050 | 1 525 | 0 | 4 250 |
| 7 | 1 905 | 3 810 | 1 905 | 1 | 7 650 |
| 8 | 2 380 | 4 760 | 2 380 | 0 | 13 775 |
| 9 | 2 975 | 5 950 | 2 975 | 1 | 24 790 |
| 10 | 3 720 | 7 440 | 3 720 | 0 | 44 620 |

### Bonus de défense (prévu)

| Niveau | Défense globale | Profil |
| --- | --- | --- |
| 1 | +5 % | Défense basique |
| 2 | +10 % | Protection légère |
| 3 | +15 % | Renforcement modéré |
| 4 | +20 % | Forteresse émergente |
| 5 | +25 % | Défense solide |
| 6 | +30 % | Fortification avancée |
| 7 | +35 % | Forteresse majeure |
| 8 | +40 % | Défense élite |
| 9 | +45 % | Bastion |
| 10 | +50 % | Forteresse impénétrable |

> 💡 Synergie : Wall + Watchtower + Caserne = **village forteresse**. Désactivé au MVP car impact méta trop fort sans équilibrage spécifique.

---

## Cachette (Hideout)

**Centre d'espionnage** (prévisionnel). ⏸️ **Désactivé au MVP** — réactivé après implémentation du système d'espionnage.

### Coûts de construction (prévu)

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 105 | 105 | 90 | 6 | 90 |
| 2 | 135 | 135 | 115 | 0 | 150 |
| 3 | 175 | 175 | 150 | 1 | 245 |
| 4 | 230 | 230 | 195 | 0 | 405 |
| 5 | 300 | 300 | 255 | 1 | 670 |
| 6 | 390 | 390 | 330 | 0 | 1 100 |
| 7 | 505 | 505 | 430 | 1 | 1 820 |
| 8 | 655 | 655 | 560 | 0 | 3 000 |
| 9 | 850 | 850 | 725 | 1 | 4 950 |
| 10 | 1 105 | 1 105 | 945 | 0 | 8 165 |

### Rôle stratégique (prévu)

- **Exploration de menaces** : connaître les forces armées cachées d'une cible.
- **Stratégie de raid** : évaluer la richesse avant attaque.
- **Diplomatie** : comparer puissance avec alliés potentiels.
- **Défense anticipée** : détecter les attaques entrantes (futur).

## Salle du Conseil

**Bâtiment administratif** qui débloque le choix de [style stratégique de village](./12-village-styles.md). Niveau requis : Château 4.

Particularité : **bâtiment simple à 1 seul niveau** — pas d'upgrade infini, un coût unique pour débloquer la mécanique de choix de style. Le coût des **changements de style** ultérieurs est défini dans [`12-village-styles.md` § Coûts de changement](./12-village-styles.md#coûts-de-changement-de-style).

### Coût de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 150 | 200 | 100 | 4 | 250 |

> 💡 Coût comparable à la Tour de guet niveau 1 (palier précédent), un cran au-dessus. Pop faible (4) car bâtiment administratif et non militaire. Pierre dominante (salle officielle, fondations).

### Effet

- Permet au joueur de **choisir le style stratégique** du village depuis l'UI.
- Aucun bonus passif intrinsèque (le bâtiment est l'**outil**, pas l'effet).
- L'effet réel vient du style choisi (Forteresse / Raiders / Économique / Équilibré).

---

## Salle du Trône

**Bâtiment de recrutement du [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles)** — entrée du end-game, débloque la conquête de villages. Niveau requis : Château 6.

Particularité : **bâtiment simple à 1 seul niveau au MVP** — comme la Salle du Conseil. Un coût unique pour débloquer la mécanique de recrutement du Seigneur dans ce village. Les bonus passifs annoncés à terme (vitesse d'entraînement, vitesse de noblage) arriveront avec les niveaux 2+ post-MVP.

### Coût de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1 | 1 600 | 2 400 | 1 200 | 6 | 5 400 |

> 💡 Coût ~3,5× la Salle du Conseil. Pierre dominante (salle officielle, fondations royales). Pop modeste (administratif, pas militaire). Temps long (1 h 30) cohérent avec le rang « entrée end-game » : on n'improvise pas une Salle du Trône.

### Effet

- Permet de **recruter le Seigneur** dans ce village (1 Seigneur en garnison maximum à la fois).
- Aucun bonus passif au MVP (le bâtiment est l'**outil**, pas l'effet).
- Toutes les règles de recrutement, coût Seigneur, cap par village, devenir post-conquête sont consolidées dans [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles).

---

## Bâtiments futurs (post-MVP)

| Bâtiment | Rôle | Statut |
| --- | --- | --- |
| 👑 **Salle du Trône (niveaux 2+)** | Niveaux supplémentaires apportant +vitesse d'entraînement et +vitesse de noblage | Roadmap |
