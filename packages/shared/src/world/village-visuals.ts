import { clampBuildingLevel } from "../utils/level";

export type VillageVisualTier = 1 | 2 | 3 | 4 | 5 | 6;

const CASTLE_LEVEL_TO_VILLAGE_TIER: Record<number, VillageVisualTier> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 4,
  8: 5,
  9: 6,
  10: 6,
};

export function villageVisualTierFromCastleLevel(
  level: number,
): VillageVisualTier {
  return CASTLE_LEVEL_TO_VILLAGE_TIER[clampBuildingLevel(level)];
}
