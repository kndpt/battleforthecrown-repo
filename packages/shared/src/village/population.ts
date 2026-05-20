export const QUARTER_POPULATION_LIMITS: Readonly<Record<number, number>> =
  Object.freeze({
    1: 250,
    2: 279,
    3: 310,
    4: 346,
    5: 385,
  });

const definedLevels = Object.keys(QUARTER_POPULATION_LIMITS).map(Number);
const minLevel = Math.min(...definedLevels);

export const getQuarterPopulationLimit = (level: number): number => {
  return (
    QUARTER_POPULATION_LIMITS[level] ?? QUARTER_POPULATION_LIMITS[minLevel]
  );
};
