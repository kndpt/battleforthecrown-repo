import { describe, expect, it } from 'vitest';
import {
  calculateDistance,
  calculateTravelTime,
  CARAVAN_SPEED,
  CARRY_PER_PORTER,
  findSlowestUnitSpeed,
  getCaravanResourceCapacity,
  REFERENCE_SPEED,
} from './travel-time';

describe('calculateTravelTime', () => {
  it('takes REFERENCE_SPEED minutes per tile at speed=REFERENCE_SPEED, multiplier=1', () => {
    expect(calculateTravelTime(1, 1, REFERENCE_SPEED)).toBe(60 * 1000);
  });

  it('scales inversely with armySpeed', () => {
    expect(calculateTravelTime(10, 1, REFERENCE_SPEED)).toBe(10 * 60 * 1000);
    expect(calculateTravelTime(10, 1, REFERENCE_SPEED * 2)).toBe(5 * 60 * 1000);
  });

  it('scales inversely with speedMultiplier', () => {
    expect(calculateTravelTime(1, 2, REFERENCE_SPEED)).toBe(30 * 1000);
  });

  it('returns 0 when armySpeed is 0', () => {
    expect(calculateTravelTime(10, 1, 0)).toBe(0);
  });

  it('returns 0 when speedMultiplier is 0', () => {
    expect(calculateTravelTime(10, 0, REFERENCE_SPEED)).toBe(0);
  });

  it('applies RAIDERS armySpeedBonus (1.15) as a divisor', () => {
    expect(calculateTravelTime(1, 1, REFERENCE_SPEED, 'RAIDERS')).toBe(
      Math.round((60 * 1000) / 1.15),
    );
  });

  it('applies FORTRESS armySpeedBonus (0.8) as a divisor', () => {
    expect(calculateTravelTime(1, 1, REFERENCE_SPEED, 'FORTRESS')).toBe(
      Math.round((60 * 1000) / 0.8),
    );
  });

  it('BALANCED strategy leaves duration unchanged (no armySpeedBonus override)', () => {
    expect(calculateTravelTime(1, 1, REFERENCE_SPEED, 'BALANCED')).toBe(
      calculateTravelTime(1, 1, REFERENCE_SPEED),
    );
  });

  it('rounds the result to the nearest millisecond', () => {
    expect(calculateTravelTime(1, 1, 100)).toBe(Math.round((1 * REFERENCE_SPEED * 60000) / 100));
  });
});

describe('calculateDistance', () => {
  it('computes Euclidean distance', () => {
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
  });

  it('returns 0 for identical points', () => {
    expect(calculateDistance(7, 7, 7, 7)).toBe(0);
  });

  it('is symmetric', () => {
    expect(calculateDistance(1, 2, 5, 8)).toBe(calculateDistance(5, 8, 1, 2));
  });
});

describe('findSlowestUnitSpeed', () => {
  const unitStatsMap = {
    SPY: { speed: 100 },
    KNIGHT: { speed: 10 },
    PIKEMAN: { speed: 8 },
  };

  it('returns the minimum speed among units with positive quantity', () => {
    expect(
      findSlowestUnitSpeed({ SPY: 5, KNIGHT: 2, PIKEMAN: 1 }, unitStatsMap),
    ).toBe(8);
  });

  it('ignores units with zero or missing quantity', () => {
    expect(
      findSlowestUnitSpeed({ SPY: 5, KNIGHT: 0, PIKEMAN: undefined }, unitStatsMap),
    ).toBe(100);
  });

  it('returns 0 when no unit has a positive quantity', () => {
    expect(findSlowestUnitSpeed({}, unitStatsMap)).toBe(0);
  });

  it('skips unit types missing from unitStatsMap', () => {
    expect(
      findSlowestUnitSpeed({ UNKNOWN: 3, KNIGHT: 2 } as Record<string, number>, unitStatsMap),
    ).toBe(10);
  });
});

describe('getCaravanResourceCapacity', () => {
  it('takes 20% of each storage limit, floored', () => {
    expect(getCaravanResourceCapacity({ wood: 1000, stone: 999, iron: 1 })).toEqual({
      wood: 200,
      stone: 199,
      iron: 0,
    });
  });

  it('handles zero storage limits', () => {
    expect(getCaravanResourceCapacity({ wood: 0, stone: 0, iron: 0 })).toEqual({
      wood: 0,
      stone: 0,
      iron: 0,
    });
  });
});

describe('module constants', () => {
  it('exposes the calibration constants used by callers', () => {
    expect(REFERENCE_SPEED).toBe(6);
    expect(CARAVAN_SPEED).toBe(20);
    expect(CARRY_PER_PORTER).toBe(500);
  });
});
