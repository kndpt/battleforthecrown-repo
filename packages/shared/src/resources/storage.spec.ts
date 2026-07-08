import { describe, expect, it } from 'vitest';
import { creditResourcesCapped, getWarehouseStorageLimit } from './storage';

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

describe('creditResourcesCapped', () => {
  it('adds the delta per resource when under the cap', () => {
    const result = creditResourcesCapped(
      { wood: 100, stone: 200, iron: 300 },
      { wood: 50, stone: 25, iron: 10 },
      1000,
    );
    expect(result).toEqual({ wood: 150, stone: 225, iron: 310 });
  });

  it('clamps each resource independently at the cap', () => {
    const result = creditResourcesCapped(
      { wood: 990, stone: 500, iron: 999 },
      { wood: 50, stone: 50, iron: 50 },
      1000,
    );
    expect(result).toEqual({ wood: 1000, stone: 550, iron: 1000 });
  });

  it('supports a uniform delta across all three resources (barbarian regen)', () => {
    const result = creditResourcesCapped(
      { wood: 10, stone: 20, iron: 30 },
      { wood: 5, stone: 5, iron: 5 },
      1000,
    );
    expect(result).toEqual({ wood: 15, stone: 25, iron: 35 });
  });

  it('pulls an over-cap stock back down to the cap (historical semantics)', () => {
    const result = creditResourcesCapped(
      { wood: 1200, stone: 800, iron: 1000 },
      { wood: 0, stone: 0, iron: 0 },
      1000,
    );
    expect(result).toEqual({ wood: 1000, stone: 800, iron: 1000 });
  });

  it('is a no-op shape when delta is zero and stock is under cap', () => {
    const stock = { wood: 100, stone: 200, iron: 300 };
    const result = creditResourcesCapped(
      stock,
      { wood: 0, stone: 0, iron: 0 },
      1000,
    );
    expect(result).toEqual(stock);
  });
});
