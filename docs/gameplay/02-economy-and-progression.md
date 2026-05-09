# Économie et progression

## Ressources

| Type | Rôle | Produit par |
| --- | --- | --- |
| **Bois** | Construction, unités de base | Camp de bûcherons (Wood Camp) |
| **Pierre** | Construction défensive | Carrière (Stone Quarry) |
| **Fer** | Unités avancées | Mine de fer (Iron Mine) |
| **Population** | Ressource humaine limitée (workforce) | Moulin (Farm) |
| **Couronnes** | Ressource stratégique principale (taxes, seigneurs, stratégie) | Gains via villages possédés |

### Production de ressources

- **Production passive et continue**, scalée par le niveau du bâtiment producteur.
- Suit une croissance exponentielle par niveau (formule en fin de doc).
- **Capacité de stockage limitée** par le bâtiment Entrepôt (Warehouse). Si l'entrepôt est plein, la production stagne.
- Les villages peuvent être **attaqués et pillés** : les ressources stockées sont perdues, mais la production passive reste intacte.

### Conquête et reset

Quand un village est **conquis**, ses ressources stockées et sa population sont **reset** selon des paramètres configurables par monde (`WorldConfig`).

### Contraintes

- Chaque village est un **nœud de ressources indépendant** — pas de pool global.
- La production stoppe si l'entrepôt est plein.
- **Pas de transfert direct** entre villages joueur (marché prévu post-MVP).
- Les villages barbares **régénèrent** leurs ressources et leurs troupes avec le temps. Spec complète dans [`06-barbarians.md`](./06-barbarians.md).
- Le revenu en couronnes dépend de la **puissance cumulée** de tous les villages possédés.

## Population

La **population** est une **ressource finie et permanente** qui représente les citoyens d'un village. Elle crée un **trade-off stratégique fondamental** : chaque bâtiment construit ou unité entraînée consomme de la population.

### Principes fondamentaux

| Élément | Description |
| --- | --- |
| **Population max** | Identique pour tous les joueurs et tous leurs villages (somme cumulée des bonus du Moulin) |
| **Source** | **Moulin** : chaque niveau ajouté augmente la population totale disponible |
| **Coût** | Chaque bâtiment et chaque unité consomme de la population (définitivement) |
| **Libération** | Seulement si un bâtiment est détruit ou une unité meurt |

> 💡 Population max cumulée = somme de tous les bonus du Moulin (ex : Moulin niveau 3 = pop lvl 1 + lvl 2 + lvl 3).

### Mécanique de consommation

```
Population disponible = Population max − Σ(Pop bâtiments) − Σ(Pop unités)
```

- **Construction** → `−X population` (permanent jusqu'à destruction).
- **Entraînement** → `−Y population` (permanent jusqu'à mort de l'unité).
- **Destruction** → `+X population` (libérée).
- **Mort d'une unité** → `+Y population` libérée **immédiatement à la résolution du combat** (pas au retour de l'expédition). Côté attaquant, la pop des morts est rendue dès l'event `battle.resolved` ; les survivants gardent leur pop consommée jusqu'à la mort ou la dissolution.

> 💡 Friction offensive : envoyer une armée en suicide ne coûte que les ressources et le temps de re-recrutement — la pop revient. C'est un choix design assumé (modèle Tribal Wars / Kingsage), aligné avec l'idée que la population représente le **stock instantané** de citoyens disponibles, pas un coût permanent par bataille.

### Limites et contraintes

| Règle | Impact stratégique |
| --- | --- |
| **Population finie** | Impossible de tout construire ET d'entraîner une armée massive |
| **Choix exclusif** | "Bâtiments ?", "Armée ?", ou "Mélange ?" → chaque joueur décide son style |
| **Coût de l'erreur** | Mal équilibrer = village faible en offensif OU en ressources |

### Stratégies de gestion

Le joueur choisit comment répartir sa population entre bâtiments et armée. Cette décision macro est formalisée par les **styles stratégiques de village** (Forteresse / Raiders / Économique / Équilibré) — voir [`12-village-styles.md`](./12-village-styles.md) pour la spec complète, mécanique de choix, et bonus/malus.

## Couronnes

Monnaie stratégique principale. La [puissance](./09-power-and-rankings.md) des villages du joueur (uniquement le poids des bâtiments) détermine le **taux de rendement de couronnes par heure**.

### Formule de revenu

```
couronnes/h = puissance_bâtiments_cumulée × 0.05
```

Sommée sur **tous les villages possédés** par le joueur. Implémenté dans `packages/shared/src/crowns/index.ts` (`DEFAULT_CROWNS.conversionRate`) + `crowns.service.ts:calculateProductionRate`.

