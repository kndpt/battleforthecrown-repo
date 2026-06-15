import { calculateProductionRate } from '@battleforthecrown/shared/logic';
import {
  getBuildingProduction,
  RESOURCE_PRODUCTION_PER_MINUTE,
} from '@battleforthecrown/shared/resources';

describe('calculateProductionRate', () => {
  it('returns base per-minute rate scaled by world speed multiplier', () => {
    const level = 5;
    const base = getBuildingProduction('WOOD', level)!;

    expect(calculateProductionRate('WOOD', level, 1)).toBe(base);
    expect(calculateProductionRate('WOOD', level, 2)).toBe(base * 2);
  });

  it('returns 0 for out-of-range building levels', () => {
    expect(calculateProductionRate('WOOD', 0, 1)).toBe(0);
    expect(calculateProductionRate('WOOD', 99, 1)).toBe(0);
    expect(calculateProductionRate('STONE', 11, 1)).toBe(0);
  });

  it('applies ECONOMIC production bonus to all resource types', () => {
    const level = 10;
    const base = RESOURCE_PRODUCTION_PER_MINUTE[level];

    expect(calculateProductionRate('WOOD', level, 1, 'ECONOMIC')).toBe(
      base * 1.2,
    );
    expect(calculateProductionRate('STONE', level, 1, 'ECONOMIC')).toBe(
      base * 1.2,
    );
    expect(calculateProductionRate('IRON', level, 1, 'ECONOMIC')).toBe(
      base * 1.2,
    );
  });

  it('leaves rate unchanged for BALANCED strategy', () => {
    const level = 3;
    const neutral = calculateProductionRate('IRON', level, 1);

    expect(calculateProductionRate('IRON', level, 1, 'BALANCED')).toBe(neutral);
  });

  it('composes speed multiplier with strategy production bonus', () => {
    const level = 1;
    const base = RESOURCE_PRODUCTION_PER_MINUTE[level];

    expect(calculateProductionRate('WOOD', level, 2, 'ECONOMIC')).toBe(
      base * 2 * 1.2,
    );
  });
});
