/** Building / castle level helpers (levels are integers in the 1–10 range). */

export const MIN_BUILDING_LEVEL = 1;
export const MAX_BUILDING_LEVEL = 10;

/**
 * Normalize an arbitrary numeric level into the canonical building level range:
 * floor to an integer, clamp to [MIN_BUILDING_LEVEL, MAX_BUILDING_LEVEL], and
 * fall back to MIN_BUILDING_LEVEL for non-finite input (NaN, Infinity).
 */
export const clampBuildingLevel = (level: number): number => {
  const normalized = Number.isFinite(level)
    ? Math.floor(level)
    : MIN_BUILDING_LEVEL;
  return Math.max(MIN_BUILDING_LEVEL, Math.min(MAX_BUILDING_LEVEL, normalized));
};
