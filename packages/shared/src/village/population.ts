export const QUARTER_POPULATION_LIMITS: Readonly<Record<number, number>> =
  Object.freeze({
    1: 250,
    2: 279,
    3: 310,
    4: 346,
    5: 385,
    6: 430,
    7: 480,
    8: 535,
    9: 595,
    10: 665,
  });

const definedLevels = Object.keys(QUARTER_POPULATION_LIMITS).map(Number);
const minLevel = Math.min(...definedLevels);
const maxLevel = Math.max(...definedLevels);

export const getQuarterPopulationLimit = (level: number): number => {
  const normalizedLevel = Number.isFinite(level) ? Math.floor(level) : minLevel;
  const clampedLevel = Math.max(minLevel, Math.min(maxLevel, normalizedLevel));

  return QUARTER_POPULATION_LIMITS[clampedLevel];
};
