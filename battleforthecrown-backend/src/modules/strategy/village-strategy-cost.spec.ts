import {
  VILLAGE_STRATEGY_BASE_CHANGE_COSTS,
  VILLAGE_STRATEGY_COST_CASTLE_BASE_LEVEL,
  VILLAGE_STRATEGY_COST_CASTLE_MULTIPLIER,
  getVillageStrategyChangeCost,
} from '@battleforthecrown/shared/village';

describe('getVillageStrategyChangeCost', () => {
  it('returns base costs at the castle reference level', () => {
    const base = VILLAGE_STRATEGY_BASE_CHANGE_COSTS.FORTRESS;

    expect(
      getVillageStrategyChangeCost(
        'FORTRESS',
        VILLAGE_STRATEGY_COST_CASTLE_BASE_LEVEL,
      ),
    ).toEqual(base);
  });

  it('does not discount costs below the castle reference level', () => {
    const atReference = getVillageStrategyChangeCost(
      'FORTRESS',
      VILLAGE_STRATEGY_COST_CASTLE_BASE_LEVEL,
    );
    const belowReference = getVillageStrategyChangeCost('FORTRESS', 1);

    expect(belowReference).toEqual(atReference);
  });

  it('scales costs with the castle multiplier above the reference level', () => {
    const castleLevel = VILLAGE_STRATEGY_COST_CASTLE_BASE_LEVEL + 1;
    const multiplier = Math.pow(
      VILLAGE_STRATEGY_COST_CASTLE_MULTIPLIER,
      castleLevel - VILLAGE_STRATEGY_COST_CASTLE_BASE_LEVEL,
    );
    const base = VILLAGE_STRATEGY_BASE_CHANGE_COSTS.RAIDERS;

    expect(getVillageStrategyChangeCost('RAIDERS', castleLevel)).toEqual({
      wood: Math.floor(base.wood * multiplier),
      stone: Math.floor(base.stone * multiplier),
      iron: Math.floor(base.iron * multiplier),
      crowns: Math.floor(base.crowns * multiplier),
    });
  });

  it('keeps per-strategy base costs distinct at the reference level', () => {
    expect(getVillageStrategyChangeCost('ECONOMIC', 4).wood).toBe(100);
    expect(getVillageStrategyChangeCost('RAIDERS', 4).iron).toBe(200);
    expect(getVillageStrategyChangeCost('BALANCED', 4).crowns).toBe(80);
  });
});
