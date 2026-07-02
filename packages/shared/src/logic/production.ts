import { getBuildingProduction, ResourceBuildingType } from '../resources';
import { getStrategyBonusValue, VillageStrategyType } from '../village/strategy';
import {
  NATURAL_TRAIT_PRODUCTION_BONUS,
  VillageNaturalTrait,
} from '../village/traits';

export function calculateProductionRate(
  buildingType: ResourceBuildingType,
  level: number,
  speedMultiplier: number,
  strategy?: VillageStrategyType,
  naturalTrait?: VillageNaturalTrait | null
): number {
  const baseRatePerMinute = getBuildingProduction(buildingType, level);
  if (baseRatePerMinute === null) {
    return 0;
  }

  let rate = baseRatePerMinute * speedMultiplier;

  if (strategy) {
    const productionBonus = getStrategyBonusValue(strategy, 'productionBonus');

    const factor = productionBonus[buildingType as keyof typeof productionBonus];
    if (factor) {
      rate *= factor;
    }
  }

  // Facteur trait naturel appliqué APRÈS le facteur strategy (multiplicatif,
  // plat, indépendant du niveau). `buildingType` (ResourceBuildingType) est
  // structurellement une `ResourceType`, indexation directe.
  // Cf. docs/gameplay/27-village-natural-traits.md.
  if (naturalTrait) {
    const traitFactor = NATURAL_TRAIT_PRODUCTION_BONUS[naturalTrait][buildingType];
    if (traitFactor) {
      rate *= traitFactor;
    }
  }

  return rate;
}
