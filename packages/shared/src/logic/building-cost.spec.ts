import { describe, expect, it } from 'vitest';
import { calculateBuildingCost } from './building-cost';
import { MS_PER_SECOND } from '../time';

describe('calculateBuildingCost', () => {
  it('returns the level cost/time unchanged at castleLevel=1, speedMultiplier=1', () => {
    expect(calculateBuildingCost('WOOD', 1)).toEqual({
      wood: 130,
      stone: 75,
      iron: 55,
      population: 5,
      time: 5 * MS_PER_SECOND,
    });
  });

  it('applies CASTLE_CONSTRUCTION_SPEED_BONUS[castleLevel] to the build time only', () => {
    const result = calculateBuildingCost('WOOD', 1, 10);
    expect(result.time).toBe(Math.round(5 * 0.25 * MS_PER_SECOND));
    expect(result).toMatchObject({ wood: 130, stone: 75, iron: 55, population: 5 });
  });

  it('falls back to castleLevel=1 bonus for an out-of-table castle level', () => {
    expect(calculateBuildingCost('WOOD', 1, 999).time).toBe(
      calculateBuildingCost('WOOD', 1, 1).time,
    );
  });

  it('divides build time by speedMultiplier', () => {
    expect(calculateBuildingCost('WOOD', 1, 1, 2).time).toBe(2500);
  });

  it('clamps build time at MS_PER_SECOND (1 s minimum)', () => {
    expect(calculateBuildingCost('WOOD', 1, 10, 10).time).toBe(MS_PER_SECOND);
  });

  it('produces an infinite build time for speedMultiplier=0 (documents current behavior)', () => {
    expect(calculateBuildingCost('WOOD', 1, 1, 0).time).toBe(Infinity);
  });

  it('throws for a level with no cost table entry', () => {
    expect(() => calculateBuildingCost('WOOD', 999)).toThrow(
      'No cost found for building WOOD level 999',
    );
  });

  it.each(['FORTRESS', 'RAIDERS', 'ECONOMIC', 'BALANCED'] as const)(
    'strategy %s does not currently alter cost/time (no strategy overrides buildingCostReduction/constructionSpeedBonus)',
    (strategy) => {
      expect(calculateBuildingCost('WOOD', 1, 1, 1, strategy)).toEqual(
        calculateBuildingCost('WOOD', 1, 1, 1),
      );
    },
  );
});
