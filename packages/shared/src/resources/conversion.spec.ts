import { describe, expect, it } from 'vitest';
import {
  CONVERTIBLE_RESOURCE_TYPES,
  RESOURCE_CONVERSION_DAILY_CAP,
  RESOURCE_CONVERSION_RATE,
  convertResourceAmount,
  resourceTypeToKey,
} from './conversion';

describe('convertResourceAmount', () => {
  it('applies the unfavorable rate with floor rounding', () => {
    expect(convertResourceAmount(2)).toBe(1);
    expect(convertResourceAmount(100)).toBe(50);
    expect(convertResourceAmount(RESOURCE_CONVERSION_RATE * 1234)).toBe(1234);
  });

  it('floors so no free resource is minted on odd/small amounts', () => {
    // 3 / 2 = 1.5 → 1 (the extra source unit is burned, never rounded up)
    expect(convertResourceAmount(3)).toBe(1);
    expect(convertResourceAmount(101)).toBe(50);
  });

  it('credits 0 when the amount is below the rate (caller must reject)', () => {
    expect(convertResourceAmount(1)).toBe(0);
  });

  it('returns 0 for non-positive or non-finite input', () => {
    expect(convertResourceAmount(0)).toBe(0);
    expect(convertResourceAmount(-10)).toBe(0);
    expect(convertResourceAmount(Number.NaN)).toBe(0);
    expect(convertResourceAmount(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('never credits more than half the source (rate = 2)', () => {
    for (let amount = 1; amount <= 10_000; amount += 37) {
      expect(convertResourceAmount(amount)).toBeLessThanOrEqual(amount / 2);
    }
  });
});

describe('conversion constants', () => {
  it('exposes an unfavorable rate and a positive daily cap', () => {
    expect(RESOURCE_CONVERSION_RATE).toBeGreaterThan(1);
    expect(RESOURCE_CONVERSION_DAILY_CAP).toBeGreaterThan(0);
  });

  it('convertible types are exactly wood/stone/iron, never crowns', () => {
    expect([...CONVERTIBLE_RESOURCE_TYPES].sort()).toEqual([
      'IRON',
      'STONE',
      'WOOD',
    ]);
  });
});

describe('resourceTypeToKey', () => {
  it('maps each type to its lowercase stock key', () => {
    expect(resourceTypeToKey('WOOD')).toBe('wood');
    expect(resourceTypeToKey('STONE')).toBe('stone');
    expect(resourceTypeToKey('IRON')).toBe('iron');
  });
});
