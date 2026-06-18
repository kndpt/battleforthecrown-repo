import { describe, expect, it } from 'vitest';
import {
  findBuildingByType,
  getBuildingDefinition,
  getBuildingLevel,
  getBuildingLevelValues,
  getBuildingMaxLevel,
  getBuildingUnlockRequirement,
  isBuildingEnabled,
} from './definitions';

describe('getBuildingDefinition', () => {
  it('returns the definition for a known type', () => {
    const def = getBuildingDefinition('CASTLE');
    expect(def).toBeDefined();
    expect(def.levels[1]).toBeDefined();
  });

  it('throws for an unknown type', () => {
    expect(() => getBuildingDefinition('UNKNOWN')).toThrow('Unknown building type UNKNOWN');
  });
});

describe('getBuildingLevelValues', () => {
  it('returns the level data for a valid level', () => {
    const vals = getBuildingLevelValues('CASTLE', 1);
    expect(vals).not.toBeNull();
    expect(vals?.timeSeconds).toBe(0);
  });

  it('returns null for level < 1', () => {
    expect(getBuildingLevelValues('CASTLE', 0)).toBeNull();
  });

  it('returns null for a level beyond the max', () => {
    expect(getBuildingLevelValues('CASTLE', 99)).toBeNull();
  });
});

describe('getBuildingMaxLevel', () => {
  it('returns 10 for standard buildings', () => {
    expect(getBuildingMaxLevel('CASTLE')).toBe(10);
    expect(getBuildingMaxLevel('WOOD')).toBe(10);
  });

  it('returns 1 for single-level buildings', () => {
    expect(getBuildingMaxLevel('COUNCIL_HALL')).toBe(1);
    expect(getBuildingMaxLevel('THRONE_HALL')).toBe(1);
  });
});

describe('isBuildingEnabled', () => {
  it('returns true for an enabled building', () => {
    expect(isBuildingEnabled('CASTLE')).toBe(true);
  });

  it('returns false for a disabled building', () => {
    expect(isBuildingEnabled('HIDEOUT')).toBe(false);
    expect(isBuildingEnabled('WALL')).toBe(false);
  });

  it('returns false for an unknown building type', () => {
    expect(isBuildingEnabled('UNKNOWN')).toBe(false);
  });
});

describe('getBuildingUnlockRequirement', () => {
  it('returns null for CASTLE (no unlock requirement)', () => {
    expect(getBuildingUnlockRequirement('CASTLE')).toBeNull();
  });

  it('returns the castle level required to unlock a building', () => {
    expect(getBuildingUnlockRequirement('BARRACKS')).toBe(2);
    expect(getBuildingUnlockRequirement('WATCHTOWER')).toBe(3);
  });

  it('returns null for an unknown type', () => {
    expect(getBuildingUnlockRequirement('UNKNOWN')).toBeNull();
  });
});

describe('findBuildingByType', () => {
  const buildings = [
    { type: 'CASTLE', level: 4 },
    { type: 'WOOD', level: 7 },
  ];

  it('returns the matching building', () => {
    expect(findBuildingByType(buildings, 'WOOD')).toEqual({ type: 'WOOD', level: 7 });
  });

  it('returns undefined when not found', () => {
    expect(findBuildingByType(buildings, 'IRON')).toBeUndefined();
  });
});

describe('getBuildingLevel', () => {
  const buildings = [
    { type: 'CASTLE', level: 4 },
    { type: 'WOOD', level: 7 },
  ];

  it('returns the level when found', () => {
    expect(getBuildingLevel(buildings, 'CASTLE')).toBe(4);
  });

  it('returns 0 when not found', () => {
    expect(getBuildingLevel(buildings, 'IRON')).toBe(0);
  });
});
