import {
  clampBuildingLevel,
  MAX_BUILDING_LEVEL,
  MIN_BUILDING_LEVEL,
} from '@battleforthecrown/shared/utils';

describe('clampBuildingLevel', () => {
  it('exports canonical min and max building levels', () => {
    expect(MIN_BUILDING_LEVEL).toBe(1);
    expect(MAX_BUILDING_LEVEL).toBe(10);
  });

  it('returns in-range integers unchanged', () => {
    expect(clampBuildingLevel(1)).toBe(1);
    expect(clampBuildingLevel(7)).toBe(7);
    expect(clampBuildingLevel(10)).toBe(10);
  });

  it('floors fractional levels instead of rounding', () => {
    expect(clampBuildingLevel(7.9)).toBe(7);
    expect(clampBuildingLevel(1.99)).toBe(1);
  });

  it('clamps values below the minimum level', () => {
    expect(clampBuildingLevel(0)).toBe(MIN_BUILDING_LEVEL);
    expect(clampBuildingLevel(-10)).toBe(MIN_BUILDING_LEVEL);
  });

  it('clamps values above the maximum level', () => {
    expect(clampBuildingLevel(11)).toBe(MAX_BUILDING_LEVEL);
    expect(clampBuildingLevel(99)).toBe(MAX_BUILDING_LEVEL);
  });

  it('falls back to the minimum level for non-finite input', () => {
    expect(clampBuildingLevel(Number.NaN)).toBe(MIN_BUILDING_LEVEL);
    expect(clampBuildingLevel(Number.POSITIVE_INFINITY)).toBe(
      MIN_BUILDING_LEVEL,
    );
    expect(clampBuildingLevel(Number.NEGATIVE_INFINITY)).toBe(
      MIN_BUILDING_LEVEL,
    );
  });
});