### Gains de référence par phase

Calibrage cible : un Seigneur (5 000 couronnes, cf. [`10-conquest.md` § Coût de recrutement](./10-conquest.md#coût-de-recrutement-du-seigneur)) doit représenter ~3 jours de revenu pour un joueur **mid-game** qui vient de construire sa Salle du Trône.

| Phase | Puissance bât. typique | Revenu | Temps pour 5 000 cour. (Seigneur) |
| --- | ---: | ---: | --- |
| Early game (Château 2-3) | ~360 | ~18 / h | ~12 jours (Seigneur inaccessible — Château 6 requis) |
| **Mid game (Château 6, Trône frais)** | **~1 400** | **~70 / h** | **~3 jours** ← **cible de calage** |
| Late game (Château 10, 1 village max) | ~2 600 | ~130 / h | ~1.5 jour |
| Late game (3 villages max) | ~7 900 | ~395 / h | ~13 h |

> 💡 La rapidité en late-game est volontaire : un joueur multi-village doit pouvoir alimenter l'expansion en Seigneurs successifs.

### Autres sources

| Source | Gain |
| --- | --- |
| Raids barbares repoussés | +Y instantané (à chiffrer) |
| Classement Pillards (hebdo, top 3) | +1 500 / +1 000 / +500 couronnes — détail [`09-power-and-rankings.md` § Classements](./09-power-and-rankings.md#classements) |
| Événements Almanax | multiplicateurs |

### Dépenses

| Action | Coût (couronnes) |
| --- | --- |
| Changer stratégie de village | 50–100 |
| Nommer un Seigneur | élevé — voir [`10-conquest.md` § Coût de recrutement](./10-conquest.md#coût-de-recrutement-du-seigneur) |
| Activer un bonus temporaire (bénédiction) | 150 |
| Déplacer un village / resettlement | 200 |

> 🎯 Rôle central : tout passe par cette monnaie → elle lie toutes les boucles.

## Phases de progression

Progression non linéaire, inspirée Clash of Clans, avec trois phases :

### Early game (niveaux 1–3) — Découverte

- **Objectif** : hook rapide, apprentissage des mécaniques.
- **Temps de construction** : quelques minutes à 1 heure.
- **Production** : ~200 ressources / h (6 mines niveau 2–3).
- **Gameplay** : construction rapide, premiers raids, découverte du monde.

### Mid game (niveaux 4–7) — Développement

- **Objectif** : compréhension profonde, stratégie émergente.
- **Temps de construction** : 2–6 heures par upgrade.
- **Production** : ~800 ressources / h (6 mines niveau 5–6).
- **Gameplay** : pillage devient rentable (+50 % ressources), gestion population, choix stratégiques.

### Late game (niveaux 8–10) — Prestige

- **Objectif** : grind, optimisation, conquête.
- **Temps de construction** : 8–24 heures par upgrade.
- **Production** : ~2 000 ressources / h (6 mines niveau 8–10).
- **Gameplay** : pillage **nécessaire** (+100 % ressources), multi-village, domination.

## Cibles de progression

| Cible | Valeur |
| --- | --- |
| **Durée pour maxer** | ~1 mois (30 jours) pour un village niveau 10 complet |
| **Sessions de jeu** | 2–5 min (début) → sessions plus longues (multi-village) |
| **Connexions quotidiennes** | 2–4 fois/jour (début) → plus fréquent (late game) |
| **Temps effectif total** | ~100 heures sur 30 jours ≈ 3–4 h/jour |

## Économie équilibrée : production vs pillage

Principe fondamental : **production passive et pillage sur un pied d'égalité (50/50)**.

| Source | Contribution / jour | Impact |
| --- | --- | --- |
| **Production passive** | ~54 000 ressources | Baseline, progression constante |
| **Pillage actif** | ~54 000 ressources | Double la vitesse de progression |
| **Raids barbares défensifs** | bonus légers | Récompenses si défense réussie |
| **Quête quotidienne** | 5 000 – 10 000 | +10–15 % au total |

> 💡 Un joueur qui pille activement (10–15 raids/jour) progresse **2× plus vite** qu'un joueur passif.

**Stratégie de pillage optimal** : 20 Cavaliers + 10 Écuyers ≈ 2 500 capacité de loot/raid. 10 raids/jour ≈ +25 000 ressources supplémentaires.

## Formules de progression

### Production de ressources (Bois / Pierre / Fer)

```
Production_niveau_n = 50 × (1.4 ^ (n-1))
```

| Niveau | Production / h | Production / jour |
| --- | --- | --- |
| 1 | 50 | 1 200 |
| 3 | 100 | 2 400 |
| 5 | 190 | 4 560 |
| 7 | 375 | 9 000 |
| 10 | 1 030 | 24 720 |

### Coûts d'upgrade des bâtiments

Progression exponentielle adaptée à la catégorie :

| Catégorie | Formule de base | Multiplicateur |
| --- | --- | --- |
| **Château** | 250 × (1.17 ^ (n-1)) | 1.17 |
| **Production (Mines)** | 150 × (1.20 ^ (n-1)) | 1.20 |
| **Militaire (Caserne)** | 400 × (1.18 ^ (n-1)) | 1.18 |
| **Stockage (Entrepôt)** | 150 × (1.15 ^ (n-1)) | 1.15 |
| **Stratégique (Farm/Tour)** | 180–350 × (1.18–1.19 ^ (n-1)) | 1.18–1.19 |
| **Défense (Wall)** | 2 000 × (1.25 ^ (n-1)) | 1.25 |
| **Espionnage (Hideout)** | 300 × (1.30 ^ (n-1)) | 1.30 |

### Distribution des ressources par bâtiment

Chaque bâtiment consomme selon sa spécialisation :

| Type | Bois | Pierre | Fer |
| --- | --- | --- | --- |
| **Château / Défense / Tour** | 25 % | 50 % | 25 % |
| **Militaire (Caserne)** | 30 % | 30 % | 40 % |
| **Production Bois** | 50 % | 30 % | 20 % |
| **Production Pierre** | 30 % | 50 % | 20 % |
| **Production Fer** | 25 % | 25 % | 50 % |
| **Économique (Farm/Entrepôt)** | 40 % | 35 % | 25 % |
| **Espionnage (Hideout)** | 35 % | 35 % | 30 % |

> 💡 Chaque mine coûte plus cher dans la ressource qu'elle produit, créant un équilibre naturel.

### Temps de construction

```
Temps_niveau_n = Temps_base × (multiplicateur ^ (n-1)) × Bonus_château
```

| Catégorie | Temps base | Multiplicateur |
| --- | --- | --- |
| Château | 180 s | 2.0 |
| Production | 120 s | 1.8 |
| Militaire | 600 s | 1.7 |
| Stockage | 300 s | 1.6 |
| Stratégique | 400–500 s | 1.7–1.8 |

**Bonus Château** : réduction de 4 % par niveau (max −40 % à niveau 10). Détail dans [`03-buildings.md`](./03-buildings.md).

## Paliers de déblocage (Château)

Le niveau du Château détermine l'accès aux autres bâtiments, créant des objectifs intermédiaires :

| Niveau Château | Déblocage |
| --- | --- |
| **1** | Mines (Bois, Pierre, Fer), Entrepôt, Farm |
| **2** | **Caserne** (militaire de base) |
| **3** | **Tour de guet** (exploration carte) |
| **4** | **Salle du Conseil** (choix de [style stratégique](./12-village-styles.md)) — _Hideout prévu post-MVP_ |
| **5** | _(Wall prévu post-MVP — palier libre au MVP)_ |
| **6** | **Salle du Trône** (entrée end-game — recrutement [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles)) |
| **7** | _(palier libre au MVP)_ |

## Validation économique : exemple de progression

Joueur type — 1 mois pour maxer un village :

### Semaine 1 (Early game, niveaux 1–3)

- Production : ~200 ressources / h.
- Temps construction : 10–60 min/upgrade.
- Objectif : débloquer Caserne, premiers raids.
- **Temps effectif : 15–20 heures**.

### Semaines 2–3 (Mid game, niveaux 4–7)

- Production : ~800 ressources / h.
- Temps construction : 2–6 h/upgrade.
- Pillage : +50 % ressources.
- **Temps effectif : 30–40 heures**.

### Semaine 4 (Late game, niveaux 8–10)

- Production : ~2 000 ressources / h.
- Temps construction : 8–24 h/upgrade.
- Pillage : +100 % ressources (nécessaire).
- **Temps effectif : 40–50 heures**.

**Total ≈ 100 heures / 30 jours = 3–4 h/jour** ✅

## Principes d'équilibrage

| Principe | Application |
| --- | --- |
| **Aucune ressource plus rare** | Bois = Pierre = Fer (production identique) |
| **Progression exponentielle** | Chaque niveau significativement plus long que le précédent |
| **Pillage récompensé** | Joueur actif progresse 2× plus vite |
| **Population = limiteur stratégique** | Trade-off permanent : armée vs infrastructure |
| **Arrondis au multiple de 5** | Lisibilité et clarté des valeurs |
| **Distribution spécialisée** | Chaque bâtiment consomme plus de sa ressource thématique |
| **Paliers de déblocage** | Objectifs intermédiaires clairs (Château 2–7) |
