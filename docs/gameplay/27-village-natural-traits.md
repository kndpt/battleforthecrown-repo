# 27 — Traits naturels de village (MVP)

**Statut** : spec livrée — v1 traits de ressource (run 088), taxonomie **v2** + trait population Terre fertile (run 102). Promotion du lab [`tickets/01-natural-village-traits.md`](./lab/tickets/01-natural-village-traits.md).
**Type** : identité de position, économie légère. Traits de ressource (production) + Terre fertile (population) ; Colline/Plaine posées, effets branchés en runs successeurs.

## Objectif joueur

Un village est aujourd'hui une position + des niveaux de bâtiments. On lui donne une **identité fixe liée à son emplacement** (trait naturel), **distincte** du style *choisi* par le joueur ([`12-village-styles.md`](./12-village-styles.md)). Conquérir devient « prendre un bon spot », pas juste un village de plus.

Trait ≠ style :

| | Trait naturel (cette spec) | Style stratégique ([`12`](./12-village-styles.md)) |
| --- | --- | --- |
| Origine | **Fixe**, dérivé de la tile, posé à la création | **Choisi** par le joueur, changeable |
| Contrôle joueur | Aucun | Total (via Salle du Conseil) |
| Effet | Petit % plat sur **une** ressource | ± % production/combat/stockage/mobilité |
| Barbares | **Oui** (tout village en a un) | Non (les barbares n'ont pas de style) |
| Révélation externe | Scout uniquement | Scout uniquement |

Les deux coexistent : dans [`calculateProductionRate`](../../packages/shared/src/logic/production.ts), le facteur trait est appliqué **après** le facteur style (multiplicatifs, indépendants).

## Mécanique MVP

Chaque village porte exactement **un** trait naturel, dérivé de façon **déterministe** de sa tile `(worldId, x, y)`, posé à la création, jamais modifié.

### Traits (taxonomie v2)

| Trait | Effet | Cible |
| --- | --- | --- |
| 🌲 **DENSE_FOREST** (Forêt dense) | +10 % production passive | Bois |
| ⛏️ **RICH_QUARRY** (Carrière riche) | +10 % production passive | Pierre |
| ⚒️ **IRON_VEIN** (Veine de fer) | +10 % production passive | Fer |
| 🌱 **FERTILE_SOIL** (Terre fertile) | +10 % population max | Population |
| ⛰️ **HILL** (Colline) | Aucun effet *actif* — taxonomie posée, bonus vision Watchtower branché dans un run successeur | — |
| 🌾 **PLAINS** (Plaine) | Aucun bonus (neutre) | — |

- **Bonus plat** : facteur multiplicatif constant `×1.10`, **indépendant du niveau de bâtiment** → zéro snowball (le facteur ne grandit jamais ; seul le gain absolu suit la base, comme tout multiplicateur). Ressource → `NATURAL_TRAIT_PRODUCTION_BONUS` (appliqué dans `calculateProductionRate`). Population → `NATURAL_TRAIT_POPULATION_BONUS` (appliqué dans `applyPopulationBonus`, backend, **multiplicativement avec le `populationBonus` du style**, un seul arrondi final).
- **PLAINS** n'applique aucun bonus (production == baseline sans trait). **HILL** est inerte au jeu actuel (son effet vision arrive avec un run successeur, mais le trait est déjà posé dans l'enum + la distribution pour éviter une double migration).
- **Garde zéro-snowball / distribution** : `PLAINS` est **plafonné à 30 %** de la distribution (25 % réel) car il portera l'army-speed dans un run successeur — aucun trait à effet ne peut redevenir majoritaire. Aucun scaling bâtiment, aucun cumul entre traits (un village = un trait).

### Dérivation déterministe

Fonction pure [`deriveNaturalTrait(worldId, x, y)`](../../packages/shared/src/village/traits.ts) :

- Hash **FNV-1a** (32 bits, pur JS, browser-safe) sur la chaîne `${worldId}:${x}:${y}`.
- `worldId` sert de **sel par monde** : la même tile `(x, y)` ne donne pas le même trait d'un monde à l'autre (anti-métagaming). Pas de colonne `World.seed` — l'`id` du monde est déjà stable et immutable.
- Bucket sur `hash % 100` → distribution pondérée v2 : `0-14` DENSE_FOREST, `15-29` RICH_QUARRY, `30-44` IRON_VEIN, `45-59` FERTILE_SOIL, `60-74` HILL, `75-99` PLAINS (15 % chacun pour les 5 traits à effet + 25 % PLAINS). Les buckets ressource (`0-44`) sont **inchangés vs v1** : seule l'ancienne part PLAINS (`45-99`) a été re-scindée.
- Déterministe pur : même `(worldId, x, y)` → même trait sur N appels.

## Décisions tranchées (refinement run 088, figées)

Réponses aux 4 « Points à trancher » du ticket lab 01 :

| Question | Décision MVP |
| --- | --- |
| **Visible avant conquête ou scout ?** | **Scout uniquement** pour les villages d'autrui. Trait de son **propre** village visible sur son panneau. Jamais exposé sur la carte publique. |
| **Fixe ou scaling bâtiment ?** | **Fixe plat** (`×1.10`), indépendant du niveau → pas de snowball. |
| **Généré à la création ou lié à la tile ?** | **Lié à la tile** `(worldId, x, y)`, dérivé déterministe, posé à la création. Un village conquis conserve le trait de son spot. |
| **Applicable aux barbares ?** | **Oui**, dès la création — tout village (joueur et barbare) a un trait. |

## Révélation (anti-fuite intel)

