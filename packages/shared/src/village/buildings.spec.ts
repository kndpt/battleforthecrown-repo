import { describe, expect, it } from 'vitest';
import { findBuildingByType, getBuildingLevel } from './buildings';

describe('findBuildingByType', () => {
  it('returns the matching entry', () => {
    const buildings = [
      { type: 'CASTLE', level: 3 },
      { type: 'WAREHOUSE', level: 2 },
    ];
    expect(findBuildingByType(buildings, 'WAREHOUSE')).toEqual({
      type: 'WAREHOUSE',
      level: 2,
    });
  });

  it('returns undefined when the type is absent', () => {
    expect(findBuildingByType([{ type: 'CASTLE', level: 1 }], 'WALL')).toBeUndefined();
  });

  it('returns undefined on an empty list', () => {
    expect(findBuildingByType([], 'CASTLE')).toBeUndefined();
  });

  it('preserves the input row shape', () => {
    const buildings = [{ type: 'WALL', level: 5, id: 'b1' }];
    const found = findBuildingByType(buildings, 'WALL');
    expect(found?.id).toBe('b1');
  });
});

describe('getBuildingLevel', () => {
  it('returns the level of the matching entry', () => {
    expect(
      getBuildingLevel(
        [
          { type: 'CASTLE', level: 3 },
          { type: 'WAREHOUSE', level: 2 },
        ],
        'CASTLE',
      ),
    ).toBe(3);
  });

  it('returns 0 when the building is missing', () => {
    expect(getBuildingLevel([{ type: 'WAREHOUSE', level: 2 }], 'CASTLE')).toBe(0);
  });

  it('returns 0 on an empty list', () => {
    expect(getBuildingLevel([], 'CASTLE')).toBe(0);
  });
});
