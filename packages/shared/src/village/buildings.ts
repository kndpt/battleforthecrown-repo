export const BUILDING_TYPES = {
  CASTLE: "CASTLE",
  WOOD: "WOOD",
  STONE: "STONE",
  IRON: "IRON",
  WAREHOUSE: "WAREHOUSE",
  HIDEOUT: "HIDEOUT",
  FARM: "FARM",
  BARRACKS: "BARRACKS",
  WATCHTOWER: "WATCHTOWER",
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
      2: { wood: 75, stone: 145, iron: 75, population: 0, timeSeconds: 360 },
      3: { wood: 85, stone: 170, iron: 85, population: 1, timeSeconds: 720 },
      4: { wood: 100, stone: 200, iron: 100, population: 0, timeSeconds: 1440 },
      5: { wood: 120, stone: 235, iron: 120, population: 1, timeSeconds: 2880 },
      6: { wood: 140, stone: 275, iron: 140, population: 0, timeSeconds: 5760 },
      7: {
        wood: 160,
        stone: 320,
        iron: 160,
        population: 1,
        timeSeconds: 11520,
      },
      8: {
        wood: 190,
        stone: 375,
        iron: 190,
        population: 0,
        timeSeconds: 23040,
      },
      9: {
        wood: 220,
        stone: 440,
        iron: 220,
        population: 1,
        timeSeconds: 46080,
      },
      10: {
        wood: 260,
        stone: 515,
        iron: 260,
        population: 0,
        timeSeconds: 92160,
      },
    },
  },
  WOOD: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 75, stone: 45, iron: 30, population: 5, timeSeconds: 120 },
      2: { wood: 90, stone: 55, iron: 35, population: 0, timeSeconds: 220 },
      3: { wood: 110, stone: 65, iron: 45, population: 1, timeSeconds: 390 },
      4: { wood: 130, stone: 80, iron: 50, population: 0, timeSeconds: 710 },
      5: { wood: 155, stone: 95, iron: 60, population: 1, timeSeconds: 1280 },
      6: { wood: 185, stone: 110, iron: 75, population: 0, timeSeconds: 2300 },
      7: { wood: 220, stone: 135, iron: 90, population: 1, timeSeconds: 4140 },
      8: { wood: 265, stone: 160, iron: 105, population: 0, timeSeconds: 7450 },
      9: {
        wood: 320,
        stone: 190,
        iron: 125,
        population: 1,
        timeSeconds: 13410,
      },
      10: {
        wood: 385,
        stone: 230,
        iron: 150,
        population: 0,
        timeSeconds: 24140,
      },
    },
  },
  STONE: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 45, stone: 75, iron: 30, population: 5, timeSeconds: 120 },
      2: { wood: 55, stone: 90, iron: 35, population: 0, timeSeconds: 220 },
      3: { wood: 65, stone: 110, iron: 45, population: 1, timeSeconds: 390 },
      4: { wood: 80, stone: 130, iron: 50, population: 0, timeSeconds: 710 },
      5: { wood: 95, stone: 155, iron: 60, population: 1, timeSeconds: 1280 },
      6: { wood: 110, stone: 185, iron: 75, population: 0, timeSeconds: 2300 },
      7: { wood: 135, stone: 220, iron: 90, population: 1, timeSeconds: 4140 },
      8: { wood: 160, stone: 265, iron: 105, population: 0, timeSeconds: 7450 },
      9: {
        wood: 190,
        stone: 320,
        iron: 125,
        population: 1,
        timeSeconds: 13410,
      },
      10: {
        wood: 230,
        stone: 385,
        iron: 150,
        population: 0,
        timeSeconds: 24140,
      },
    },
  },
  IRON: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 40, stone: 40, iron: 75, population: 5, timeSeconds: 120 },
      2: { wood: 45, stone: 45, iron: 90, population: 0, timeSeconds: 220 },
      3: { wood: 55, stone: 55, iron: 110, population: 1, timeSeconds: 390 },
      4: { wood: 65, stone: 65, iron: 130, population: 0, timeSeconds: 710 },
      5: { wood: 80, stone: 80, iron: 155, population: 1, timeSeconds: 1280 },
      6: { wood: 95, stone: 95, iron: 185, population: 0, timeSeconds: 2300 },
      7: { wood: 115, stone: 115, iron: 220, population: 1, timeSeconds: 4140 },
      8: { wood: 135, stone: 135, iron: 265, population: 0, timeSeconds: 7450 },
      9: {
        wood: 160,
        stone: 160,
        iron: 320,
        population: 1,
        timeSeconds: 13410,
      },
      10: {
        wood: 190,
        stone: 190,
        iron: 385,
        population: 0,
        timeSeconds: 24140,
      },
    },
  },
  WAREHOUSE: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 60, stone: 55, iron: 40, population: 0, timeSeconds: 300 },
      2: { wood: 70, stone: 60, iron: 45, population: 1, timeSeconds: 480 },
      3: { wood: 80, stone: 70, iron: 50, population: 0, timeSeconds: 770 },
      4: { wood: 90, stone: 80, iron: 60, population: 1, timeSeconds: 1230 },
      5: { wood: 105, stone: 90, iron: 70, population: 0, timeSeconds: 1970 },
      6: { wood: 120, stone: 105, iron: 75, population: 1, timeSeconds: 3150 },
      7: { wood: 140, stone: 120, iron: 85, population: 0, timeSeconds: 5040 },
      8: { wood: 160, stone: 140, iron: 100, population: 1, timeSeconds: 8070 },
      9: {
        wood: 185,
        stone: 160,
        iron: 115,
        population: 0,
        timeSeconds: 12910,
      },
      10: {
        wood: 210,
        stone: 185,
        iron: 130,
        population: 1,
        timeSeconds: 20660,
      },
    },
  },
  HIDEOUT: {
    enabled: DISABLED,
    unlockCastleLevel: 4,
    levels: {
      1: { wood: 105, stone: 105, iron: 90, population: 6, timeSeconds: 360 },
      2: { wood: 135, stone: 135, iron: 115, population: 0, timeSeconds: 595 },
      3: { wood: 175, stone: 175, iron: 150, population: 1, timeSeconds: 980 },
      4: { wood: 230, stone: 230, iron: 195, population: 0, timeSeconds: 1620 },
      5: { wood: 300, stone: 300, iron: 255, population: 1, timeSeconds: 2670 },
      6: { wood: 390, stone: 390, iron: 330, population: 0, timeSeconds: 4405 },
      7: { wood: 505, stone: 505, iron: 430, population: 1, timeSeconds: 7270 },
      8: {
        wood: 655,
        stone: 655,
        iron: 560,
        population: 0,
        timeSeconds: 11995,
      },
      9: {
        wood: 850,
        stone: 850,
        iron: 725,
        population: 1,
        timeSeconds: 19795,
      },
      10: {
        wood: 1105,
        stone: 1105,
        iron: 945,
        population: 0,
        timeSeconds: 32660,
      },
    },
  },
  FARM: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 70, stone: 65, iron: 45, population: 5, timeSeconds: 400 },
      2: { wood: 85, stone: 75, iron: 55, population: 0, timeSeconds: 680 },
      3: { wood: 100, stone: 90, iron: 65, population: 1, timeSeconds: 1160 },
      4: { wood: 120, stone: 105, iron: 75, population: 0, timeSeconds: 1970 },
      5: { wood: 140, stone: 125, iron: 90, population: 1, timeSeconds: 3350 },
      6: { wood: 165, stone: 145, iron: 105, population: 0, timeSeconds: 5695 },
      7: { wood: 195, stone: 170, iron: 125, population: 1, timeSeconds: 9680 },
      8: {
        wood: 230,
        stone: 200,
        iron: 145,
        population: 0,
        timeSeconds: 16455,
      },
      9: {
        wood: 270,
        stone: 235,
        iron: 170,
        population: 1,
        timeSeconds: 27975,
      },
      10: {
        wood: 320,
        stone: 280,
        iron: 200,
        population: 0,
        timeSeconds: 47560,
      },
    },
  },
  BARRACKS: {
    enabled: ENABLED,
    unlockCastleLevel: 2,
    levels: {
      1: { wood: 120, stone: 120, iron: 160, population: 8, timeSeconds: 600 },
      2: { wood: 140, stone: 140, iron: 190, population: 0, timeSeconds: 1020 },
      3: { wood: 170, stone: 170, iron: 225, population: 1, timeSeconds: 1735 },
      4: { wood: 200, stone: 200, iron: 265, population: 0, timeSeconds: 2950 },
      5: { wood: 235, stone: 235, iron: 315, population: 1, timeSeconds: 5015 },
      6: { wood: 280, stone: 280, iron: 370, population: 0, timeSeconds: 8525 },
      7: {
        wood: 330,
        stone: 330,
        iron: 440,
        population: 1,
        timeSeconds: 14490,
      },
      8: {
        wood: 390,
        stone: 390,
        iron: 520,
        population: 0,
        timeSeconds: 24635,
      },
      9: {
        wood: 460,
        stone: 460,
        iron: 615,
        population: 1,
        timeSeconds: 41880,
      },
      10: {
        wood: 545,
        stone: 545,
        iron: 725,
        population: 0,
        timeSeconds: 71195,
      },
    },
  },
  WATCHTOWER: {
    enabled: ENABLED,
    unlockCastleLevel: 3,
    levels: {
      1: { wood: 90, stone: 175, iron: 90, population: 6, timeSeconds: 500 },
      2: { wood: 105, stone: 210, iron: 105, population: 0, timeSeconds: 875 },
      3: { wood: 130, stone: 250, iron: 130, population: 1, timeSeconds: 1530 },
      4: { wood: 150, stone: 300, iron: 150, population: 0, timeSeconds: 2680 },
      5: { wood: 180, stone: 355, iron: 180, population: 1, timeSeconds: 4690 },
      6: { wood: 215, stone: 425, iron: 215, population: 0, timeSeconds: 8205 },
      7: {
        wood: 255,
        stone: 505,
        iron: 255,
        population: 1,
        timeSeconds: 14360,
      },
      8: {
        wood: 305,
        stone: 605,
        iron: 305,
        population: 0,
        timeSeconds: 25130,
      },
      9: {
        wood: 360,
        stone: 720,
        iron: 360,
        population: 1,
        timeSeconds: 43975,
      },
      10: {
        wood: 430,
        stone: 860,
        iron: 430,
        population: 0,
        timeSeconds: 76960,
      },
    },
  },
  WALL: {
    enabled: DISABLED,
    unlockCastleLevel: 5,
    levels: {
      1: { wood: 500, stone: 1000, iron: 500, population: 8, timeSeconds: 900 },
      2: {
        wood: 625,
        stone: 1250,
        iron: 625,
        population: 0,
        timeSeconds: 1620,
      },
      3: {
        wood: 780,
        stone: 1560,
        iron: 780,
        population: 1,
        timeSeconds: 2915,
      },
      4: {
        wood: 975,
        stone: 1950,
        iron: 975,
        population: 0,
        timeSeconds: 5250,
      },
      5: {
        wood: 1220,
        stone: 2440,
        iron: 1220,
        population: 1,
        timeSeconds: 9445,
      },
      6: {
        wood: 1525,
        stone: 3050,
        iron: 1525,
        population: 0,
        timeSeconds: 17000,
      },
      7: {
        wood: 1905,
        stone: 3810,
        iron: 1905,
        population: 1,
        timeSeconds: 30605,
      },
      8: {
        wood: 2380,
        stone: 4760,
        iron: 2380,
        population: 0,
        timeSeconds: 55090,
      },
      9: {
        wood: 2975,
        stone: 5950,
        iron: 2975,
        population: 1,
        timeSeconds: 99160,
      },
      10: {
        wood: 3720,
        stone: 7440,
        iron: 3720,
        population: 0,
        timeSeconds: 178485,
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

export interface WatchtowerVisionLevel {
  isWorldUnlocked: boolean;
  visibilityRadius: number | null;
}

export const WATCHTOWER_VISION_LEVELS: Record<number, WatchtowerVisionLevel> = {
  0: { isWorldUnlocked: false, visibilityRadius: 0 },
  1: { isWorldUnlocked: true, visibilityRadius: 5 },
  2: { isWorldUnlocked: true, visibilityRadius: 10 },
  3: { isWorldUnlocked: true, visibilityRadius: 15 },
  4: { isWorldUnlocked: true, visibilityRadius: 20 },
  5: { isWorldUnlocked: true, visibilityRadius: 25 },
  6: { isWorldUnlocked: true, visibilityRadius: 30 },
  7: { isWorldUnlocked: true, visibilityRadius: 35 },
  8: { isWorldUnlocked: true, visibilityRadius: 40 },
  9: { isWorldUnlocked: true, visibilityRadius: 45 },
  10: { isWorldUnlocked: true, visibilityRadius: null },
};

export const BUILDING_UNLOCK_REQUIREMENTS: Partial<
  Record<BuildingType, number>
> = {
  WOOD: 1,
  STONE: 1,
  IRON: 1,
  WAREHOUSE: 1,
  FARM: 1,
  BARRACKS: 2,
  WATCHTOWER: 3,
  HIDEOUT: 4,
  WALL: 5,
};

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
