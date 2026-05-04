export const FARM_POPULATION_LIMITS: Readonly<Record<number, number>> =
  Object.freeze({
    1: 250,
    2: 279,
    3: 310,
    4: 346,
    5: 385,
  });

const definedLevels = Object.keys(FARM_POPULATION_LIMITS).map(Number);
const minLevel = Math.min(...definedLevels);

export const getFarmPopulationLimit = (level: number): number => {
  return FARM_POPULATION_LIMITS[level] ?? FARM_POPULATION_LIMITS[minLevel];
};
