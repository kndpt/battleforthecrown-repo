import {
  normalizeCaravanResources,
  sumCaravanResources,
  caravanPortersFor,
  addCaravanResources,
  subtractCaravanResources,
  parseCaravanResources,
  emptyCaravanResources,
} from './caravan.utils';

describe('caravan.utils', () => {
  describe('normalizeCaravanResources', () => {
    it('clamps negative values to 0', () => {
      expect(
        normalizeCaravanResources({ wood: -10, stone: -5, iron: -1 }),
      ).toEqual({
        wood: 0,
        stone: 0,
        iron: 0,
      });
    });

    it('floors decimal values', () => {
      expect(
        normalizeCaravanResources({ wood: 3.9, stone: 2.1, iron: 1.7 }),
      ).toEqual({
        wood: 3,
        stone: 2,
        iron: 1,
      });
    });

    it('handles missing fields via ?? 0', () => {
      expect(normalizeCaravanResources({})).toEqual({
        wood: 0,
        stone: 0,
        iron: 0,
      });
    });

    it('passes through valid positive integers unchanged', () => {
      expect(
        normalizeCaravanResources({ wood: 100, stone: 200, iron: 50 }),
      ).toEqual({
        wood: 100,
        stone: 200,
        iron: 50,
      });
    });
  });

  describe('caravanPortersFor', () => {
    it('returns 0 for zero total volume', () => {
      expect(caravanPortersFor({ wood: 0, stone: 0, iron: 0 })).toBe(0);
    });

    it('returns ceil(volume / 500) for non-zero volume', () => {
      // 500 wood = exactly 1 porter
      expect(caravanPortersFor({ wood: 500, stone: 0, iron: 0 })).toBe(1);
    });

    it('rounds up fractional porters', () => {
      // 501 resources = 2 porters (ceil(501/500))
      expect(caravanPortersFor({ wood: 501, stone: 0, iron: 0 })).toBe(2);
    });

    it('sums all resource types before dividing', () => {
      // wood=100 + stone=100 + iron=100 = 300 → ceil(300/500) = 1
      expect(caravanPortersFor({ wood: 100, stone: 100, iron: 100 })).toBe(1);
    });

    it('handles large volumes', () => {
      // 2500 total → ceil(2500/500) = 5
      expect(caravanPortersFor({ wood: 1000, stone: 1000, iron: 500 })).toBe(5);
    });
  });

  describe('subtractCaravanResources', () => {
    it('subtracts resources correctly', () => {
      expect(
        subtractCaravanResources(
          { wood: 100, stone: 50, iron: 30 },
          { wood: 40, stone: 20, iron: 10 },
        ),
      ).toEqual({ wood: 60, stone: 30, iron: 20 });
    });

    it('clamps at zero when right > left', () => {
      expect(
        subtractCaravanResources(
          { wood: 10, stone: 5, iron: 0 },
          { wood: 100, stone: 100, iron: 100 },
        ),
      ).toEqual({ wood: 0, stone: 0, iron: 0 });
    });

    it('returns zero for equal values', () => {
      expect(
        subtractCaravanResources(
          { wood: 50, stone: 50, iron: 50 },
          { wood: 50, stone: 50, iron: 50 },
        ),
      ).toEqual({ wood: 0, stone: 0, iron: 0 });
    });
  });

  describe('parseCaravanResources', () => {
    it('returns empty resources when loot is null', () => {
      expect(parseCaravanResources({ loot: null })).toEqual(
        emptyCaravanResources(),
      );
    });

    it('parses loot resources correctly', () => {
      const loot = { resources: { wood: 200, stone: 100, iron: 50 } };
      expect(parseCaravanResources({ loot })).toEqual({
        wood: 200,
        stone: 100,
        iron: 50,
      });
    });

    it('floors decimal values from the codec', () => {
      const loot = { resources: { wood: 3.7, stone: 2.9, iron: 0.1 } };
      expect(parseCaravanResources({ loot })).toEqual({
        wood: 3,
        stone: 2,
        iron: 0,
      });
    });

    it('returns empty resources when loot has no resources field', () => {
      const loot = {};
      expect(parseCaravanResources({ loot })).toEqual(emptyCaravanResources());
    });
  });

  describe('sumCaravanResources', () => {
    it('returns 0 for an empty resource object', () => {
      expect(sumCaravanResources({ wood: 0, stone: 0, iron: 0 })).toBe(0);
    });

    it('sums all three resource fields', () => {
      expect(sumCaravanResources({ wood: 100, stone: 200, iron: 50 })).toBe(
        350,
      );
    });

    it('handles partial resources', () => {
      expect(sumCaravanResources({ wood: 0, stone: 0, iron: 500 })).toBe(500);
    });
  });

  describe('addCaravanResources', () => {
    it('adds two resource objects field by field', () => {
      expect(
        addCaravanResources(
          { wood: 100, stone: 50, iron: 30 },
          { wood: 40, stone: 20, iron: 10 },
        ),
      ).toEqual({ wood: 140, stone: 70, iron: 40 });
    });

    it('adding zero-valued resources leaves values unchanged', () => {
      expect(
        addCaravanResources(
          { wood: 100, stone: 200, iron: 300 },
          { wood: 0, stone: 0, iron: 0 },
        ),
      ).toEqual({ wood: 100, stone: 200, iron: 300 });
    });

    it('adding two empty objects yields zero', () => {
      expect(
        addCaravanResources(
          { wood: 0, stone: 0, iron: 0 },
          { wood: 0, stone: 0, iron: 0 },
        ),
      ).toEqual({ wood: 0, stone: 0, iron: 0 });
    });
  });
});
