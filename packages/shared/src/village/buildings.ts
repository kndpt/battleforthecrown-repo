import { clampBuildingLevel } from "../utils/level";

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

/**
 * @deprecated Use {@link BuildingLevelDefinition} directly. Kept as a zero-cost
 * alias to preserve the public `@battleforthecrown/shared/village` type surface.
 */
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
      2: { wood: 190, stone: 340, iron: 190, population: 0, timeSeconds: 15 },
      3: { wood: 355, stone: 635, iron: 355, population: 1, timeSeconds: 90 },
      4: { wood: 670, stone: 1210, iron: 670, population: 0, timeSeconds: 450 },
      5: { wood: 1260, stone: 2270, iron: 1260, population: 1, timeSeconds: 1800 },
      6: { wood: 2365, stone: 4255, iron: 2365, population: 0, timeSeconds: 7200 },
      7: {
        wood: 4420,
        stone: 7955,
        iron: 4420,
        population: 1,
        timeSeconds: 21600,
      },
      8: {
        wood: 8190,
        stone: 14740,
        iron: 8190,
        population: 0,
        timeSeconds: 64800,
      },
      9: {
        wood: 14790,
        stone: 26620,
        iron: 14790,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 26100,
        stone: 46980,
        iron: 26100,
        population: 0,
        // Réduit (était 432000) pour que le dernier palier du Château reste
        // ~18 h une fois le bonus du niv 9 appliqué (0.29). Cf. ADR-15.
        timeSeconds: 223000,
      },
    },
  },
  WOOD: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 130, stone: 75, iron: 55, population: 5, timeSeconds: 5 },
      2: { wood: 235, stone: 135, iron: 95, population: 0, timeSeconds: 45 },
      3: { wood: 445, stone: 255, iron: 175, population: 1, timeSeconds: 180 },
      4: { wood: 840, stone: 485, iron: 335, population: 0, timeSeconds: 600 },
      5: { wood: 1575, stone: 905, iron: 630, population: 1, timeSeconds: 2160 },
      6: { wood: 2955, stone: 1700, iron: 1180, population: 0, timeSeconds: 7200 },
      7: { wood: 5525, stone: 3180, iron: 2210, population: 1, timeSeconds: 21600 },
      8: { wood: 10240, stone: 5895, iron: 4095, population: 0, timeSeconds: 64800 },
      9: {
        wood: 18490,
        stone: 10650,
        iron: 7395,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 32625,
        stone: 18790,
        iron: 13050,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  STONE: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 75, stone: 130, iron: 55, population: 5, timeSeconds: 5 },
      2: { wood: 135, stone: 235, iron: 95, population: 0, timeSeconds: 45 },
      3: { wood: 255, stone: 445, iron: 175, population: 1, timeSeconds: 180 },
      4: { wood: 485, stone: 840, iron: 335, population: 0, timeSeconds: 600 },
      5: { wood: 905, stone: 1575, iron: 630, population: 1, timeSeconds: 2160 },
      6: { wood: 1700, stone: 2955, iron: 1180, population: 0, timeSeconds: 7200 },
      7: { wood: 3180, stone: 5525, iron: 2210, population: 1, timeSeconds: 21600 },
      8: { wood: 5895, stone: 10240, iron: 4095, population: 0, timeSeconds: 64800 },
      9: {
        wood: 10650,
        stone: 18490,
        iron: 7395,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 18790,
        stone: 32625,
        iron: 13050,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  IRON: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 70, stone: 70, iron: 130, population: 5, timeSeconds: 5 },
      2: { wood: 130, stone: 130, iron: 235, population: 0, timeSeconds: 45 },
      3: { wood: 240, stone: 240, iron: 445, population: 1, timeSeconds: 180 },
      4: { wood: 455, stone: 455, iron: 840, population: 0, timeSeconds: 600 },
      5: { wood: 855, stone: 855, iron: 1575, population: 1, timeSeconds: 2160 },
      6: { wood: 1605, stone: 1605, iron: 2955, population: 0, timeSeconds: 7200 },
      7: { wood: 3005, stone: 3005, iron: 5525, population: 1, timeSeconds: 21600 },
      8: { wood: 5570, stone: 5570, iron: 10240, population: 0, timeSeconds: 64800 },
      9: {
        wood: 10055,
        stone: 10055,
        iron: 18490,
        population: 1,
        timeSeconds: 172800,
      },
      10: {
        wood: 17750,
        stone: 17750,
        iron: 32625,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  WAREHOUSE: {
    enabled: ENABLED,
    unlockCastleLevel: 1,
    levels: {
      1: { wood: 90, stone: 80, iron: 60, population: 0, timeSeconds: 20 },
      2: { wood: 165, stone: 145, iron: 105, population: 1, timeSeconds: 120 },
      3: { wood: 310, stone: 275, iron: 195, population: 0, timeSeconds: 360 },
      4: { wood: 590, stone: 525, iron: 370, population: 1, timeSeconds: 1200 },
      5: { wood: 1110, stone: 985, iron: 695, population: 0, timeSeconds: 2700 },
      6: { wood: 2080, stone: 1845, iron: 1300, population: 1, timeSeconds: 8100 },
      7: { wood: 3890, stone: 3450, iron: 2430, population: 0, timeSeconds: 17280 },
      8: { wood: 7205, stone: 6390, iron: 4505, population: 1, timeSeconds: 28800 },
      9: {
        wood: 13015,
        stone: 11535,
        iron: 8135,
        population: 0,
        timeSeconds: 50400,
      },
      10: {
        wood: 22970,
        stone: 20360,
        iron: 14355,
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
      1: { wood: 90, stone: 80, iron: 60, population: 5, timeSeconds: 30 },
      2: { wood: 165, stone: 145, iron: 110, population: 0, timeSeconds: 180 },
      3: { wood: 310, stone: 275, iron: 205, population: 1, timeSeconds: 600 },
      4: { wood: 590, stone: 525, iron: 390, population: 0, timeSeconds: 1800 },
      5: { wood: 1110, stone: 985, iron: 730, population: 1, timeSeconds: 4050 },
      6: { wood: 2080, stone: 1845, iron: 1370, population: 0, timeSeconds: 10800 },
      7: { wood: 3890, stone: 3450, iron: 2565, population: 1, timeSeconds: 21600 },
      8: {
        wood: 7205,
        stone: 6390,
        iron: 4750,
        population: 0,
        timeSeconds: 43200,
      },
      9: {
        wood: 13015,
        stone: 11535,
        iron: 8580,
        population: 1,
        timeSeconds: 86400,
      },
      10: {
        wood: 22970,
        stone: 20360,
        iron: 15140,
        population: 0,
        timeSeconds: 172800,
      },
    },
  },
  BARRACKS: {
    enabled: ENABLED,
    unlockCastleLevel: 2,
    levels: {
      1: { wood: 100, stone: 100, iron: 130, population: 8, timeSeconds: 60 },
      2: { wood: 180, stone: 180, iron: 235, population: 0, timeSeconds: 540 },
      3: { wood: 335, stone: 335, iron: 445, population: 1, timeSeconds: 1800 },
      4: { wood: 640, stone: 640, iron: 840, population: 0, timeSeconds: 4500 },
      5: { wood: 1195, stone: 1195, iron: 1575, population: 1, timeSeconds: 10800 },
      6: { wood: 2245, stone: 2245, iron: 2955, population: 0, timeSeconds: 28800 },
      7: {
        wood: 4200,
        stone: 4200,
        iron: 5525,
        population: 1,
        timeSeconds: 54000,
      },
      8: {
        wood: 7780,
        stone: 7780,
        iron: 10240,
        population: 0,
        timeSeconds: 86400,
      },
      9: {
        wood: 14050,
        stone: 14050,
        iron: 18490,
        population: 1,
        timeSeconds: 216000,
      },
      10: {
        wood: 24795,
        stone: 24795,
        iron: 32625,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  WATCHTOWER: {
    enabled: ENABLED,
    unlockCastleLevel: 3,
    levels: {
      1: { wood: 95, stone: 165, iron: 95, population: 6, timeSeconds: 30 },
      2: { wood: 170, stone: 295, iron: 170, population: 0, timeSeconds: 360 },
      3: { wood: 320, stone: 550, iron: 320, population: 1, timeSeconds: 1440 },
      4: { wood: 605, stone: 1040, iron: 605, population: 0, timeSeconds: 3750 },
      5: { wood: 1135, stone: 1955, iron: 1135, population: 1, timeSeconds: 9000 },
      6: { wood: 2125, stone: 3660, iron: 2125, population: 0, timeSeconds: 25200 },
      7: {
        wood: 3980,
        stone: 6850,
        iron: 3980,
        population: 1,
        timeSeconds: 48600,
      },
      8: {
        wood: 7370,
        stone: 12695,
        iron: 7370,
        population: 0,
        timeSeconds: 86400,
      },
      9: {
        wood: 13310,
        stone: 22925,
        iron: 13310,
        population: 1,
        timeSeconds: 216000,
      },
      10: {
        wood: 23490,
        stone: 40455,
        iron: 23490,
        population: 0,
        timeSeconds: 432000,
      },
    },
  },
  COUNCIL_HALL: {
    enabled: ENABLED,
    unlockCastleLevel: 4,
    levels: {
      1: { wood: 1510, stone: 2040, iron: 1135, population: 4, timeSeconds: 900 },
    },
  },
  THRONE_HALL: {
    enabled: ENABLED,
    unlockCastleLevel: 6,
    levels: {
      1: { wood: 3850, stone: 5775, iron: 2890, population: 6, timeSeconds: 21600 },
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

// Diviseur de durée appliqué à TOUTE construction du village, selon le niveau
// actuel du Château (cf. building-cost.ts). Courbe géométrique 1.0 -> 0.25 :
// le multiplicateur ressenti par le joueur passe de ×1.0 (niv1) à ×4.0 (niv10).
// Calibrée pour un max-village ~7-8 j wall-clock (cf. ADR-15, validée au
// build-simulator). Monter le Château devient le levier central de vitesse.
export const CASTLE_CONSTRUCTION_SPEED_BONUS: Record<number, number> = {
  1: 1.0, // ×1.00
  2: 0.86, // ×1.16
  3: 0.74, // ×1.35
  4: 0.63, // ×1.59
  5: 0.54, // ×1.85
  6: 0.46, // ×2.17
  7: 0.4, // ×2.50
  8: 0.34, // ×2.94
  9: 0.29, // ×3.45
  10: 0.25, // ×4.00
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
  return BARRACKS_TRAINING_SPEED_MULTIPLIER[clampBuildingLevel(level)] ?? 1;
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
): BuildingLevelDefinition | null => {
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
