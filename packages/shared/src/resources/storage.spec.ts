import { describe, expect, it } from 'vitest';
import { getWarehouseStorageLimit } from './storage';

describe('getWarehouseStorageLimit', () => {
  it('returns symmetric limits across wood/stone/iron at every defined level', () => {
    for (let level = 1; level <= 10; level++) {
      const limits = getWarehouseStorageLimit(level);
      expect(limits.wood).toBe(limits.stone);
      expect(limits.stone).toBe(limits.iron);
      expect(limits.wood).toBeGreaterThan(0);
    }
  });

  it('increases monotonically from level 1 to 10', () => {
    let prev = getWarehouseStorageLimit(1).wood;
    for (let level = 2; level <= 10; level++) {
      const curr = getWarehouseStorageLimit(level).wood;
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }
  });

  it('returns level-1 limits as a floor for out-of-range levels', () => {
    const floor = getWarehouseStorageLimit(1);
    expect(getWarehouseStorageLimit(0)).toEqual(floor);
    expect(getWarehouseStorageLimit(99)).toEqual(floor);
  });

  it('returns exact values for boundary levels', () => {
    expect(getWarehouseStorageLimit(1).wood).toBe(3000);
    expect(getWarehouseStorageLimit(10).wood).toBe(87000);
  });
});
