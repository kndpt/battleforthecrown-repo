# Génération des villages barbares

Spec de l'algorithme de génération adaptatif des villages barbares (BV). Cible **MVP**.

> Pour la vision, le tier model, la régénération et la distribution générale : [`06-barbarians.md`](./06-barbarians.md). Cette doc traite uniquement du **moment / de l'algorithme de création** d'un BV à l'arrivée d'un joueur.

## Pourquoi cette doc

Les BV (cf. [`06-barbarians.md`](./06-barbarians.md)) sont **générés à l'arrivée d'un nouveau joueur** dans le monde, autour de sa zone de spawn. Conséquences :

- Pas de pool fixe au lancement du monde.
- Pas de spawn déconnecté des joueurs.
- Un joueur qui rejoint un monde **trouve toujours des cibles barbares à proximité**, même si le monde est ancien.
- **Mais** : pas de submersion à mesure que les arrivées s'accumulent (sinon la carte devient une mer de BV, le PvP se dilue, l'identité des zones disparaît).

L'algorithme s'adapte donc à **deux variables vivantes** :

1. Le **volume de BV déjà présents** dans la zone visée (anti-saturation locale).
2. La **présence d'autres joueurs** dans la zone visée (anti-submersion).

## Cadre décidé

| Élément | Décision |
| --- | --- |
| Déclencheur | **Arrivée d'un nouveau joueur dans le monde** (1ère connexion + création du 1er village via `POST /world/:worldId/join`) |
| Zone visée | Anneau autour de la zone de spawn du nouveau joueur |
| Distribution des tiers | **Concentrique, par distance pure** — cf. [`06-barbarians.md` § Distribution sur la carte](./06-barbarians.md#distribution-sur-la-carte) |
| Plafond local | Capacité cible **par chunk** (cap déterministe, anti-saturation) |
| Adaptation joueurs voisins | **Anti-submersion par chunk** : présence d'autres villages joueurs réduit la capacité cible (cf. § Anti-submersion) |
| Cycle de vie post-génération | Cf. [`06-barbarians.md` § Régénération naturelle](./06-barbarians.md#régénération) — non répété ici |

## Stratégie de spawn — décision MVP

**Spawn UNIQUEMENT à la 1ère arrivée du joueur dans le monde**, complété par un **catchup d'arrivée différée** (workers pour traiter les chunks que le seeding synchrone n'a pas eu le temps de couvrir).

| Cas | Spawn ? |
| --- | --- |
| 1ère connexion + création du 1er village du joueur dans le monde | ✅ Oui — seeding sync sur les chunks proches + catchup async sur les chunks lointains |
| Création d'un village suivant par le joueur (migration, conquête, expansion) | ❌ Non |
| Chute / abandon d'un BV existant | ❌ Non — la régen naturelle ([`06-barbarians.md` § Régénération](./06-barbarians.md#régénération)) reprend la main |
| Cron de **régulation** densité (ex : recompute densité monde, top up zones vides) | ❌ Non — explicitement absent du MVP |

**Justification** :
- Cohérent avec la **raréfaction progressive volontaire** des BV (cf. [`13-barbarian-conquest.md` § Conséquences concrètes](./13-barbarian-conquest.md#conséquences-concrètes)) : la carte se vide au fil des conquêtes, le PvP émergent prend le relais.
- **Anti-exploit** : empêche un joueur de multiplier ses villages pour multiplier le pool barbare farmable.
- MVP minimal : zéro cron de régulation, comportement déterministe.

> 🔓 **Statut** : décision MVP stable. Un éventuel cron de régulation centralisé (équilibre densité long terme) reste à reconsidérer post-MVP — voir [`tasks/archive/26-barbarian-recycling-vs-spawn.md`](../../tasks/archive/26-barbarian-recycling-vs-spawn.md) (note de suite).

### Catchup d'arrivée différée

Le seeding synchrone de l'arrivée traite **les chunks les plus proches en priorité** (cap `MAX_SYNC_CHUNKS=4`) pour ne pas bloquer la réponse HTTP du `/join`. Les chunks restants (rayon plus grand) sont rattrapés par un worker quotidien (`@Cron(EVERY_DAY_AT_MIDNIGHT)`) qui repasse sur les **villages joueurs créés dans la dernière heure** et complète leur seeding manquant.

> 💡 **Important** : ce worker n'est **pas** un cron de régulation densité. C'est un **catchup d'arrivée** : il termine le travail entamé par `/join`. Quand tous les chunks d'un joueur sont seeded, il devient idempotent et ne crée plus rien (les chunks marqués via `ChunkSpawnState` ne sont pas re-traités). Sa fenêtre `< 1h` borne le rattrapage à des arrivées récentes — il n'a pas vocation à reseed des zones anciennes.

Conséquence runtime : un joueur qui crée son 1er village voit les BV proches apparaître **immédiatement** (en quelques secondes après le `/join`), et les BV lointains finissent d'apparaître **dans les 24 h** suivantes.

## Densité cible

**Définie par chunk**, pas globalement. Un chunk est une cellule carrée de la grille monde (taille par défaut **50×50**), unité d'idempotence du seeding (cf. table `ChunkSpawnState`).

| Paramètre | Valeur défaut | Source |
| --- | --- | --- |
| `chunkSize` | 50 tiles | `WorldConfig.barbarianSeeding.chunkSize` |
| `targetMin` (BV par chunk) | 3 | `WorldConfig.barbarianSeeding.targetMin` |
| `targetMax` (BV par chunk) | 6 | `WorldConfig.barbarianSeeding.targetMax` |
| Capacité tirée | `randomInt(targetMin, targetMax)` | runtime |

> 💡 La capacité d'un chunk est tirée une fois lors du premier seeding du chunk — pas de re-roll. Le `existingCount` (BV déjà présents) est soustrait de la capacité avant sampling : `need = max(0, capacity − existingCount)`. Ça garantit l'idempotence : un chunk déjà au-dessus de sa cible ne reçoit aucun nouveau BV.

**Rationale** : 3-6 BV par chunk de 50×50 → **~9 BV en moyenne par anneau initial** (rayon ≤ rMax) côté nouveau joueur, ce qui donne 5-10 cibles tier 1-2 immédiates dans la zone de découverte (Watchtower lvl 1 = vision 5 tiles ; les BV proches deviennent visibles dès le premier upgrade Watchtower). Cohérent avec la boucle « première session a du contenu » (cf. [`15-onboarding.md`](./15-onboarding.md)).

## Rayon et placement

### Anneau de génération autour du spawn

| Paramètre | Valeur défaut | Sens |
| --- | --- | --- |
| `rMin` | 8 tiles | Distance minimale joueur ↔ BV. En deçà : zone immédiate du joueur, on ne génère pas. |
| `rMax` | 60 tiles | Distance maximale couverte. Au-delà : hors anneau. |

> ⚠️ Valeur effective dans le seed SQL : `rMax=40` au moment de la rédaction. **Cible MVP : 60** pour intégrer T4/T5 (cf. § Distribution des tiers). Écart de seed → corrigé via run 007 (cf. fiche).

L'anneau est calculé via `getChunksInRings(centerX, centerY, rMin, rMax, chunkSize, gridW, gridH)` (cf. [`packages/shared/src/world/barbarian-geometry.ts`](../../packages/shared/src/world/barbarian-geometry.ts)). Tous les chunks qui touchent l'anneau sont éligibles ; ils sont triés par distance croissante au spawn pour que le seeding synchrone traite d'abord les plus proches.

### Distance minimale entre BV (`minSpacing`)

`minSpacing = 6` tiles. Lors du sampling Poisson-disk, deux BV ne sont jamais positionnés à moins de 6 tiles l'un de l'autre. Empêche les empilements visuels et garde une carte lisible.

### Distance minimale BV ↔ village joueur (`playerExclusion`)

`playerExclusion = 2` tiles. Aucun BV n'est positionné à moins de 2 tiles d'un village joueur existant. Anti-aggro injuste, anti-collision visuelle.

> 💡 La fonction `samplePositions` lit les villages présents dans le **chunk + halo `minSpacing`** (en lecture directe DB, transactionnelle) avant de proposer une position. Pas de rolling : si la position échoue les contraintes, on retire jusqu'à `need × 20` tentatives, puis on s'arrête.

## Distribution des tiers

**Concentrique, basée uniquement sur la distance** au spawn du nouveau joueur. Aucune adaptation au level / puissance / âge du joueur (cible MVP).

| Anneau | Tier généré |
| --- | --- |
| `[8, 20)` | T1 |
| `[20, 30)` | T2 |
| `[30, 40)` | T3 |
| `[40, 50)` | T4 |
| `[50, 60]` | T5 |

> 💡 Distance pure → un joueur low-level peut **voir** un T4/T5 au loin (via Watchtower + scout) sans pouvoir l'attaquer. Cible long terme assumée.

Les bornes sont stockées dans `WorldConfig.barbarianSeeding.tierRanges` ; le mapping `tier → caractéristiques` (loot, points, buildingRatio, visibleIndexNoise) vit dans `WorldConfig.barbarianSeeding.tiers` (cf. [`packages/shared/src/world/schemas.ts`](../../packages/shared/src/world/schemas.ts) `BarbarianSeedingPlanSchema`).

> 💡 Le **blueprint d'armée** (compo MILICE/ARCHER/ÉCUYER/TEMPLIER par tier) n'appartient pas à cette spec. Il est documenté dans [`06-barbarians.md` § Blueprint d'armée](./06-barbarians.md#blueprint-darmée). À la création d'un BV, la factory consomme la compo blueprint + applique le roll de stock initial (60-100 % du max pour les troupes, 30-100 % du cap pour les ressources) — cf. [`06-barbarians.md` § Génération](./06-barbarians.md#génération).

## Anti-submersion

L'algorithme MVP réagit à deux signaux pour éviter de surcharger la carte :

### 1. Anti-saturation locale (par chunk)

`need = max(0, capacity − existingCount)` où `existingCount` compte les BV déjà présents dans le chunk. Un chunk déjà à sa capacité cible **ne reçoit aucun nouveau BV**, peu importe le joueur déclencheur. C'est l'idempotence native du seeding.

### 2. Anti-submersion par présence joueur (par chunk)

Lors du calcul de `need`, on consulte les **villages joueurs autres que le déclencheur** présents dans le chunk + halo `minSpacing` :

| Autres villages joueurs dans le chunk + halo | Effet sur `capacity` |
| --- | --- |
| 0 | `capacity` inchangée |
| 1 | `capacity = floor(capacity / 2)` |
| ≥ 2 | `capacity = 0` (chunk skipped) |

🎯 **Intention** : si la zone du nouveau joueur est déjà occupée par d'autres joueurs, on n'y rajoute pas de BV "pour le nouveau venu". Les BV existants suffisent comme contenu — ne pas saturer une zone PvP émergente.

> 💡 Le décompte se fait en temps réel via la table `Village` (filtrée `isBarbarian = false` et `id ≠ déclencheur`). Pas de cache, pas de pré-calcul. Coût négligeable : la requête tape déjà sur la zone via le halo de `samplePositions`.

### Hors scope MVP — à reprendre post-MVP

- **Cap de densité globale du monde** (ex : limite cumulée de BV par km² monde).
- **Recyclage des BV morts/abandonnés d'autres zones** plutôt que création neuve.
- **Cron de régulation** centralisé (rééquilibrage long terme).

Ces points restent ouverts, à reprendre lorsque le playtest aura donné des signaux concrets — cf. [`tasks/archive/26-barbarian-recycling-vs-spawn.md`](../../tasks/archive/26-barbarian-recycling-vs-spawn.md).

## Variables d'entrée de l'algorithme

| Variable | Source | Usage |
| --- | --- | --- |
| Position du nouveau joueur (`villageX`, `villageY`) | DB `Village` (1er village créé) | Centre des anneaux |
| `worldId` | DB `Village.worldId` | Scope du seeding |
| Grille monde (`gridWidth`, `gridHeight`) | DB `World` | Clamp des anneaux |
| Config seeding (`barbarianSeeding`) | `WorldConfig` (Zod-validated) | Tous les paramètres ci-dessus (rayons, tailles, tier ranges, distances minimales) |
| BV existants dans le ring | DB `Village WHERE isBarbarian = true AND chunk + halo` | Anti-saturation |
| Villages joueurs existants dans le ring | DB `Village WHERE isBarbarian = false AND chunk + halo AND id ≠ déclencheur` | Anti-submersion (cf. ci-dessus) |

> 💡 Le **niveau du joueur** n'est pas une entrée. Cible MVP volontaire (cf. § Distribution des tiers).

## Idempotence et catchup

| Mécanisme | Garantie |
| --- | --- |
| Table `ChunkSpawnState` (clé `worldId, cx, cy`) | Un chunk seeded une fois ne sera pas reseed inutilement par le catchup. |
| Contrainte unique `(worldId, x, y)` sur `Village` | Un BV ne peut pas être créé deux fois sur la même tile (P2002 silencieusement skipé). |
| `MAX_SYNC_CHUNKS = 4` | La requête `/join` finit en quelques secondes ; le reste est délégué au catchup. |
| Catchup `BarbarianSeedingCatchupWorker` (1×/jour) | Repasse sur les villages joueurs créés `< 1 h` avant et complète les chunks restants. **Pas un cron de régulation.** |

## Liens

- [`06-barbarians.md`](./06-barbarians.md) — vision design des BV (tiers, blueprint, régen, lisibilité). Source des règles que cette spec consomme.
- [`01-overview.md` § Monde persistant](./01-overview.md#monde-persistant) — règle « un BV peut reprendre un village abandonné » (flux **séparé** du spawn algo).
- [`13-barbarian-conquest.md` § Conséquences concrètes](./13-barbarian-conquest.md#conséquences-concrètes) — raréfaction progressive volontaire (justification de la stratégie spawn-à-l'arrivée).
- [`tasks/archive/26-barbarian-recycling-vs-spawn.md`](../../tasks/archive/26-barbarian-recycling-vs-spawn.md) — historique de la décision recyclage vs spawn neuf, pistes post-MVP.
- [`packages/shared/src/world/barbarian-geometry.ts`](../../packages/shared/src/world/barbarian-geometry.ts) — implémentation pure des helpers géométriques (`getChunksInRings`, `samplePositions`, `determineTier`).
- [`packages/shared/src/world/schemas.ts`](../../packages/shared/src/world/schemas.ts) — Zod schemas (`BarbarianSeedingPlanSchema`).
