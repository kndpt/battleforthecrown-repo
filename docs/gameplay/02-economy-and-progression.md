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

Quand un village est **conquis** :

- **Ressources stockées** : reset complet (0 bois / 0 pierre / 0 fer). Spec barbare : [`13-barbarian-conquest.md` § Stock ressources et population](./13-barbarian-conquest.md#stock-ressources-et-population). Spec PvP : [`14-pvp-conquest.md` § Stock ressources](./14-pvp-conquest.md#stock-ressources).
- **Population** : **pas de reset** — la pop max du village conquis est **recalculée à partir du Moulin hérité**, la pop occupée reste celle des bâtiments hérités. Conquérir un village avec Moulin lvl 4 (~260 pop max) **ajoute un nouveau pool de pop au royaume** du conquérant — propre à ce village, **non transférable** vers ses autres villages (cohérent avec le principe « pop par village » ci-dessous).

🎯 **Effet snowball maîtrisé** : oui, posséder plus de villages = plus de pop totale (somme des pops max de chaque village). Mais cette pop reste **localisée** par village : elle n'aide pas le village d'origine à recruter plus, et chaque village reste limité par son propre Moulin. La snowball est le reward attendu de la conquête, pas un bug d'économie.

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
| **Population max** | **Par village** : déterminée par le niveau du Moulin **de ce village**. Pas de pool global mutualisé entre les villages d'un joueur. |
| **Source** | **Moulin** : chaque niveau ajouté augmente la population disponible **du village qui l'héberge** (cf. [`03-buildings.md` § Moulin](./03-buildings.md#moulin-farm)). |
| **Coût** | Chaque bâtiment et chaque unité **du village** consomme la population **de ce village** (définitivement). |
| **Libération** | Seulement si un bâtiment est détruit ou une unité meurt (la pop libérée retourne au pool **du village d'origine** — y compris pour des troupes mortes en renfort dans un autre village, cf. [`04-combat.md` § Renforts](./04-combat.md#renforts-entre-ses-propres-villages)). |

> 💡 Population max d'un village = somme des bonus du Moulin de ce village (ex : Moulin niveau 3 = pop lvl 1 + lvl 2 + lvl 3). Implémentation côté Prisma : table `Population` indexée par `villageId` (1 ligne par village).

### Mécanique de consommation

```
Population disponible (village V) = Population max (Moulin de V)
                                  − Σ(Pop bâtiments de V)
                                  − Σ(Pop unités recrutées par V)
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
couronnes/h = puissance_bâtiments_cumulée × 0.20
```

Sommée sur **tous les villages possédés** par le joueur. Implémenté dans `packages/shared/src/crowns/index.ts` (`DEFAULT_CROWNS.conversionRate`) + `crowns.service.ts:calculateProductionRate`.

### Gains de référence par phase

Calibrage cible : un Seigneur (5 000 couronnes, cf. [`10-conquest.md` § Coût de recrutement](./10-conquest.md#coût-de-recrutement-du-seigneur)) doit représenter ~18 h de revenu pour un joueur **mid-game** qui vient de construire sa Salle du Trône.

| Phase | Puissance bât. typique | Revenu | Temps pour 5 000 cour. (Seigneur) |
| --- | ---: | ---: | --- |
| Early game (Château 2-3) | ~360 | ~72 / h | ~3 jours (Seigneur inaccessible — Château 6 requis) |
| **Mid game (Château 6, Trône frais)** | **~1 400** | **~280 / h** | **~18 h** ← **cible de calage** |
| Late game (Château 10, 1 village max) | ~2 600 | ~520 / h | ~10 h |
| Late game (3 villages max) | ~7 900 | ~1 580 / h | ~3 h |

> 💡 La rapidité en late-game est volontaire : un joueur multi-village doit pouvoir alimenter l'expansion en Seigneurs successifs.

### Autres sources

| Source | Gain |
| --- | --- |
| Raids barbares repoussés | +Y instantané (à chiffrer) |
| Classement Pillards (hebdo, top 3) | _Post-MVP — esquisse à retravailler, cf. [`09-power-and-rankings.md` § Classements](./09-power-and-rankings.md#classements). Pas de gain couronnes via classement au MVP._ |
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

Progression non linéaire, inspirée Clash of Clans, avec trois phases caractéristiques (chiffres absolus dans `packages/shared/`, vus en wall-clock dans `scripts/build-simulator.js`) :

### Early game (niveaux 1–3) — Découverte

- **Objectif** : hook rapide, apprentissage des mécaniques.
- **Temps de construction** : secondes à minutes — onboarding mobile compressé.
- **Production** : modeste, le starting stock (`*_STARTING_AMOUNT` dans `.env`) couvre les premiers upgrades.
- **Gameplay** : construction quasi-instantanée, premiers raids barbares T1, découverte du monde.

### Mid game (niveaux 4–7) — Développement

- **Objectif** : compréhension profonde, stratégie émergente.
- **Temps de construction** : minutes → heures. Premier wall sensible à L7.
- **Production** : passe en mode "tu dois prioriser tes mines" — l'idle ressources devient palpable si tu rush.
- **Gameplay** : pillage devient rentable, gestion population, choix stratégiques (rush Castle vs investir mines vs préparer armée).

### Late game (niveaux 8–10) — Prestige

- **Objectif** : grind, optimisation, conquête multi-village.
- **Temps de construction** : heures → jours. Wall final L10 = trophée.
- **Production** : late game très généreuse (×40 vs L1), warehouse devient le facteur limitant si pas dépensé.
- **Gameplay** : pillage **fortement encouragé**, multi-village, domination du leaderboard.

## Économie équilibrée : production vs pillage

Principe fondamental : **production passive et pillage sur un pied d'égalité (50/50)**.

| Source | Impact |
| --- | --- |
| **Production passive** | Baseline, progression constante. Cap fixé par l'Entrepôt. |
| **Pillage actif** | Double la vitesse de progression d'un joueur engagé vs un passif. |
| **Raids barbares défensifs** | Bonus légers — récompenses si défense réussie. |
| **Cartes quotidiennes** | Valeur modérée, à plafonner. Bonus de confort / rattrapage, pas troisième pilier économique. |

> 💡 Un joueur qui pille activement progresse **~2× plus vite** qu'un joueur passif. En Standard MVP compressé, ce volume vient typiquement de 10–15 raids bien choisis sur des cibles riches, ou de davantage de micro-raids courts selon la zone.

**Stratégie de pillage optimal** : 20 Cavaliers + 10 Écuyers ≈ 2 500 capacité de loot/raid (cf. mobilité unités dans [`08-units.md`](./08-units.md)). La compression tempo rend surtout le trajet et la rotation plus fréquents ; le cap de loot par raid reste porté par la capacité de transport et le stock réel de la cible.

## Courbes de progression

> 📌 **Valeurs absolues dans `packages/shared/src/`** — source de vérité unique (cf. [AGENTS.md § docs](../../AGENTS.md)) :
> - **Coûts + temps d'upgrade** : `village/buildings.ts` → `BUILDING_DEFINITIONS[type].levels[n]` (`wood`, `stone`, `iron`, `population`, `timeSeconds`).
> - **Production passive** des mines : `resources/production.ts` → `RESOURCE_PRODUCTION_PER_HOUR[level]`.
> - **Capacité Entrepôt** : `resources/storage.ts` → `WAREHOUSE_STORAGE_LIMITS[level]`.
> - **Bonus vitesse construction du Château** : `village/buildings.ts` → `CASTLE_CONSTRUCTION_SPEED_BONUS[level]`.
> - **Population du Moulin** : `village/population.ts` → `FARM_POPULATION_LIMITS[level]`.
> - **Vision Watchtower** : `village/buildings.ts` → `WATCHTOWER_VISION_LEVELS[level]`.

### Caractéristiques de la courbe (shape)

- **Production de ressources** : progression non-linéaire, ratio par niveau croissant (~×1.4 early → ~×1.6 late), avec walls sensibles à L7 et L10 alignés avec les walls de temps de construction. Cf. [ADR-14](../architecture/decisions.md#adr-14--niveau-max--10-pour-tous-les-bâtiments-vs-courbe--façon-century-).
- **Temps de construction** : early L1-L5 ultra-rapide (secondes → minutes), walls L7 / L10 (heures → jours). Détail courbe walled-v1.1 dans [`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md).
- **Capacité Entrepôt** : suit la production (×1.4 → ×1.5 par niveau) pour éviter l'overflow au mid/late game.
- **Bonus Château** : −4 % temps de construction par niveau au-delà du L1, soit −36 % à L10.

### Distribution thématique des coûts

Chaque bâtiment consomme **plus** de sa ressource thématique (créant un équilibre naturel : produire bois exige du bois) :

- **Château / Tour / Wall** : pierre dominante (fondations).
- **Caserne** : fer dominant (armes).
- **Mine de Bois / Pierre / Fer** : ressource éponyme dominante (auto-cohérence).
- **Moulin / Entrepôt** : bois dominant (charpenterie).
- **Hideout (post-MVP)** : équilibré.

Détail des coûts exacts par niveau dans `BUILDING_DEFINITIONS`.

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

## Validation économique : rythme de progression

Cibles design pour le Standard MVP (tempo 1.0, courbes walled-v1.1 + production B) :

- **Tryhard** (engagement maximal, no sleep) : village full L10 atteint en ~**14 j wall-clock**. Conquête éligible (Château 6 + Salle du Trône) à **J+0.5** (~16h en construction pure, plus le temps de monter armée + Seigneur, cf. [`10-conquest.md`](./10-conquest.md#coût-de-recrutement-du-seigneur)).
- **Joueur mobile actif** (sommeil normal, check ~1h) : village full L10 à ~**15-16 j**, conquête éligible **J+1** (~20h en construction pure).
- **Joueur casual** (1-2 sessions/jour, 5-10 min) : non simulé — la durée sera plus longue (probablement 20-25 j pour full max), à valider en playtest.

Numbers générés par `scripts/build-simulator.js`. Le simulateur ne modélise que la **construction + ressources passives** — armée, Seigneur, combat de conquête et trajet ne sont **pas** dans le scope. Première conquête réelle = éligibilité + ~24-48h de buildup militaire pour un joueur normal, soit **J+2 à J+4** réaliste (compressed-async, cf. [`00-game-flow.md`](./00-game-flow.md)).

### Indices de bon équilibrage

- **Idle ressources < 5 %** pour un joueur normal mobile (le sommeil laisse les mines accumuler).
- **Idle ressources jusqu'à ~50 %** possible pour un tryhard rush conquête — c'est volontaire : crée la tension "rush Castle vs monter mines d'abord", levier d'indécision stratégique (cf. ADR-14, profils tall / wide / army-focused).
- **Walls construction** sensibles à L7 (heures) et L10 (jours) — alignés avec walls production pour récompenser l'investissement temps.

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
