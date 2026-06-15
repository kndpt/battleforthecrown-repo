import {
  getBuildingProduction,
  getResourceBuildingProduction,
  isResourceBuildingType,
  RESOURCE_PRODUCTION_PER_MINUTE,
} from '@battleforthecrown/shared/resources';

describe('resource production lookups', () => {
  describe('isResourceBuildingType', () => {
    it('accepts WOOD, STONE, and IRON', () => {
      expect(isResourceBuildingType('WOOD')).toBe(true);
      expect(isResourceBuildingType('STONE')).toBe(true);
      expect(isResourceBuildingType('IRON')).toBe(true);
    });

    it('rejects non-resource building types', () => {
      expect(isResourceBuildingType('CASTLE')).toBe(false);
      expect(isResourceBuildingType('BARRACKS')).toBe(false);
      expect(isResourceBuildingType('UNKNOWN')).toBe(false);
    });
  });

  describe('getResourceBuildingProduction', () => {
    it('returns per-minute production from the shared table', () => {
      expect(getResourceBuildingProduction('WOOD', 1)).toBe(
        RESOURCE_PRODUCTION_PER_MINUTE[1],
      );
      expect(getResourceBuildingProduction('STONE', 3)).toBe(2);
      expect(getResourceBuildingProduction('IRON', 10)).toBe(22.5);
    });

    it('returns null for undefined levels', () => {
      expect(getResourceBuildingProduction('WOOD', 0)).toBeNull();
      expect(getResourceBuildingProduction('IRON', 99)).toBeNull();
    });
  });

  describe('getBuildingProduction', () => {
    it('delegates to resource tables for resource buildings', () => {
      expect(getBuildingProduction('WOOD', 5)).toBe(4);
      expect(getBuildingProduction('STONE', 7)).toBe(8);
    });

    it('returns null for non-resource buildings without throwing', () => {
      expect(getBuildingProduction('BARRACKS', 5)).toBeNull();
      expect(getBuildingProduction('CASTLE', 10)).toBeNull();
    });
  });
});
