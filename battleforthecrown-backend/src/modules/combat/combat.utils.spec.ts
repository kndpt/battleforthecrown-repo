import {
  calculateCasualtyStats,
  isVictoryForAttacker,
  distributeLossesProportionally,
} from './combat.utils';

describe('Combat Utils', () => {
  describe('calculateCasualtyStats', () => {
    it('should calculate stats with no losses', () => {
      const original = { MILITIA: 100, ARCHER: 50 };
      const losses = { MILITIA: 0, ARCHER: 0 };

      const result = calculateCasualtyStats(original, losses);

      expect(result).toEqual({
        total: 150,
        losses: 0,
        casualtyRate: 0,
      });
    });

    it('should calculate stats with partial losses', () => {
      const original = { MILITIA: 100, ARCHER: 50 };
      const losses = { MILITIA: 30, ARCHER: 10 };

      const result = calculateCasualtyStats(original, losses);

      expect(result).toEqual({
        total: 150,
        losses: 40,
        casualtyRate: 27, // (40/150) * 100 = 26.67 ≈ 27%
      });
    });

    it('should calculate stats with total losses', () => {
      const original = { MILITIA: 50, ARCHER: 30 };
      const losses = { MILITIA: 50, ARCHER: 30 };

      const result = calculateCasualtyStats(original, losses);

      expect(result).toEqual({
        total: 80,
        losses: 80,
        casualtyRate: 100,
      });
    });

    it('should handle empty units', () => {
      const original = {};
      const losses = {};

      const result = calculateCasualtyStats(original, losses);

      expect(result).toEqual({
        total: 0,
        losses: 0,
        casualtyRate: 0,
      });
    });

    it('should handle single unit type', () => {
      const original = { CAVALRY: 200 };
      const losses = { CAVALRY: 50 };

      const result = calculateCasualtyStats(original, losses);

      expect(result).toEqual({
        total: 200,
        losses: 50,
        casualtyRate: 25,
      });
    });

    it('should handle losses without corresponding original units', () => {
      const original = { MILITIA: 100 };
      const losses = { MILITIA: 50, ARCHER: 10 };

      const result = calculateCasualtyStats(original, losses);

      expect(result).toEqual({
        total: 100,
        losses: 60,
        casualtyRate: 60,
      });
    });

    it('should round casualty rate correctly', () => {
      const original = { MILITIA: 100 };
      const losses = { MILITIA: 33 };

      const result = calculateCasualtyStats(original, losses);

      expect(result.casualtyRate).toBe(33); // 33/100 = 0.33 = 33%
    });

    it('should handle high loss ratios with rounding', () => {
      const original = { MILITIA: 100 };
      const losses = { MILITIA: 66 };

      const result = calculateCasualtyStats(original, losses);

      expect(result.casualtyRate).toBe(66); // 66/100 = 0.66 = 66%
    });

    it('should handle very small loss ratios', () => {
      const original = { MILITIA: 1000 };
      const losses = { MILITIA: 1 };

      const result = calculateCasualtyStats(original, losses);

      expect(result.casualtyRate).toBe(0); // 1/1000 = 0.001 ≈ 0%
    });

    it('should handle mixed scenarios with multiple unit types', () => {
      const original = {
        MILITIA: 200,
        ARCHER: 100,
        CAVALRY: 50,
        SCOUT: 50,
      };
      const losses = {
        MILITIA: 50,
        ARCHER: 30,
        CAVALRY: 50,
        SCOUT: 0,
      };

      const result = calculateCasualtyStats(original, losses);

      expect(result).toEqual({
        total: 400,
        losses: 130,
        casualtyRate: 33, // (130/400) * 100 = 32.5 ≈ 33%
      });
    });
  });

  describe('isVictoryForAttacker', () => {
    it('should return true if at least one unit survives', () => {
      const losses = { MILITIA: 50, ARCHER: 30 };
      const original = { MILITIA: 100, ARCHER: 30 };

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(true);
    });

    it('should return false if all units die', () => {
      const losses = { MILITIA: 100, ARCHER: 30 };
      const original = { MILITIA: 100, ARCHER: 30 };

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(false);
    });

    it('should return false if losses exceed original units', () => {
      const losses = { MILITIA: 150 };
      const original = { MILITIA: 100 };

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(false);
    });

    it('should return true if one unit type survives while others die', () => {
      const losses = { MILITIA: 100, ARCHER: 50, CAVALRY: 20 };
      const original = { MILITIA: 100, ARCHER: 50, CAVALRY: 30 };

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(true); // 10 cavalry survive
    });

    it('should return false with no original units', () => {
      const losses = {};
      const original = {};

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(false);
    });

    it('should handle edge case: zero losses for surviving units', () => {
      const losses = { MILITIA: 0 };
      const original = { MILITIA: 50 };

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(true);
    });

    it('should return true for pyrrhic victory (minimal survivors)', () => {
      const losses = { MILITIA: 99 };
      const original = { MILITIA: 100 };

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(true);
    });

    it('should handle missing loss entries (undefined)', () => {
      const losses = { MILITIA: 50 };
      const original = { MILITIA: 100, ARCHER: 50 };

      const result = isVictoryForAttacker(losses, original);

      expect(result).toBe(true); // ARCHER not in losses, so 50 survive
    });
  });

  describe('distributeLossesProportionally', () => {
    it('should distribute losses equally when participants have same units', () => {
      const totalLosses = { MILITIA: 40 };
      const totalUnits = { MILITIA: 100 };
      const participantUnits = { MILITIA: 50 };

      const result = distributeLossesProportionally(
        totalLosses,
        totalUnits,
        participantUnits,
      );

      expect(result).toEqual({ MILITIA: 20 });
    });

    it('should distribute losses proportionally with different unit counts', () => {
      const totalLosses = { MILITIA: 60 };
      const totalUnits = { MILITIA: 300 };
      const participantUnits = { MILITIA: 100 }; // 1/3 of total

      const result = distributeLossesProportionally(
        totalLosses,
        totalUnits,
        participantUnits,
      );

      expect(result).toEqual({ MILITIA: 20 });
    });

    it('should floor losses (round in favor of defender)', () => {
      const totalLosses = { MILITIA: 10 };
      const totalUnits = { MILITIA: 3 };
      const participantUnits = { MILITIA: 1 }; // 1/3 of total losses = 3.33...

      const result = distributeLossesProportionally(
        totalLosses,
        totalUnits,
        participantUnits,
      );

      expect(result).toEqual({ MILITIA: 3 });
    });

    it('should handle multiple unit types', () => {
      const totalLosses = { MILITIA: 50, ARCHER: 20 };
      const totalUnits = { MILITIA: 100, ARCHER: 100 };
      const participantUnits = { MILITIA: 20, ARCHER: 50 };

      const result = distributeLossesProportionally(
        totalLosses,
        totalUnits,
        participantUnits,
      );

      expect(result).toEqual({
        MILITIA: 10, // 50 * 20/100
        ARCHER: 10, // 20 * 50/100
      });
    });

    it('should return empty object if participant has no units of that type', () => {
      const totalLosses = { MILITIA: 50 };
      const totalUnits = { MILITIA: 100, ARCHER: 100 };
      const participantUnits = { ARCHER: 50 };

      const result = distributeLossesProportionally(
        totalLosses,
        totalUnits,
        participantUnits,
      );

      expect(result).toEqual({});
    });

    it('should handle zero total units gracefully', () => {
      const totalLosses = { MILITIA: 50 };
      const totalUnits = { MILITIA: 0 };
      const participantUnits = { MILITIA: 0 };

      const result = distributeLossesProportionally(
        totalLosses,
        totalUnits,
        participantUnits,
      );

      expect(result).toEqual({});
    });
  });
});
