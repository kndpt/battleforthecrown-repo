import { getStrategyBonusValue } from '@battleforthecrown/shared/village';

describe('getStrategyBonusValue', () => {
  it('returns neutral scalar bonuses for BALANCED', () => {
    expect(getStrategyBonusValue('BALANCED', 'attackBonus')).toBe(1);
    expect(getStrategyBonusValue('BALANCED', 'defenseBonus')).toBe(1);
    expect(getStrategyBonusValue('BALANCED', 'lootBonus')).toBe(1);
  });

  it('returns strategy-specific scalar bonuses', () => {
    expect(getStrategyBonusValue('FORTRESS', 'defenseBonus')).toBe(1.25);
    expect(getStrategyBonusValue('FORTRESS', 'storageBonus')).toBe(1.1);
    expect(getStrategyBonusValue('RAIDERS', 'lootBonus')).toBe(1.1);
    expect(getStrategyBonusValue('RAIDERS', 'armySpeedBonus')).toBe(1.15);
  });

  it('merges partial production bonuses with neutral defaults', () => {
    expect(getStrategyBonusValue('ECONOMIC', 'productionBonus')).toEqual({
      WOOD: 1.2,
      STONE: 1.2,
      IRON: 1.2,
    });
  });

  it('fills unspecified bonuses with base defaults', () => {
    expect(getStrategyBonusValue('FORTRESS', 'attackBonus')).toBe(1);
    expect(getStrategyBonusValue('RAIDERS', 'constructionSpeedBonus')).toBe(1);
    expect(getStrategyBonusValue('ECONOMIC', 'trainingSpeedBonus')).toBe(1);
  });
});
