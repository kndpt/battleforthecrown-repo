export const BUILDING_TYPES = {
  CASTLE: "CASTLE",
  WOOD: "WOOD",
  STONE: "STONE",
  IRON: "IRON",
  WAREHOUSE: "WAREHOUSE",
  HIDEOUT: "HIDEOUT",
  QUARTER: "QUARTER",
  BARRACKS: "BARRACKS",
  WATCHTOWER: "WATCHTOWER",
  COUNCIL_HALL: "COUNCIL_HALL",
  THRONE_HALL: "THRONE_HALL",
  WALL: "WALL",
} as const;

export type BuildingType = (typeof BUILDING_TYPES)[keyof typeof BUILDING_TYPES];

export interface BuildingLevelDefinition {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  timeSeconds: number;
}

export type BuildingLevelCost = BuildingLevelDefinition;

export interface BuildingDefinition {
  enabled: boolean;
  unlockCastleLevel?: number;
  levels: Record<number, BuildingLevelDefinition>;
}

const ENABLED = true;
const DISABLED = false;

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  CASTLE: {
    enabled: ENABLED,
    levels: {
      1: { wood: 0, stone: 0, iron: 0, population: 2, timeSeconds: 0 },
      2: { wood: 75, stone: 145, iron: 75, population: 0, timeSeconds: 15 },
      3: { wood: 85, stone: 170, iron: 85, population: 1, timeSeconds: 90 },
      4: { wood: 100, stone: 200, iron: 100, population: 0, timeSeconds: 450 },
      5: { wood: 120, stone: 235, iron: 120, population: 1, timeSeconds: 1800 },
      6: { wood: 140, stone: 275, iron: 140, population: 0, timeSeconds: 7200 },
      7: {
        wood: 160,
        stone: 320,
        iron: 160,
        population: 1,
        timeSeconds: 21600,
      },
      8: {
        wood: 190,
        stone: 375,
        iron: 190,
        population: 0,
        timeSeconds: 64800,
      },
      9: {
        wood: 220,
        stone: 440,
        iron: 220,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 260,
        stone: 515,
        iron: 260,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  WOOD: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 75, stone: 45, iron: 30, population: 5, timeSeconds: 5 },
      2: { wood: 90, stone: 55, iron: 35, population: 0, timeSeconds: 45 },
      3: { wood: 110, stone: 65, iron: 45, population: 1, timeSeconds: 180 },
      4: { wood: 130, stone: 80, iron: 50, population: 0, timeSeconds: 600 },
      5: { wood: 155, stone: 95, iron: 60, population: 1, timeSeconds: 2160 },
      6: { wood: 185, stone: 110, iron: 75, population: 0, timeSeconds: 7200 },
      7: { wood: 220, stone: 135, iron: 90, population: 1, timeSeconds: 21600 },
      8: { wood: 265, stone: 160, iron: 105, population: 0, timeSeconds: 64800 },
      9: {
        wood: 320,
        stone: 190,
        iron: 125,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 385,
        stone: 230,
        iron: 150,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  STONE: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 45, stone: 75, iron: 30, population: 5, timeSeconds: 5 },
      2: { wood: 55, stone: 90, iron: 35, population: 0, timeSeconds: 45 },
      3: { wood: 65, stone: 110, iron: 45, population: 1, timeSeconds: 180 },
      4: { wood: 80, stone: 130, iron: 50, population: 0, timeSeconds: 600 },
      5: { wood: 95, stone: 155, iron: 60, population: 1, timeSeconds: 2160 },
      6: { wood: 110, stone: 185, iron: 75, population: 0, timeSeconds: 7200 },
      7: { wood: 135, stone: 220, iron: 90, population: 1, timeSeconds: 21600 },
      8: { wood: 160, stone: 265, iron: 105, population: 0, timeSeconds: 64800 },
      9: {
        wood: 190,
        stone: 320,
        iron: 125,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 230,
        stone: 385,
        iron: 150,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  IRON: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 40, stone: 40, iron: 75, population: 5, timeSeconds: 5 },
      2: { wood: 45, stone: 45, iron: 90, population: 0, timeSeconds: 45 },
      3: { wood: 55, stone: 55, iron: 110, population: 1, timeSeconds: 180 },
      4: { wood: 65, stone: 65, iron: 130, population: 0, timeSeconds: 600 },
      5: { wood: 80, stone: 80, iron: 155, population: 1, timeSeconds: 2160 },
      6: { wood: 95, stone: 95, iron: 185, population: 0, timeSeconds: 7200 },
      7: { wood: 115, stone: 115, iron: 220, population: 1, timeSeconds: 21600 },
      8: { wood: 135, stone: 135, iron: 265, population: 0, timeSeconds: 64800 },
      9: {
        wood: 160,
        stone: 160,
        iron: 320,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 190,
        stone: 190,
        iron: 385,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  WAREHOUSE: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 60, stone: 55, iron: 40, population: 0, timeSeconds: 20 },
      2: { wood: 70, stone: 60, iron: 45, population: 1, timeSeconds: 120 },
      3: { wood: 80, stone: 70, iron: 50, population: 0, timeSeconds: 360 },
      4: { wood: 90, stone: 80, iron: 60, population: 1, timeSeconds: 1200 },
      5: { wood: 105, stone: 90, iron: 70, population: 0, timeSeconds: 2700 },
      6: { wood: 120, stone: 105, iron: 75, population: 1, timeSeconds: 8100 },
      7: { wood: 140, stone: 120, iron: 85, population: 0, timeSeconds: 17280 },
      8: { wood: 160, stone: 140, iron: 100, population: 1, timeSeconds: 28800 },
      9: {
        wood: 185,
        stone: 160,
        iron: 115,
        population: 0,
        timeSeconds: 50400,
      },
      10: {
        wood: 210,
        stone: 185,
        iron: 130,
        population: 1,
        timeSeconds: 86400,
      },
    },
  },
  HIDEOUT: {
    enabled: DISABLED,
    unlockCastleLevel: 4,
    levels: {
      1: { wood: 105, stone: 105, iron: 90, population: 6, timeSeconds: 90 },
      2: { wood: 135, stone: 135, iron: 115, population: 0, timeSeconds: 150 },
      3: { wood: 175, stone: 175, iron: 150, population: 1, timeSeconds: 245 },
      4: { wood: 230, stone: 230, iron: 195, population: 0, timeSeconds: 405 },
      5: { wood: 300, stone: 300, iron: 255, population: 1, timeSeconds: 670 },
      6: { wood: 390, stone: 390, iron: 330, population: 0, timeSeconds: 1100 },
      7: { wood: 505, stone: 505, iron: 430, population: 1, timeSeconds: 1820 },
      8: {
        wood: 655,
        stone: 655,
        iron: 560,
        population: 0,
        timeSeconds: 3000,
      },
      9: {
        wood: 850,
        stone: 850,
        iron: 725,
        population: 1,
        timeSeconds: 4950,
      },
      10: {
        wood: 1105,
        stone: 1105,
        iron: 945,
        population: 0,
        timeSeconds: 8165,
      },
    },
  },
  QUARTER: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 70, stone: 65, iron: 45, population: 5, timeSeconds: 30 },
      2: { wood: 85, stone: 75, iron: 55, population: 0, timeSeconds: 180 },
      3: { wood: 100, stone: 90, iron: 65, population: 1, timeSeconds: 600 },
      4: { wood: 120, stone: 105, iron: 75, population: 0, timeSeconds: 1800 },
      5: { wood: 140, stone: 125, iron: 90, population: 1, timeSeconds: 4050 },
      6: { wood: 165, stone: 145, iron: 105, population: 0, timeSeconds: 10800 },
      7: { wood: 195, stone: 170, iron: 125, population: 1, timeSeconds: 21600 },
      8: {
        wood: 230,
        stone: 200,
        iron: 145,
        population: 0,
        timeSeconds: 43200,
      },
      9: {
        wood: 270,
        stone: 235,
        iron: 170,
        population: 1,
        timeSeconds: 86400,
      },
      10: {
        wood: 320,
        stone: 280,
        iron: 200,
        population: 0,
        timeSeconds: 172800,
      },
    },
  },
  BARRACKS: {
    enabled: ENABLED,
    unlockCastleLevel: 2,
    levels: {
      1: { wood: 120, stone: 120, iron: 160, population: 8, timeSeconds: 60 },
      2: { wood: 140, stone: 140, iron: 190, population: 0, timeSeconds: 540 },
      3: { wood: 170, stone: 170, iron: 225, population: 1, timeSeconds: 1800 },
      4: { wood: 200, stone: 200, iron: 265, population: 0, timeSeconds: 4500 },
      5: { wood: 235, stone: 235, iron: 315, population: 1, timeSeconds: 10800 },
      6: { wood: 280, stone: 280, iron: 370, population: 0, timeSeconds: 28800 },
      7: {
        wood: 330,
        stone: 330,
        iron: 440,
        population: 1,
        timeSeconds: 54000,
      },
      8: {
        wood: 390,
        stone: 390,
        iron: 520,
        population: 0,
        timeSeconds: 86400,
      },
      9: {
        wood: 460,
        stone: 460,
        iron: 615,
        population: 1,
        timeSeconds: 216000,
      },
      10: {
        wood: 545,
        stone: 545,
        iron: 725,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  WATCHTOWER: {
    enabled: ENABLED,
    unlockCastleLevel: 3,
    levels: {
      1: { wood: 90, stone: 175, iron: 90, population: 6, timeSeconds: 30 },
      2: { wood: 105, stone: 210, iron: 105, population: 0, timeSeconds: 360 },
      3: { wood: 130, stone: 250, iron: 130, population: 1, timeSeconds: 1440 },
      4: { wood: 150, stone: 300, iron: 150, population: 0, timeSeconds: 3750 },
      5: { wood: 180, stone: 355, iron: 180, population: 1, timeSeconds: 9000 },
      6: { wood: 215, stone: 425, iron: 215, population: 0, timeSeconds: 25200 },
      7: {
        wood: 255,
        stone: 505,
        iron: 255,
        population: 1,
        timeSeconds: 48600,
      },
      8: {
        wood: 305,
        stone: 605,
        iron: 305,
        population: 0,
        timeSeconds: 86400,
      },
      9: {
        wood: 360,
        stone: 720,
        iron: 360,
        population: 1,
        timeSeconds: 216000,
      },
      10: {
        wood: 430,
        stone: 860,
        iron: 430,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  COUNCIL_HALL: {
    enabled: ENABLED,
    unlockCastleLevel: 4,
    levels: {
      1: { wood: 150, stone: 200, iron: 100, population: 4, timeSeconds: 900 },
    },
  },
  THRONE_HALL: {
    enabled: ENABLED,
    unlockCastleLevel: 6,
    levels: {
      1: { wood: 1600, stone: 2400, iron: 1200, population: 6, timeSeconds: 21600 },
    },
  },
  WALL: {
    enabled: DISABLED,
    unlockCastleLevel: 5,
    levels: {
      1: { wood: 500, stone: 1000, iron: 500, population: 8, timeSeconds: 225 },
      2: {
        wood: 625,
        stone: 1250,
        iron: 625,
        population: 0,
        timeSeconds: 405,
      },
      3: {
        wood: 780,
        stone: 1560,
        iron: 780,
        population: 1,
        timeSeconds: 730,
      },
      4: {
        wood: 975,
        stone: 1950,
        iron: 975,
        population: 0,
        timeSeconds: 1315,
      },
      5: {
        wood: 1220,
        stone: 2440,
        iron: 1220,
        population: 1,
        timeSeconds: 2360,
      },
      6: {
        wood: 1525,
        stone: 3050,
        iron: 1525,
        population: 0,
        timeSeconds: 4250,
      },
      7: {
        wood: 1905,
        stone: 3810,
        iron: 1905,
        population: 1,
        timeSeconds: 7650,
      },
      8: {
        wood: 2380,
        stone: 4760,
        iron: 2380,
        population: 0,
        timeSeconds: 13775,
      },
      9: {
        wood: 2975,
        stone: 5950,
        iron: 2975,
        population: 1,
        timeSeconds: 24790,
      },
      10: {
        wood: 3720,
        stone: 7440,
        iron: 3720,
        population: 0,
        timeSeconds: 44620,
      },
    },
  },
};

export const MAX_CONSTRUCTION_QUEUE = 3;

export const CASTLE_CONSTRUCTION_SPEED_BONUS: Record<number, number> = {
  1: 1.0,
  2: 0.96,
  3: 0.92,
  4: 0.88,
  5: 0.84,
  6: 0.8,
  7: 0.76,
  8: 0.72,
  9: 0.68,
  10: 0.64,
};

export const BARRACKS_TRAINING_SPEED_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 1.04,
  3: 1.08,
  4: 1.12,
  5: 1.16,
  6: 1.2,
  7: 1.24,
  8: 1.28,
  9: 1.32,
  10: 1.36,
};

export const getBarracksTrainingSpeedMultiplier = (level: number): number => {
  const normalizedLevel = Number.isFinite(level) ? Math.floor(level) : 1;
  const clampedLevel = Math.max(1, Math.min(10, normalizedLevel));
  return BARRACKS_TRAINING_SPEED_MULTIPLIER[clampedLevel] ?? 1;
};

export interface WatchtowerVisionLevel {
  isWorldUnlocked: boolean;
  visibilityRadius: number;
}

export const WATCHTOWER_VISION_LEVELS: Record<number, WatchtowerVisionLevel> = {
  0: { isWorldUnlocked: false, visibilityRadius: 0 },
  1: { isWorldUnlocked: true, visibilityRadius: 10 },
  2: { isWorldUnlocked: true, visibilityRadius: 15 },
  3: { isWorldUnlocked: true, visibilityRadius: 20 },
  4: { isWorldUnlocked: true, visibilityRadius: 25 },
  5: { isWorldUnlocked: true, visibilityRadius: 30 },
  6: { isWorldUnlocked: true, visibilityRadius: 35 },
  7: { isWorldUnlocked: true, visibilityRadius: 40 },
  8: { isWorldUnlocked: true, visibilityRadius: 45 },
  9: { isWorldUnlocked: true, visibilityRadius: 50 },
  10: { isWorldUnlocked: true, visibilityRadius: 55 },
};

const BUILDING_DEFINITION_ENTRIES = Object.entries(BUILDING_DEFINITIONS) as Array<
  [BuildingType, BuildingDefinition]
>;

export const BUILDING_UNLOCK_REQUIREMENTS: Partial<Record<BuildingType, number>> =
  Object.fromEntries(
    BUILDING_DEFINITION_ENTRIES.flatMap(([type, definition]) => {
      if (definition.unlockCastleLevel === undefined) return [];
      return [[type, definition.unlockCastleLevel]];
    })
  );

export const getBuildingUnlockRequirement = (type: string): number | null =>
  BUILDING_UNLOCK_REQUIREMENTS[type as BuildingType] ?? null;

export const getBuildingDefinition = (
  buildingType: string
): BuildingDefinition => {
  const type = buildingType as BuildingType;
  const definition = BUILDING_DEFINITIONS[type];
  if (!definition) {
    throw new Error(`Unknown building type ${buildingType}`);
  }
  return definition;
};

export const getBuildingLevelValues = (
  buildingType: string,
  level: number
): BuildingLevelDefinition | null => {
  if (level < 1) return null;
  const definition = getBuildingDefinition(buildingType);
  return definition.levels[level] ?? null;
};

export const getBuildingLevelCost = (
  buildingType: string,
  level: number
): BuildingLevelCost | null => {
  return getBuildingLevelValues(buildingType, level);
};

export const getBuildingMaxLevel = (buildingType: string): number => {
  const definition = getBuildingDefinition(buildingType);
  return Math.max(...Object.keys(definition.levels).map((lvl) => Number(lvl)));
};

export const isBuildingEnabled = (buildingType: string): boolean => {
  const definition = BUILDING_DEFINITIONS[buildingType as BuildingType];
  return definition?.enabled !== false;
};
