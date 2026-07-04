# 27 — Traits naturels de village (MVP)

**Statut** : spec MVP livrée (run 088, promotion du lab [`tickets/01-natural-village-traits.md`](./lab/tickets/01-natural-village-traits.md)).
**Type** : identité de position, économie légère. Périmètre MVP = **traits de ressource uniquement**.

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

### Traits (périmètre MVP)

| Trait | Effet éco | Ressource |
| --- | --- | --- |
| 🌲 **DENSE_FOREST** (Forêt dense) | +10 % production passive | Bois |
| ⛏️ **RICH_QUARRY** (Carrière riche) | +10 % production passive | Pierre |
| ⚒️ **IRON_VEIN** (Veine de fer) | +10 % production passive | Fer |
| 🌾 **PLAINS** (Plaine) | Aucun bonus (neutre) | — |

- **Bonus plat** : facteur multiplicatif constant `×1.10` sur la production passive de la ressource concernée, **indépendant du niveau de bâtiment** → zéro snowball (le facteur ne grandit jamais ; seul le gain absolu suit la base, comme tout multiplicateur).
- **PLAINS** n'applique aucun bonus (production == baseline sans trait). Majoritaire (~55 % des tiles) → les bons spots restent rares et convoités.
- Aucun scaling bâtiment, aucun effet combat / vision / mobilité / population au MVP.

### Dérivation déterministe

Fonction pure [`deriveNaturalTrait(worldId, x, y)`](../../packages/shared/src/village/traits.ts) :

- Hash **FNV-1a** (32 bits, pur JS, browser-safe) sur la chaîne `${worldId}:${x}:${y}`.
- `worldId` sert de **sel par monde** : la même tile `(x, y)` ne donne pas le même trait d'un monde à l'autre (anti-métagaming). Pas de colonne `World.seed` — l'`id` du monde est déjà stable et immutable.
- Bucket sur `hash % 100` → distribution pondérée : `0-14` DENSE_FOREST, `15-29` RICH_QUARRY, `30-44` IRON_VEIN, `45-99` PLAINS.
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
- **Villages pré-existants** (mondes déjà ouverts) : backfill dans la migration en SQL natif — `md5(world_id || ':' || x || ':' || y)` bucketé sur la même distribution pondérée (set-based, une passe), puis `SET NOT NULL`.
- **Parité per-tile TS ↔ SQL non garantie et non requise** : les nouveaux villages utilisent le hash FNV-1a (TS) au create, les villages backfillés le hash `md5` (SQL). Les deux tirent la **même distribution pondérée** ; chaque village reçoit un trait **stable** une fois assigné. Un joueur ne peut pas observer la fonction de hash, donc aucune incohérence perceptible — seule compte la stabilité par village et l'homogénéité de la distribution, toutes deux garanties.

Détail entité : [`docs/architecture/data-model.md`](../architecture/data-model.md).

## Contrats partagés

[`@battleforthecrown/shared/village`](../../packages/shared/src/village/traits.ts) : `VillageNaturalTrait`, `NATURAL_TRAIT_PRODUCTION_BONUS`, `NATURAL_TRAIT_DISPLAY` (label FR + icône), `deriveNaturalTrait(worldId, x, y)`.
[`ScoutReportResponse.details.naturalTrait`](../../packages/shared/src/combat/dtos.ts) et [`JoinedVillage.naturalTrait`](../../packages/shared/src/world/dtos.ts).

## Hors scope MVP (follow-up)

Traits documentés dans le lab mais **non livrés** — candidats post-MVP, à rouvrir avec les mécaniques sœurs :

- **Colline** (bonus vision Watchtower) — dépend de la couche vision.
- **Plaine** (départ d'armée plus rapide) — dépend de la mobilité (`armySpeedBonus`).
- **Terre fertile** (bonus population Quartier) — dépend de la population.

Ces trois demandent de brancher des systèmes hors production passive → reportés pour garder le MVP borné aux traits de ressource.

Note : la couche cosmétique front [`worldTerrain.ts`](../../battleforthecrown-pixi/src/pixi/scenes) (seed-based, non-autoritative) est **distincte** du trait serveur. Ne pas s'appuyer dessus comme source de vérité ; une synergie visuelle (aligner l'icône de trait sur le terrain rendu) est un follow-up cosmétique, pas un livrable.

## Références

- [`01-natural-village-traits.md`](./lab/tickets/01-natural-village-traits.md) — ticket lab source (promu).
- [`02-economy-and-progression.md`](./02-economy-and-progression.md) — production passive (base du bonus).
- [`11-scouting.md`](./11-scouting.md) — révélation scout.
- [`12-village-styles.md`](./12-village-styles.md) — styles *choisis* (mécanique sœur, distincte).
- [`26-private-map-markers.md`](./26-private-map-markers.md) — précédent de promotion lab → spec sur tile `(worldId, x, y)`.
