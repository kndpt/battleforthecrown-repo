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
  | "PLAINS";

export const VILLAGE_NATURAL_TRAITS: readonly VillageNaturalTrait[] = [
  "DENSE_FOREST",
  "RICH_QUARRY",
  "IRON_VEIN",
  "PLAINS",
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
 * (anti-métagaming). Distribution pondérée : 15 % / 15 % / 15 % ressource,
 * 55 % PLAINS. Même `(worldId, x, y)` → même trait sur N appels.
 *
 * ⚠️ La migration backfill (villages pré-existants) utilise un hash SQL natif
 * (`md5`) sur la même distribution : parité per-tile TS↔SQL non requise, seule
 * comptent la stabilité par village et l'homogénéité de la distribution. Cf.
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
  return "PLAINS";
}
