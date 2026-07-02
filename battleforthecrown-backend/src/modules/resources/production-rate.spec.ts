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

  describe('natural trait', () => {
    it('boosts only the matching resource — DENSE_FOREST lifts wood, not stone/iron', () => {
      const level = 5;
      const base = RESOURCE_PRODUCTION_PER_MINUTE[level];

      // DENSE_FOREST produces strictly MORE wood than PLAINS (same everything).
      expect(
        calculateProductionRate('WOOD', level, 1, undefined, 'DENSE_FOREST'),
      ).toBeGreaterThan(
        calculateProductionRate('WOOD', level, 1, undefined, 'PLAINS'),
      );
      expect(
        calculateProductionRate('WOOD', level, 1, undefined, 'DENSE_FOREST'),
      ).toBe(base * 1.1);

      // Stone / iron unchanged by DENSE_FOREST.
      expect(
        calculateProductionRate('STONE', level, 1, undefined, 'DENSE_FOREST'),
      ).toBe(base);
      expect(
        calculateProductionRate('IRON', level, 1, undefined, 'DENSE_FOREST'),
      ).toBe(base);
    });

    it('PLAINS applies no bonus (production == baseline without trait)', () => {
      const level = 7;
      for (const type of ['WOOD', 'STONE', 'IRON'] as const) {
        expect(
          calculateProductionRate(type, level, 1, undefined, 'PLAINS'),
        ).toBe(calculateProductionRate(type, level, 1));
      }
    });

    it('trait factor is flat — does not scale with building level', () => {
      const ratio = (level: number) =>
        calculateProductionRate('IRON', level, 1, undefined, 'IRON_VEIN') /
        calculateProductionRate('IRON', level, 1);

      expect(ratio(2)).toBeCloseTo(1.1, 10);
      expect(ratio(9)).toBeCloseTo(1.1, 10);
      expect(ratio(2)).toBeCloseTo(ratio(9), 10);
    });

    it('applies trait after strategy (both factors multiply)', () => {
      const level = 10;
      const base = RESOURCE_PRODUCTION_PER_MINUTE[level];

      expect(
        calculateProductionRate('WOOD', level, 1, 'ECONOMIC', 'DENSE_FOREST'),
      ).toBeCloseTo(base * 1.2 * 1.1, 10);
    });
  });
});
