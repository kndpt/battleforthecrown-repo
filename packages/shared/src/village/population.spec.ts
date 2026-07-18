import { describe, expect, it } from 'vitest';
import {
  QUARTER_POPULATION_LIMITS,
  getQuarterPopulationLimit,
} from './population';

describe('QUARTER_POPULATION_LIMITS', () => {
  it('has strictly increasing entries for levels 1 through 10', () => {
    for (let level = 1; level <= 10; level++) {
      expect(QUARTER_POPULATION_LIMITS[level]).toBeGreaterThan(0);
      if (level > 1) {
        expect(QUARTER_POPULATION_LIMITS[level]).toBeGreaterThan(
          QUARTER_POPULATION_LIMITS[level - 1],
        );
      }
    }
  });
});

describe('getQuarterPopulationLimit', () => {
  it('returns the exact table value for defined integer levels', () => {
    for (let level = 1; level <= 10; level++) {
      expect(getQuarterPopulationLimit(level)).toBe(
        QUARTER_POPULATION_LIMITS[level],
      );
    }
  });

  it('floors fractional levels before lookup', () => {
    expect(getQuarterPopulationLimit(3.9)).toBe(QUARTER_POPULATION_LIMITS[3]);
    expect(getQuarterPopulationLimit(1.01)).toBe(QUARTER_POPULATION_LIMITS[1]);
  });

  it('clamps levels below the minimum to level 1', () => {
    expect(getQuarterPopulationLimit(0)).toBe(QUARTER_POPULATION_LIMITS[1]);
    expect(getQuarterPopulationLimit(-5)).toBe(QUARTER_POPULATION_LIMITS[1]);
  });

  it('clamps levels above the maximum to level 10', () => {
    expect(getQuarterPopulationLimit(11)).toBe(QUARTER_POPULATION_LIMITS[10]);
    expect(getQuarterPopulationLimit(999)).toBe(QUARTER_POPULATION_LIMITS[10]);
  });

  it('falls back to the minimum level for non-finite input', () => {
    expect(getQuarterPopulationLimit(Number.NaN)).toBe(
      QUARTER_POPULATION_LIMITS[1],
    );
    expect(getQuarterPopulationLimit(Number.POSITIVE_INFINITY)).toBe(
      QUARTER_POPULATION_LIMITS[1],
    );
    expect(getQuarterPopulationLimit(Number.NEGATIVE_INFINITY)).toBe(
      QUARTER_POPULATION_LIMITS[1],
    );
  });
});
