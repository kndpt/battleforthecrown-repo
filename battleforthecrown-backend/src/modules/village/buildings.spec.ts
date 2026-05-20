import {
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
  BUILDING_UNLOCK_REQUIREMENTS,
  getBuildingMaxLevel,
  getBuildingUnlockRequirement,
  isBuildingEnabled,
  getBuildingLevelValues,
} from '@battleforthecrown/shared/village';
import type {
  BuildingDefinition,
  BuildingType,
} from '@battleforthecrown/shared/village';
import { getBuildingPowerWeight } from '@battleforthecrown/shared/power';
import { getWarehouseStorageLimit } from '@battleforthecrown/shared/resources';
import {
  PLAYER_VILLAGE_BUILDING_LIFECYCLE,
  getBarbarianConquestVillageBuildings,
  getInitialPlayerVillageBuildings,
} from './player-village-building-lifecycle';

describe('COUNCIL_HALL', () => {
  it('has max level 1', () => {
    expect(getBuildingMaxLevel('COUNCIL_HALL')).toBe(1);
  });

  it('requires castle level 4 to unlock', () => {
    expect(getBuildingUnlockRequirement('COUNCIL_HALL')).toBe(4);
  });

  it('has power weight of 25', () => {
    expect(getBuildingPowerWeight('COUNCIL_HALL')).toBe(25);
  });

  it('is enabled', () => {
    expect(isBuildingEnabled('COUNCIL_HALL')).toBe(true);
  });

  it('returns correct level 1 costs', () => {
    expect(getBuildingLevelValues('COUNCIL_HALL', 1)).toEqual({
      wood: 150,
      stone: 200,
      iron: 100,
      population: 4,
      timeSeconds: 900,
    });
  });

  it('returns null for level 2 (does not exist)', () => {
    expect(getBuildingLevelValues('COUNCIL_HALL', 2)).toBeNull();
  });
});

describe('THRONE_HALL', () => {
  it('has max level 1', () => {
    expect(getBuildingMaxLevel('THRONE_HALL')).toBe(1);
  });

  it('requires castle level 6 to unlock', () => {
    expect(getBuildingUnlockRequirement('THRONE_HALL')).toBe(6);
  });

  it('has power weight of 35', () => {
    expect(getBuildingPowerWeight('THRONE_HALL')).toBe(35);
  });

  it('is enabled', () => {
    expect(isBuildingEnabled('THRONE_HALL')).toBe(true);
  });

  it('returns correct level 1 costs', () => {
    expect(getBuildingLevelValues('THRONE_HALL', 1)).toEqual({
      wood: 1600,
      stone: 2400,
      iron: 1200,
      population: 6,
      timeSeconds: 21600,
    });
  });

  it('returns null for level 2 (does not exist)', () => {
    expect(getBuildingLevelValues('THRONE_HALL', 2)).toBeNull();
  });
});

describe('warehouse storage', () => {
  it('returns correct limits for level 1', () => {
    const limits = getWarehouseStorageLimit(1);
    expect(limits.wood).toBe(3000);
    expect(limits.stone).toBe(3000);
    expect(limits.iron).toBe(3000);
  });

  it('returns correct limits for level 5', () => {
    const limits = getWarehouseStorageLimit(5);
    expect(limits.wood).toBe(12000);
    expect(limits.stone).toBe(12000);
    expect(limits.iron).toBe(12000);
  });

  it('returns correct limits for level 10', () => {
    const limits = getWarehouseStorageLimit(10);
    expect(limits.wood).toBe(87000);
    expect(limits.stone).toBe(87000);
    expect(limits.iron).toBe(87000);
  });

  it('falls back to level 1 limits for level 0 (out of range)', () => {
    const limits = getWarehouseStorageLimit(0);
    expect(limits.wood).toBe(3000);
    expect(limits.stone).toBe(3000);
    expect(limits.iron).toBe(3000);
  });

  it('falls back to level 1 limits for level 99 (out of range)', () => {
    const limits = getWarehouseStorageLimit(99);
    expect(limits.wood).toBe(3000);
    expect(limits.stone).toBe(3000);
    expect(limits.iron).toBe(3000);
  });
});

describe('BUILDING_TYPES catalogue', () => {
  it('contains exactly the 12 expected building types', () => {
    const expectedTypes = [
      'CASTLE',
      'WOOD',
      'STONE',
      'IRON',
      'WAREHOUSE',
      'FARM',
      'BARRACKS',
      'WATCHTOWER',
      'COUNCIL_HALL',
      'THRONE_HALL',
      'WALL',
      'HIDEOUT',
    ];
    const actualTypes = Object.keys(BUILDING_TYPES).sort();
    expect(actualTypes).toEqual(expectedTypes.sort());
  });
});

describe('player village building lifecycle roster', () => {
  it('forces every enabled building to have an explicit lifecycle policy', () => {
    const enabledTypes = (
      Object.values(BUILDING_TYPES) as BuildingType[]
    ).filter(isBuildingEnabled);
    const lifecycleTypes = PLAYER_VILLAGE_BUILDING_LIFECYCLE.map(
      (building) => building.type,
    );

    expect([...new Set(lifecycleTypes)].sort()).toEqual(
      [...enabledTypes].sort(),
    );
    expect(lifecycleTypes).not.toContain(BUILDING_TYPES.WALL);
    expect(lifecycleTypes).not.toContain(BUILDING_TYPES.HIDEOUT);
  });

  it('creates enabled advanced buildings as unbuilt rows for a new player village', () => {
    expect(getInitialPlayerVillageBuildings()).toEqual(
      expect.arrayContaining([
        { type: BUILDING_TYPES.COUNCIL_HALL, level: 0 },
        { type: BUILDING_TYPES.THRONE_HALL, level: 0 },
      ]),
    );
  });

  it('keeps join and barbarian conquest on the same player-building roster', () => {
    const initialBuildings = getInitialPlayerVillageBuildings();
    const conqueredBuildings = getBarbarianConquestVillageBuildings(3);

    expect(conqueredBuildings.map((building) => building.type).sort()).toEqual(
      initialBuildings.map((building) => building.type).sort(),
    );
    expect(conqueredBuildings).toEqual(
      expect.arrayContaining([
        { type: BUILDING_TYPES.CASTLE, level: 3 },
        { type: BUILDING_TYPES.WOOD, level: 3 },
        { type: BUILDING_TYPES.BARRACKS, level: 3 },
        { type: BUILDING_TYPES.WATCHTOWER, level: 0 },
        { type: BUILDING_TYPES.COUNCIL_HALL, level: 0 },
        { type: BUILDING_TYPES.THRONE_HALL, level: 0 },
      ]),
    );
  });
});

describe('BUILDING_UNLOCK_REQUIREMENTS', () => {
  it('is derived from building definition unlock levels', () => {
    const expectedRequirements = Object.fromEntries(
      (
        Object.entries(BUILDING_DEFINITIONS) as Array<
          [BuildingType, BuildingDefinition]
        >
      )
        .filter(([, definition]) => definition.unlockCastleLevel !== undefined)
        .map(([type, definition]) => [type, definition.unlockCastleLevel]),
    );

    expect(BUILDING_UNLOCK_REQUIREMENTS).toEqual(expectedRequirements);
    expect(BUILDING_UNLOCK_REQUIREMENTS).not.toHaveProperty('CASTLE');
  });
});
