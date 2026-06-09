import {
  CARAVAN_SPEED,
  calculateDistance,
  calculateTravelTime,
  findSlowestUnitSpeed,
  REFERENCE_SPEED,
} from '@battleforthecrown/shared/logic';
import { UNIT_STATS, UNIT_TYPES } from '@battleforthecrown/shared/army';

describe('calculateDistance', () => {
  it('returns 0 for the same point', () => {
    expect(calculateDistance(5, 5, 5, 5)).toBe(0);
  });

  it('computes horizontal distance', () => {
    expect(calculateDistance(0, 0, 4, 0)).toBe(4);
  });

  it('computes vertical distance', () => {
    expect(calculateDistance(0, 0, 0, 7)).toBe(7);
  });

  it('computes diagonal using 3-4-5 Pythagorean triple', () => {
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
  });

  it('is symmetric (direction independent)', () => {
    const a = calculateDistance(144, 249, 140, 231);
    const b = calculateDistance(140, 231, 144, 249);
    expect(a).toBeCloseTo(b);
  });

  it('matches the docstring example (≈18.44 tiles)', () => {
    expect(calculateDistance(144, 249, 140, 231)).toBeCloseTo(18.44, 1);
  });
});

describe('calculateTravelTime', () => {
  it('returns 0 when armySpeed is 0', () => {
    expect(calculateTravelTime(10, 1, 0)).toBe(0);
  });

  it('returns 0 when speedMultiplier is 0', () => {
    expect(calculateTravelTime(10, 0, REFERENCE_SPEED)).toBe(0);
  });

  it('returns 0 for zero distance', () => {
    expect(calculateTravelTime(0, 1, REFERENCE_SPEED)).toBe(0);
  });

  it('takes exactly 1 minute per tile at reference speed', () => {
    // speed = REFERENCE_SPEED, multiplier = 1 → 1 tile/min
    expect(calculateTravelTime(1, 1, REFERENCE_SPEED)).toBe(60_000);
  });

  it('scales linearly with distance', () => {
    const base = calculateTravelTime(1, 1, REFERENCE_SPEED);
    expect(calculateTravelTime(5, 1, REFERENCE_SPEED)).toBe(base * 5);
  });

  it('faster units (higher speed) arrive sooner', () => {
    const slow = calculateTravelTime(10, 1, REFERENCE_SPEED);
    const fast = calculateTravelTime(10, 1, REFERENCE_SPEED * 2);
    expect(fast).toBeLessThan(slow);
  });

  it('halves travel time when speedMultiplier doubles', () => {
    const base = calculateTravelTime(10, 1, REFERENCE_SPEED);
    expect(calculateTravelTime(10, 2, REFERENCE_SPEED)).toBe(base / 2);
  });

  it('rounds to the nearest millisecond', () => {
    // Ensure result is an integer (Math.round applied)
    const result = calculateTravelTime(1, 3, REFERENCE_SPEED);
    expect(result).toBe(Math.round(result));
  });

  it('makes caravans slower than cavalry at the same distance', () => {
    const distance = 10;
    const caravan = calculateTravelTime(distance, 1, CARAVAN_SPEED);
    const cavalry = calculateTravelTime(
      distance,
      1,
      UNIT_STATS[UNIT_TYPES.CAVALRY].speed,
    );

    expect(caravan).toBeGreaterThan(cavalry);
  });
});

describe('findSlowestUnitSpeed', () => {
  it('returns 0 with no units selected', () => {
    expect(findSlowestUnitSpeed({}, { MILITIA: { speed: 20 } })).toBe(0);
  });

  it('returns 0 when all quantities are 0', () => {
    expect(
      findSlowestUnitSpeed({ MILITIA: 0 }, { MILITIA: { speed: 20 } }),
    ).toBe(0);
  });

  it('returns the speed of the only unit', () => {
    expect(
      findSlowestUnitSpeed({ MILITIA: 5 }, { MILITIA: { speed: 20 } }),
    ).toBe(20);
  });

  it('returns the minimum speed across selected types', () => {
    const stats = {
      MILITIA: { speed: 20 },
      ARCHER: { speed: 18 },
      CAVALRY: { speed: 30 },
    };
    expect(
      findSlowestUnitSpeed({ MILITIA: 1, ARCHER: 1, CAVALRY: 1 }, stats),
    ).toBe(18);
  });

  it('ignores unit types with zero quantity', () => {
    const stats = { MILITIA: { speed: 5 }, ARCHER: { speed: 18 } };
    // MILITIA has qty 0 — only ARCHER counts
    expect(findSlowestUnitSpeed({ MILITIA: 0, ARCHER: 3 }, stats)).toBe(18);
  });

  it('ignores selected units absent from statsMap', () => {
    const stats = { ARCHER: { speed: 18 } };
    // CAVALRY selected but not in statsMap — only ARCHER counts
    expect(findSlowestUnitSpeed({ CAVALRY: 5, ARCHER: 2 }, stats)).toBe(18);
  });
});
