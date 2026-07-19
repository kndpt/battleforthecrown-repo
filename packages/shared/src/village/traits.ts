import type { ResourceType } from "../resources/types";

/**
 * Trait naturel d'un village — identité FIXE liée à sa tile, distincte du style
 * *choisi* ({@link VillageStrategyType}). Périmètre MVP : traits de ressource
 * uniquement. Cf. `docs/gameplay/27-village-natural-traits.md`.
 */
export type VillageNaturalTrait =
  | "DENSE_FOREST"
  | "RICH_QUARRY"
  | "IRON_VEIN"
  | "PLAINS"
  | "HILL"
  | "FERTILE_SOIL";

export const VILLAGE_NATURAL_TRAITS: readonly VillageNaturalTrait[] = [
  "DENSE_FOREST",
  "RICH_QUARRY",
  "IRON_VEIN",
  "PLAINS",
  "HILL",
  "FERTILE_SOIL",
] as const;

/**
 * Facteur de production plat par trait, appliqué APRÈS le facteur strategy dans
 * {@link calculateProductionRate}. Multiplicatif, constant, indépendant du
 * niveau de bâtiment → zéro snowball. PLAINS = neutre (aucune entrée).
 */
export const NATURAL_TRAIT_PRODUCTION_BONUS: Record<
  VillageNaturalTrait,
  Partial<Record<ResourceType, number>>
> = {
  DENSE_FOREST: { WOOD: 1.1 },
  RICH_QUARRY: { STONE: 1.1 },
  IRON_VEIN: { IRON: 1.1 },
  PLAINS: {},
  // HILL : effet vision (Watchtower) branché dans un run successeur — aucun
  // bonus de production. FERTILE_SOIL : effet population (cf.
  // {@link NATURAL_TRAIT_POPULATION_BONUS}), pas de bonus de production.
  HILL: {},
  FERTILE_SOIL: {},
};

/**
 * Facteur de population plat par trait, appliqué multiplicativement avec le
 * `populationBonus` du style dans `applyPopulationBonus` (backend), constant et
 * indépendant du niveau de bâtiment → zéro snowball. Seul `FERTILE_SOIL` (Terre
 * fertile) porte un bonus ; tous les autres traits sont neutres (`1`). Cf.
 * `docs/gameplay/27-village-natural-traits.md` § « Traits (taxonomie v2） ».
 */
export const NATURAL_TRAIT_POPULATION_BONUS: Record<VillageNaturalTrait, number> =
  {
    DENSE_FOREST: 1,
    RICH_QUARRY: 1,
    IRON_VEIN: 1,
    PLAINS: 1,
    HILL: 1,
    FERTILE_SOIL: 1.1,
  };

/**
 * Métadonnées d'affichage (label FR + icône + ressource boostée). Consommé par
 * le panneau de village (trait propre) et le rapport de scout (trait ennemi).
 */
export const NATURAL_TRAIT_DISPLAY: Record<
  VillageNaturalTrait,
  { label: string; icon: string; boostedResource: ResourceType | null }
> = {
  DENSE_FOREST: { label: "Forêt dense", icon: "🌲", boostedResource: "WOOD" },
  RICH_QUARRY: { label: "Carrière riche", icon: "⛏️", boostedResource: "STONE" },
  IRON_VEIN: { label: "Veine de fer", icon: "⚒️", boostedResource: "IRON" },
  PLAINS: { label: "Plaine", icon: "🌾", boostedResource: null },
  HILL: { label: "Colline", icon: "⛰️", boostedResource: null },
  FERTILE_SOIL: { label: "Terre fertile", icon: "🌱", boostedResource: null },
};

/**
 * Hash FNV-1a 32 bits, pur JS (browser-safe, aucun import node). Déterministe.
 */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Trait naturel déterministe d'une tile. `worldId` sert de sel par monde : la
 * même tile `(x, y)` ne donne pas le même trait d'un monde à l'autre
 * (anti-métagaming). Distribution pondérée v2 : 15 % chacun pour les 5 traits à
 * effet (DENSE_FOREST / RICH_QUARRY / IRON_VEIN / FERTILE_SOIL / HILL) + 25 %
 * PLAINS. Même `(worldId, x, y)` → même trait sur N appels.
 *
 * Les buckets ressource (`0-44`) sont **inchangés** vs la taxonomie v1 : un
 * village qui dérivait DENSE_FOREST/RICH_QUARRY/IRON_VEIN garde son trait. Seule
 * l'ancienne part PLAINS (`45-99`) est re-scindée en FERTILE_SOIL / HILL /
 * PLAINS. PLAINS passe de 55 % à 25 % (< seuil anti-snowball 30 %) car il
 * portera l'army-speed dans un run successeur.
 *
 * ⚠️ Migration option (a) « nouveaux villages uniquement » : les villages
 * pré-existants gardent leur trait v1 (aucun backfill/re-dérivation), l'invariant
 * « trait fixe » de la spec 27 est préservé. Cf.
 * `docs/gameplay/27-village-natural-traits.md` § « Persistance & backfill ».
 */
export function deriveNaturalTrait(
  worldId: string,
  x: number,
  y: number,
): VillageNaturalTrait {
  const bucket = fnv1a32(`${worldId}:${x}:${y}`) % 100;
  if (bucket < 15) return "DENSE_FOREST";
  if (bucket < 30) return "RICH_QUARRY";
  if (bucket < 45) return "IRON_VEIN";
  if (bucket < 60) return "FERTILE_SOIL";
  if (bucket < 75) return "HILL";
  return "PLAINS";
}
