import { calculateBuildingCost } from '@battleforthecrown/shared/logic';

describe('calculateBuildingCost', () => {
  describe('base case (castle level 1, speed multiplier 1, no strategy)', () => {
    it('returns correct resource costs and time for WOOD level 1', () => {
      const result = calculateBuildingCost('WOOD', 1, 1, 1);
      expect(result).toEqual({
        wood: 130,
        stone: 75,
        iron: 55,
        population: 5,
        time: 5000,
      });
    });

    it('returns correct resource costs and time for BARRACKS level 1', () => {
      const result = calculateBuildingCost('BARRACKS', 1, 1, 1);
      expect(result).toEqual({
        wood: 100,
        stone: 100,
        iron: 130,
        population: 8,
        time: 60000,
      });
    });
  });

  describe('castle level bonus', () => {
    it('applies 0.25 time multiplier at castle level 10 (4× speedup)', () => {
      const result = calculateBuildingCost('WOOD', 1, 10, 1);
      // raw 5s × 0.25 × 1000 ms = 1250ms
      expect(result.time).toBe(1250);
      expect(result.wood).toBe(130);
    });

    it('falls back to level 1 bonus for an out-of-range castle level', () => {
      const base = calculateBuildingCost('WOOD', 1, 1, 1);
      const fallback = calculateBuildingCost('WOOD', 1, 99, 1);
      expect(fallback.time).toBe(base.time);
    });
  });

  describe('speed multiplier', () => {
    it('doubles construction time when speed multiplier is 0.5', () => {
      const result = calculateBuildingCost('WOOD', 1, 1, 0.5);
      // raw 5s / 0.5 × 1000 ms = 10000ms
      expect(result.time).toBe(10000);
    });

    it('halves construction time when speed multiplier is 2', () => {
      const result = calculateBuildingCost('WOOD', 1, 1, 2);
      // raw 5s / 2 × 1000 ms = 2500ms
      expect(result.time).toBe(2500);
    });
  });

  describe('minimum time floor', () => {
    it('clamps time to 1000ms when raw duration rounds to zero', () => {
      // CASTLE level 1 has timeSeconds=0 — always hits the floor
      const result = calculateBuildingCost('CASTLE', 1, 10, 10);
      expect(result.time).toBe(1000);
    });
  });

  describe('error handling', () => {
    it('throws for an unknown building type', () => {
      expect(() => calculateBuildingCost('UNKNOWN_BUILDING', 1, 1)).toThrow(
        /Unknown building type UNKNOWN_BUILDING/,
      );
    });
  });
});
