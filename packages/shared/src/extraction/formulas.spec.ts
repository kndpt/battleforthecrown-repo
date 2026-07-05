import { describe, expect, it } from 'vitest';
import { computeExtractedAmount } from './formulas';

describe('computeExtractedAmount', () => {
  it('computes the nominal accrual: villagers * rate * hours', () => {
    // 10 villagers * 40/h * 2h = 800
    expect(
      computeExtractedAmount({
        villagers: 10,
        elapsedMs: 2 * 3_600_000,
        remainingCapacity: 100_000,
      }),
    ).toBe(800);
  });

  it('clamps the result to remainingCapacity', () => {
    expect(
      computeExtractedAmount({
        villagers: 30,
        elapsedMs: 8 * 3_600_000,
        remainingCapacity: 500,
      }),
    ).toBe(500);
  });

  it('returns 0 when no time has elapsed', () => {
    expect(
      computeExtractedAmount({
        villagers: 20,
        elapsedMs: 0,
        remainingCapacity: 10_000,
      }),
    ).toBe(0);
  });

  it('floors fractional results instead of rounding', () => {
    // 1 villager * 40/h over 89 minutes -> raw = 40 * 89/60 = 59.33... -> floor 59
    expect(
      computeExtractedAmount({
        villagers: 1,
        elapsedMs: 89 * 60_000,
        remainingCapacity: 10_000,
      }),
    ).toBe(59);
  });
});
