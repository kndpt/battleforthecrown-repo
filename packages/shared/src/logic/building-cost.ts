import { getBuildingLevelValues } from '../village/buildings';
import { getStrategyBonusValue, VillageStrategyType } from '../village/strategy';
import { CASTLE_CONSTRUCTION_SPEED_BONUS } from '../village/buildings';
import { MS_PER_SECOND } from '../time';

export interface BuildingCostResult {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  time: number;
}

export function calculateBuildingCost(
  buildingType: string,
  level: number,
  castleLevel: number = 1,
  speedMultiplier: number = 1,
  strategy?: VillageStrategyType
): BuildingCostResult {
  const levelValues = getBuildingLevelValues(buildingType, level);
  if (!levelValues) {
    throw new Error(`No cost found for building ${buildingType} level ${level}`);
  }

  let cost = {
    wood: levelValues.wood,
    stone: levelValues.stone,
    iron: levelValues.iron,
    population: levelValues.population,
  };
  let baseTimeSeconds = levelValues.timeSeconds;

  // Apply strategy bonuses
  if (strategy) {
    const buildingCostReduction = getStrategyBonusValue(
      strategy,
      'buildingCostReduction'
    ) as number;
    const constructionSpeedBonus = getStrategyBonusValue(
      strategy,
      'constructionSpeedBonus'
    ) as number;

    if (buildingCostReduction !== 1.0) {
      cost = {
        wood: Math.floor(cost.wood * buildingCostReduction),
        stone: Math.floor(cost.stone * buildingCostReduction),
        iron: Math.floor(cost.iron * buildingCostReduction),
        population: cost.population,
      };
    }

    if (constructionSpeedBonus !== 1.0) {
      baseTimeSeconds = baseTimeSeconds / constructionSpeedBonus;
    }
  }

  const castleBonus =
    CASTLE_CONSTRUCTION_SPEED_BONUS[castleLevel] ||
    CASTLE_CONSTRUCTION_SPEED_BONUS[1];

  const actualTimeSeconds = (baseTimeSeconds * castleBonus) / speedMultiplier;
  const actualTimeMs = Math.max(
    MS_PER_SECOND,
    Math.round(actualTimeSeconds * MS_PER_SECOND),
  );

  return {
    wood: cost.wood,
    stone: cost.stone,
    iron: cost.iron,
    population: cost.population,
    time: actualTimeMs,
  };
}
