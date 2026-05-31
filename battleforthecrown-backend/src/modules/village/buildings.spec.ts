import {
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
  BUILDING_UNLOCK_REQUIREMENTS,
  getBuildingMaxLevel,
  getBuildingUnlockRequirement,
  isBuildingEnabled,
  getBuildingLevelValues,
  getBarracksTrainingSpeedMultiplier,
  WATCHTOWER_VISION_LEVELS,
} from '@battleforthecrown/shared/village';
import type {
  BuildingDefinition,
  BuildingType,
} from '@battleforthecrown/shared/village';
import { getBuildingPowerWeight } from '@battleforthecrown/shared/power';
import {
  RESOURCE_PRODUCTION_PER_HOUR,
  getWarehouseStorageLimit,
} from '@battleforthecrown/shared/resources';
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
      wood: 1510,
      stone: 2040,
      iron: 1135,
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
      wood: 3850,
      stone: 5775,
      iron: 2890,
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

describe('building resource costs', () => {
  const minimumStorageShare = 0.03;

  const storageLimitFor = (level: number, definition: BuildingDefinition) => {
    const singleLevelUnlock = Object.keys(definition.levels).length === 1;
    const referenceLevel = singleLevelUnlock
      ? Math.max(level, definition.unlockCastleLevel ?? level)
      : level;

    return getWarehouseStorageLimit(referenceLevel).wood;
  };

  it('keeps enabled building costs meaningful against warehouse capacity', () => {
    const enabledEntries = (
      Object.entries(BUILDING_DEFINITIONS) as Array<
        [BuildingType, BuildingDefinition]
      >
    ).filter(([, definition]) => definition.enabled);

    for (const [, definition] of enabledEntries) {
      for (const [rawLevel, levelValues] of Object.entries(definition.levels)) {
        const level = Number(rawLevel);
        const resourceCosts = [
          levelValues.wood,
          levelValues.stone,
          levelValues.iron,
        ];
        const maxResourceCost = Math.max(...resourceCosts);

        if (maxResourceCost === 0) continue;

        const storageLimit = storageLimitFor(level, definition);

        expect(maxResourceCost).toBeGreaterThanOrEqual(
          Math.floor(storageLimit * minimumStorageShare),
        );
        expect(maxResourceCost).toBeLessThanOrEqual(storageLimit);
      }
    }
  });
});

describe('resource production curve', () => {
  it('keeps passive production below late construction costs', () => {
    expect(RESOURCE_PRODUCTION_PER_HOUR[10]).toBe(1350);

    const castleLevel10 = BUILDING_DEFINITIONS.CASTLE.levels[10];
    const limitingResourceHours =
      castleLevel10.stone / RESOURCE_PRODUCTION_PER_HOUR[10];

    expect(limitingResourceHours).toBeGreaterThanOrEqual(34);
    expect(limitingResourceHours).toBeLessThanOrEqual(36);
  });
});

describe('barracks training speed multiplier', () => {
  it('returns the expected multiplier at level 1 and level 10', () => {
    expect(getBarracksTrainingSpeedMultiplier(1)).toBe(1.0);
    expect(getBarracksTrainingSpeedMultiplier(10)).toBe(1.36);
  });

  it('strictly increases from level 1 to level 10', () => {
    const multipliers = Array.from({ length: 10 }, (_, index) =>
      getBarracksTrainingSpeedMultiplier(index + 1),
    );

    for (let index = 1; index < multipliers.length; index += 1) {
      expect(multipliers[index]).toBeGreaterThan(multipliers[index - 1]);
    }
  });

  it('falls back or clamps invalid levels to supported multipliers', () => {
    expect(getBarracksTrainingSpeedMultiplier(0)).toBe(1.0);
    expect(getBarracksTrainingSpeedMultiplier(-1)).toBe(1.0);
    expect(getBarracksTrainingSpeedMultiplier(Number.NaN)).toBe(1.0);
    expect(getBarracksTrainingSpeedMultiplier(99)).toBe(1.36);
  });
});

describe('WATCHTOWER_VISION_LEVELS', () => {
  it('makes level 1 reach the first T1 barbarian ring while keeping vision finite', () => {
    expect(WATCHTOWER_VISION_LEVELS[1]).toEqual({
      isWorldUnlocked: true,
      visibilityRadius: 10,
    });
    expect(WATCHTOWER_VISION_LEVELS[10]).toEqual({
      isWorldUnlocked: true,
      visibilityRadius: 55,
    });
  });

  it('strictly increases after world vision unlock', () => {
    const radii = Array.from(
      { length: 10 },
      (_, index) => WATCHTOWER_VISION_LEVELS[index + 1].visibilityRadius,
    );

    for (let index = 1; index < radii.length; index += 1) {
      expect(radii[index]).toBeGreaterThan(radii[index - 1]);
    }
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
      'QUARTER',
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
