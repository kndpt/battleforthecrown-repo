import { describe, expect, it } from 'vitest';
import {
  QUARTER_POPULATION_LIMITS,
  getQuarterPopulationLimit,
} from './population';

// Independent oracle: the expected values are re-declared here so the table
// under test is asserted against a separate source. Comparing the table to
// itself would let an erroneous-but-monotonic table pass unnoticed.
const EXPECTED_LIMITS: Readonly<Record<number, number>> = {
  1: 250,
  2: 279,
  3: 310,
  4: 346,
  5: 385,
  6: 430,
  7: 480,
  8: 535,
  9: 595,
  10: 665,
};

describe('QUARTER_POPULATION_LIMITS', () => {
  it('matches the expected value and is strictly increasing for levels 1 through 10', () => {
    for (let level = 1; level <= 10; level++) {
      expect(QUARTER_POPULATION_LIMITS[level]).toBe(EXPECTED_LIMITS[level]);
      if (level > 1) {
        expect(QUARTER_POPULATION_LIMITS[level]).toBeGreaterThan(
          QUARTER_POPULATION_LIMITS[level - 1],
        );
      }
    }
  });
});

describe('getQuarterPopulationLimit', () => {
  it('returns the expected value for defined integer levels', () => {
    for (let level = 1; level <= 10; level++) {
      expect(getQuarterPopulationLimit(level)).toBe(EXPECTED_LIMITS[level]);
    }
  });

  it('floors fractional levels before lookup', () => {
    expect(getQuarterPopulationLimit(3.9)).toBe(EXPECTED_LIMITS[3]);
    expect(getQuarterPopulationLimit(1.01)).toBe(EXPECTED_LIMITS[1]);
  });

  it('clamps levels below the minimum to level 1', () => {
    expect(getQuarterPopulationLimit(0)).toBe(EXPECTED_LIMITS[1]);
    expect(getQuarterPopulationLimit(-5)).toBe(EXPECTED_LIMITS[1]);
  });

  it('clamps levels above the maximum to level 10', () => {
    expect(getQuarterPopulationLimit(11)).toBe(EXPECTED_LIMITS[10]);
    expect(getQuarterPopulationLimit(999)).toBe(EXPECTED_LIMITS[10]);
  });

  it('falls back to the minimum level for non-finite input', () => {
    expect(getQuarterPopulationLimit(Number.NaN)).toBe(EXPECTED_LIMITS[1]);
    expect(getQuarterPopulationLimit(Number.POSITIVE_INFINITY)).toBe(
      EXPECTED_LIMITS[1],
    );
    expect(getQuarterPopulationLimit(Number.NEGATIVE_INFINITY)).toBe(
      EXPECTED_LIMITS[1],
    );
  });
});
