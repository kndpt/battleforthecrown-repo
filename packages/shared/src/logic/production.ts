import { getBuildingProduction, ResourceBuildingType } from '../resources';
import { getStrategyBonusValue, VillageStrategyType } from '../village/strategy';

export function calculateProductionRate(
  buildingType: ResourceBuildingType,
  level: number,
  speedMultiplier: number,
  strategy?: VillageStrategyType
): number {
  const baseRatePerMinute = getBuildingProduction(buildingType, level);
  if (baseRatePerMinute === null) {
    return 0;
  }

  let rate = baseRatePerMinute * speedMultiplier;

  if (strategy) {
    const productionBonus = getStrategyBonusValue(
      strategy,
      'productionBonus'
    ) as Record<string, number>;
    
    if (productionBonus && productionBonus[buildingType]) {
      rate *= productionBonus[buildingType];
    }
  }

  return rate;
}
