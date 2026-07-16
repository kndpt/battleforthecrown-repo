import { describe, expect, it } from 'vitest';
import { calculateProductionRate } from './production';

describe('calculateProductionRate', () => {
  it('returns the base per-minute rate at speedMultiplier=1, no strategy/trait', () => {
    expect(calculateProductionRate('WOOD', 1, 1)).toBe(1);
  });

  it('scales linearly with speedMultiplier', () => {
    expect(calculateProductionRate('WOOD', 1, 2)).toBe(2);
  });

  it('returns 0 for a level with no production table entry', () => {
    expect(calculateProductionRate('WOOD', 999, 1)).toBe(0);
  });

  it('applies the ECONOMIC strategy productionBonus (×1.2)', () => {
    expect(calculateProductionRate('WOOD', 1, 1, 'ECONOMIC')).toBeCloseTo(1.2);
  });

  it('BALANCED strategy leaves rate unchanged (no productionBonus override)', () => {
    expect(calculateProductionRate('WOOD', 1, 1, 'BALANCED')).toBe(1);
  });

  it('applies the matching natural trait bonus (DENSE_FOREST boosts WOOD ×1.1)', () => {
    expect(calculateProductionRate('WOOD', 1, 1, undefined, 'DENSE_FOREST')).toBeCloseTo(1.1);
  });

  it('does not apply a natural trait bonus for an unrelated resource', () => {
    expect(calculateProductionRate('WOOD', 1, 1, undefined, 'RICH_QUARRY')).toBe(1);
  });

  it('ignores a null natural trait', () => {
    expect(calculateProductionRate('WOOD', 1, 1, undefined, null)).toBe(1);
  });

  it('compounds strategy and natural trait bonuses multiplicatively', () => {
    expect(calculateProductionRate('WOOD', 1, 1, 'ECONOMIC', 'DENSE_FOREST')).toBeCloseTo(1.32);
  });
});
