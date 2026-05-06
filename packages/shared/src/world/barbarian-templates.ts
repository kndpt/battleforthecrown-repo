export interface BuildingTemplate {
  type: string;
  level: number;
}

export interface UnitTemplate {
  type: string;
  quantity: number;
}

export interface TierTemplate {
  buildings: BuildingTemplate[];
  units: UnitTemplate[];
  populationMax: number;
}

/**
 * Tier templates for barbarian village generation.
 * These determine the actual buildings and troops created at spawn.
 */
export const BARBARIAN_TIER_TEMPLATES: Record<string, TierTemplate> = {
  T1: {
    buildings: [
      { type: 'HQ', level: 3 },
      { type: 'BARRACKS', level: 2 },
      { type: 'WOOD', level: 2 },
      { type: 'STONE', level: 2 },
      { type: 'IRON', level: 1 },
      { type: 'WAREHOUSE', level: 3 },
      { type: 'FARM', level: 2 },
    ],
    units: [
      { type: 'SPEAR', quantity: 20 },
      { type: 'SWORD', quantity: 10 },
    ],
    populationMax: 40,
  },

  T2: {
    buildings: [
      { type: 'HQ', level: 6 },
      { type: 'BARRACKS', level: 4 },
      { type: 'STABLE', level: 2 },
      { type: 'WOOD', level: 5 },
      { type: 'STONE', level: 5 },
      { type: 'IRON', level: 4 },
      { type: 'WAREHOUSE', level: 6 },
      { type: 'FARM', level: 5 },
      { type: 'WALL', level: 3 },
    ],
    units: [
      { type: 'SPEAR', quantity: 50 },
      { type: 'SWORD', quantity: 30 },
      { type: 'AXEMAN', quantity: 20 },
      { type: 'LIGHT_CAVALRY', quantity: 10 },
    ],
    populationMax: 100,
  },

  T3: {
    buildings: [
      { type: 'HQ', level: 10 },
      { type: 'BARRACKS', level: 7 },
      { type: 'STABLE', level: 5 },
      { type: 'WORKSHOP', level: 3 },
      { type: 'WOOD', level: 8 },
      { type: 'STONE', level: 8 },
      { type: 'IRON', level: 7 },
      { type: 'WAREHOUSE', level: 10 },
      { type: 'FARM', level: 8 },
      { type: 'WALL', level: 6 },
      { type: 'WATCHTOWER', level: 4 },
    ],
    units: [
      { type: 'SPEAR', quantity: 100 },
      { type: 'SWORD', quantity: 80 },
      { type: 'AXEMAN', quantity: 60 },
      { type: 'LIGHT_CAVALRY', quantity: 40 },
      { type: 'HEAVY_CAVALRY', quantity: 20 },
      { type: 'RAM', quantity: 5 },
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

export function getUnitTemplate(tier: string): UnitTemplate[] {
  return (
    BARBARIAN_TIER_TEMPLATES[tier]?.units || BARBARIAN_TIER_TEMPLATES.T1.units
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
  const warehouse = buildings.find((b) => b.type === 'WAREHOUSE');
  return warehouse?.level || 3;
}
