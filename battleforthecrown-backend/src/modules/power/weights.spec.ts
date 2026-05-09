import {
  getBuildingPowerWeight,
  getUnitPowerWeight,
} from '@battleforthecrown/shared/power';

describe('power weights — fallbacks (pure logic)', () => {
  it('returns the default building weight (5) for an unknown building type', () => {
    expect(getBuildingPowerWeight('NOT_A_REAL_BUILDING')).toBe(5);
  });

  it('returns the default unit weight (1) for an unknown unit type', () => {
    expect(getUnitPowerWeight('NOT_A_REAL_UNIT')).toBe(1);
  });
});
