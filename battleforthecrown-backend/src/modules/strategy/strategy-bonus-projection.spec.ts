import { BASE_VILLAGE_STRATEGY_BONUS } from '@battleforthecrown/shared/village';
import { projectStrategyBonusForContext } from './strategy-bonus-projection';

describe('projectStrategyBonusForContext', () => {
  it('combat projects attack/defense/loot from strategy and leaves the rest at base', () => {
    const bonus = projectStrategyBonusForContext('FORTRESS', 'combat');
    expect(bonus.defenseBonus).toBe(1.25);
    expect(bonus.attackBonus).toBe(BASE_VILLAGE_STRATEGY_BONUS.attackBonus);
    expect(bonus.lootBonus).toBe(BASE_VILLAGE_STRATEGY_BONUS.lootBonus);
    expect(bonus.populationBonus).toBe(
      BASE_VILLAGE_STRATEGY_BONUS.populationBonus,
    );
    expect(bonus.storageBonus).toBe(BASE_VILLAGE_STRATEGY_BONUS.storageBonus);
  });

  it('training projects training speed + unit cost reduction', () => {
    const bonus = projectStrategyBonusForContext('RAIDERS', 'training');
    expect(bonus.trainingSpeedBonus).toBe(
      BASE_VILLAGE_STRATEGY_BONUS.trainingSpeedBonus,
    );
    expect(bonus.unitCostReduction).toBe(
      BASE_VILLAGE_STRATEGY_BONUS.unitCostReduction,
    );
    expect(bonus.lootBonus).toBe(BASE_VILLAGE_STRATEGY_BONUS.lootBonus);
  });

  it('production projects the resource-keyed production bonus', () => {
    const bonus = projectStrategyBonusForContext('ECONOMIC', 'production');
    expect(bonus.productionBonus).toEqual({ WOOD: 1.2, STONE: 1.2, IRON: 1.2 });
    expect(bonus.trainingSpeedBonus).toBe(
      BASE_VILLAGE_STRATEGY_BONUS.trainingSpeedBonus,
    );
  });

  it('construction projects construction speed only', () => {
    const bonus = projectStrategyBonusForContext('ECONOMIC', 'construction');
    expect(bonus.constructionSpeedBonus).toBe(
      BASE_VILLAGE_STRATEGY_BONUS.constructionSpeedBonus,
    );
    expect(bonus.productionBonus).toEqual(
      BASE_VILLAGE_STRATEGY_BONUS.productionBonus,
    );
  });

  it('storage projects storage bonus only', () => {
    const bonus = projectStrategyBonusForContext('FORTRESS', 'storage');
    expect(bonus.storageBonus).toBe(1.1);
    expect(bonus.defenseBonus).toBe(BASE_VILLAGE_STRATEGY_BONUS.defenseBonus);
  });

  it('population projects population bonus only', () => {
    const bonus = projectStrategyBonusForContext('BALANCED', 'population');
    expect(bonus.populationBonus).toBe(
      BASE_VILLAGE_STRATEGY_BONUS.populationBonus,
    );
    expect(bonus.defenseBonus).toBe(BASE_VILLAGE_STRATEGY_BONUS.defenseBonus);
  });

  it('BALANCED returns the base bonus values across all contexts', () => {
    const contexts = [
      'combat',
      'training',
      'production',
      'construction',
      'storage',
      'population',
    ] as const;
    for (const context of contexts) {
      expect(projectStrategyBonusForContext('BALANCED', context)).toEqual(
        BASE_VILLAGE_STRATEGY_BONUS,
      );
    }
  });
});
