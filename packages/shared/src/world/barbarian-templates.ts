import { BUILDING_TYPES, type BuildingType } from '../village/buildings';

export interface BuildingTemplate {
  type: BuildingType;
  level: number;
}

export interface TierTemplate {
  buildings: BuildingTemplate[];
  populationMax: number;
}

/**
 * Tier templates for barbarian village generation.
 *
 * Barbarian villages share the player building enum (BUILDING_TYPES). The tier
 * difference is purely compositional: which buildings, at which levels.
 *
 * Barbarians own no troops at runtime — combat reads `units: {}` (cf.
 * BarbarianVillageStrategy). No `units` field is therefore exposed here.
 */
export const BARBARIAN_TIER_TEMPLATES: Record<string, TierTemplate> = {
  T1: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 3 },
      { type: BUILDING_TYPES.BARRACKS, level: 2 },
      { type: BUILDING_TYPES.WOOD, level: 2 },
      { type: BUILDING_TYPES.STONE, level: 2 },
      { type: BUILDING_TYPES.IRON, level: 1 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 3 },
      { type: BUILDING_TYPES.FARM, level: 2 },
    ],
    populationMax: 40,
  },

  T2: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 6 },
      { type: BUILDING_TYPES.BARRACKS, level: 4 },
      { type: BUILDING_TYPES.WOOD, level: 5 },
      { type: BUILDING_TYPES.STONE, level: 5 },
      { type: BUILDING_TYPES.IRON, level: 4 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 6 },
      { type: BUILDING_TYPES.FARM, level: 5 },
      { type: BUILDING_TYPES.WALL, level: 3 },
    ],
    populationMax: 100,
  },

  T3: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 10 },
      { type: BUILDING_TYPES.BARRACKS, level: 7 },
      { type: BUILDING_TYPES.WOOD, level: 8 },
      { type: BUILDING_TYPES.STONE, level: 8 },
      { type: BUILDING_TYPES.IRON, level: 7 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 10 },
      { type: BUILDING_TYPES.FARM, level: 8 },
      { type: BUILDING_TYPES.WALL, level: 6 },
      { type: BUILDING_TYPES.WATCHTOWER, level: 4 },
    ],
    populationMax: 200,
  },
};

export function getBuildingTemplate(tier: string): BuildingTemplate[] {
  return (
    BARBARIAN_TIER_TEMPLATES[tier]?.buildings ||
    BARBARIAN_TIER_TEMPLATES.T1.buildings
  );
}

export function getPopulationMax(tier: string): number {
  return (
    BARBARIAN_TIER_TEMPLATES[tier]?.populationMax ||
    BARBARIAN_TIER_TEMPLATES.T1.populationMax
  );
}

/** Warehouse level extracted from the building template (drives storage capacity). */
export function getWarehouseLevel(tier: string): number {
  const buildings = getBuildingTemplate(tier);
  const warehouse = buildings.find((b) => b.type === BUILDING_TYPES.WAREHOUSE);
  return warehouse?.level || 3;
}