- **Son propre village** : trait exposé par l'endpoint owner-scoped `GET /villages?worldId=` ([`village.service.getVillages`](../../battleforthecrown-backend/src/modules/village/village.service.ts)), affiché sur le panneau du village.
- **Village ennemi (joueur ou barbare)** : trait révélé **uniquement** après scout — dans le rapport (`details.naturalTrait`, même pattern que `wallLevel`/`castleLevel` — cf. [`11-scouting.md`](./11-scouting.md)) **et** sur le panneau carte du village, via `VillageIntelDto.naturalTrait`. Ce champ n'est projeté par `IntelService.getIntel` que si un row intel scout existe pour le viewer (pas de scout → `getIntel` renvoie `null` → aucun trait). Le trait étant FIXE, `getIntel` lit la valeur live du `Village` (== valeur au scout, aucune péremption).
- **Affichage** : sur les 3 surfaces (panneau de son propre village, rapport de scout, panneau carte scouté), le trait est un badge cliquable (`NaturalTraitBadge`) ouvrant une modale explicative (bonus, ressource, permanence). Header du village en variante `icon-only` (contrainte de largeur), les autres en `full` (icône + label).
- **Carte publique** (`world-entities-query`) : `naturalTrait` **n'apparaît jamais** dans les payloads `PLAYER_VILLAGE`/`BARBARIAN_VILLAGE`. Cet endpoint sert la même donnée à tous les clients (pas de viewer scope) → l'exposer serait une fuite. Le blip ennemi reste foggé avec un `id` stable (sélectionnable avant scout). Verrouillé par test guard.

## Persistance & backfill

- Colonne `Village.naturalTrait` (enum `VillageNaturalTrait`), **NOT NULL, sans DEFAULT DB** : force la pose explicite au create (une insertion sans trait échoue bruyamment).
- **Villages pré-existants** (mondes déjà ouverts) : backfill dans la migration en SQL natif — `md5(world_id || ':' || x || ':' || y)` bucketé sur la distribution pondérée v1 (set-based, une passe), puis `SET NOT NULL`.
- **Extension v2 (HILL / FERTILE_SOIL)** — migration option **(a) « nouveaux villages uniquement »** : `ALTER TYPE ... ADD VALUE`, **aucun backfill ni re-dérivation** des villages existants. L'invariant « trait fixe, jamais modifié » est préservé (un `PLAINS` existant ne peut pas devenir `HILL`). Conséquence assumée : les deux nouveaux traits n'apparaissent que sur les villages créés après la migration (mondes neufs ou nouveaux villages). Alternative (b) re-dérivation backfill **rejetée** : romprait la promesse de trait fixe sur les mondes ouverts.
- **Parité per-tile TS ↔ SQL non garantie et non requise** : les nouveaux villages utilisent le hash FNV-1a (TS) au create, les villages backfillés le hash `md5` (SQL). Les deux tirent la **même distribution pondérée** ; chaque village reçoit un trait **stable** une fois assigné. Un joueur ne peut pas observer la fonction de hash, donc aucune incohérence perceptible — seule compte la stabilité par village et l'homogénéité de la distribution, toutes deux garanties.

Détail entité : [`docs/architecture/data-model.md`](../architecture/data-model.md).

## Contrats partagés

[`@battleforthecrown/shared/village`](../../packages/shared/src/village/traits.ts) : `VillageNaturalTrait`, `NATURAL_TRAIT_PRODUCTION_BONUS`, `NATURAL_TRAIT_POPULATION_BONUS`, `NATURAL_TRAIT_DISPLAY` (label FR + icône), `deriveNaturalTrait(worldId, x, y)`.
[`ScoutReportResponse.details.naturalTrait`](../../packages/shared/src/combat/dtos.ts) et [`JoinedVillage.naturalTrait`](../../packages/shared/src/world/dtos.ts).

## Suivi taxonomie v2 (follow-up)

Les trois traits non-ressource du lab, débloqués par les mécaniques sœurs désormais livrées. La **fondation taxonomie v2** (enum + distribution + migration) est posée en une fois (run 102) pour éviter une double migration de l'enum Postgres :

- ✅ **Terre fertile** (`FERTILE_SOIL`, +10 % population Quartier) — **livré (run 102)** : `NATURAL_TRAIT_POPULATION_BONUS` + `applyPopulationBonus` (backend) + badge/modale front.
- 🟡 **Colline** (`HILL`, bonus vision Watchtower) — **trait posé** dans l'enum/distribution (run 102), **effet vision branché dans un run successeur** (`vision.ts` + `vision.service.ts` + disques Pixi). Inerte au jeu d'ici là.
- ⏳ **Plaine** (`PLAINS`, départ d'armée plus rapide) — **différé** : dépend de la mobilité (`armySpeedBonus` dans `calculateTravelTime`). La part de `PLAINS` a déjà été calée à 25 % (< plafond anti-snowball 30 %) pour accueillir cet effet sans redistribution.

Note : la couche cosmétique front [`worldTerrain.ts`](../../battleforthecrown-pixi/src/pixi/scenes) (seed-based, non-autoritative) est **distincte** du trait serveur. Ne pas s'appuyer dessus comme source de vérité ; une synergie visuelle (aligner l'icône de trait sur le terrain rendu) est un follow-up cosmétique, pas un livrable.

## Références

- [`01-natural-village-traits.md`](./lab/tickets/01-natural-village-traits.md) — ticket lab source (promu).
- [`02-economy-and-progression.md`](./02-economy-and-progression.md) — production passive (base du bonus).
- [`11-scouting.md`](./11-scouting.md) — révélation scout.
- [`12-village-styles.md`](./12-village-styles.md) — styles *choisis* (mécanique sœur, distincte).
- [`26-private-map-markers.md`](./26-private-map-markers.md) — précédent de promotion lab → spec sur tile `(worldId, x, y)`.
