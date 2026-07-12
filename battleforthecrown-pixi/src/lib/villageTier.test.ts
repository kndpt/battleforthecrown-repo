import { describe, expect, it } from 'vitest';
import { parseAndTierFromPower, villageTierFromPower } from './villageTier';

describe('villageTierFromPower', () => {
  it.each([
    [0, 1],
    [299, 1],
    [300, 2],
    [799, 2],
    [800, 3],
    [1499, 3],
    [1500, 4],
    [2499, 4],
    [2500, 5],
    [4999, 5],
    [5000, 6],
    [99999, 6],
  ])('power %d → tier %d', (power, expected) => {
    expect(villageTierFromPower(power)).toBe(expected);
  });
});

describe('parseAndTierFromPower', () => {
  it('parses formatted fr-FR strings', () => {
    expect(parseAndTierFromPower('5 000')).toBe(6);
    expect(parseAndTierFromPower('2 500')).toBe(5);
    expect(parseAndTierFromPower('150')).toBe(1);
  });

  it('returns tier 1 for non-numeric input', () => {
    expect(parseAndTierFromPower('')).toBe(1);
    expect(parseAndTierFromPower('abc')).toBe(1);
  });
});
