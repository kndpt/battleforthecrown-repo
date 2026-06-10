import { UNIT_TYPES } from '@battleforthecrown/shared/army';
import {
  BATTLE_UNIT_VALUES,
  applyPairDiminishingReturns,
  calculateOpponentMultiplier,
  calculateRawBattleValue,
} from '@battleforthecrown/shared/rankings';
import { UNIT_POWER_WEIGHTS } from '@battleforthecrown/shared/power';

describe('rankings glory formulas — pure logic', () => {
  it('uses battle values with NOBLE=400 without changing power weight NOBLE=100', () => {
    expect(BATTLE_UNIT_VALUES[UNIT_TYPES.NOBLE]).toBe(400);
    expect(UNIT_POWER_WEIGHTS[UNIT_TYPES.NOBLE]).toBe(100);
    expect(calculateRawBattleValue({ NOBLE: 1, MILITIA: 3 })).toBe(406);
  });

  it('clamps the opponent multiplier between 0.35 and 1.25', () => {
    expect(calculateOpponentMultiplier(1_000, 100)).toBe(0.35);
    expect(calculateOpponentMultiplier(1_000, 1_100)).toBe(1.1);
    expect(calculateOpponentMultiplier(1_000, 2_000)).toBe(1.25);
  });

  it('applies 24h pair diminishing returns at 2,000 and 5,000 raw points', () => {
    expect(applyPairDiminishingReturns(1_000, 0)).toBe(1_000);
    expect(applyPairDiminishingReturns(1_000, 1_500)).toBe(750);
    expect(applyPairDiminishingReturns(1_000, 4_500)).toBe(350);
    expect(applyPairDiminishingReturns(1_000, 5_000)).toBe(200);
  });
});
