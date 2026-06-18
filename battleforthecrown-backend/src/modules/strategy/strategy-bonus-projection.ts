import {
  BASE_VILLAGE_STRATEGY_BONUS,
  StrategyBonus,
  VillageStrategyType,
  getStrategyBonusValue,
} from '@battleforthecrown/shared/village';

export type StrategyBonusContext =
  | 'combat'
  | 'production'
  | 'construction'
  | 'training'
  | 'storage'
  | 'population';

const STRATEGY_BONUS_KEYS_BY_CONTEXT: Record<
  StrategyBonusContext,
  readonly (keyof StrategyBonus)[]
> = {
  combat: ['attackBonus', 'defenseBonus', 'lootBonus'],
  training: ['trainingSpeedBonus', 'unitCostReduction'],
  production: ['productionBonus'],
  construction: ['constructionSpeedBonus'],
  storage: ['storageBonus'],
  population: ['populationBonus'],
};

export function projectStrategyBonusForContext(
  strategy: VillageStrategyType,
  context: StrategyBonusContext,
): Required<StrategyBonus> {
  const bonus: Required<StrategyBonus> = { ...BASE_VILLAGE_STRATEGY_BONUS };
  for (const key of STRATEGY_BONUS_KEYS_BY_CONTEXT[context]) {
    assignBonus(bonus, strategy, key);
  }
  return bonus;
}

function assignBonus<K extends keyof StrategyBonus>(
  target: Required<StrategyBonus>,
  strategy: VillageStrategyType,
  key: K,
): void {
  target[key] = getStrategyBonusValue(strategy, key);
}
