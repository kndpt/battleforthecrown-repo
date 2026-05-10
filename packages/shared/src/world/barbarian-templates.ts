import { BUILDING_TYPES, type BuildingType } from '../village/buildings';
import type { UnitMap } from '../army/unit-map';

export interface BuildingTemplate {
  type: BuildingType;
  level: number;
}

export interface TierTemplate {
  buildings: BuildingTemplate[];
  populationMax: number;
  units: UnitMap;
}

/**
 * Tier templates for barbarian village generation.
 *
 * `units` is the **data-only blueprint** (fixed quantities per tier, cf. spec 06-barbarians.md
 * § Blueprint d'armée). Runtime persistence of barbarian troops is tracked separately
 * (see tasks/). The Warehouse level drives storage capacity (cf. spec § Cap stockage par tier).
 */
export const BARBARIAN_TIER_TEMPLATES: Record<string, TierTemplate> = {
  T1: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 3 },
      { type: BUILDING_TYPES.BARRACKS, level: 2 },
      { type: BUILDING_TYPES.WOOD, level: 2 },
      { type: BUILDING_TYPES.STONE, level: 2 },
      { type: BUILDING_TYPES.IRON, level: 1 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 1 },
      { type: BUILDING_TYPES.FARM, level: 2 },
    ],
    populationMax: 40,
    units: { MILITIA: 15 },
  },

  T2: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 6 },
      { type: BUILDING_TYPES.BARRACKS, level: 4 },
      { type: BUILDING_TYPES.WOOD, level: 5 },
      { type: BUILDING_TYPES.STONE, level: 5 },
      { type: BUILDING_TYPES.IRON, level: 4 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 1 },
      { type: BUILDING_TYPES.FARM, level: 5 },
      { type: BUILDING_TYPES.WALL, level: 3 },
    ],
    populationMax: 100,
    units: { MILITIA: 25, ARCHER: 10 },
  },

  T3: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 10 },
      { type: BUILDING_TYPES.BARRACKS, level: 7 },
      { type: BUILDING_TYPES.WOOD, level: 8 },
      { type: BUILDING_TYPES.STONE, level: 8 },
      { type: BUILDING_TYPES.IRON, level: 7 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 2 },
      { type: BUILDING_TYPES.FARM, level: 8 },
      { type: BUILDING_TYPES.WALL, level: 6 },
      { type: BUILDING_TYPES.WATCHTOWER, level: 4 },
    ],
    populationMax: 200,
    units: { MILITIA: 44, ARCHER: 18, SQUIRE: 8 },
  },

  T4: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 13 },
      { type: BUILDING_TYPES.BARRACKS, level: 9 },
      { type: BUILDING_TYPES.WOOD, level: 10 },
      { type: BUILDING_TYPES.STONE, level: 10 },
      { type: BUILDING_TYPES.IRON, level: 9 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 3 },
      { type: BUILDING_TYPES.FARM, level: 10 },
      { type: BUILDING_TYPES.WALL, level: 8 },
      { type: BUILDING_TYPES.WATCHTOWER, level: 6 },
    ],
    populationMax: 300,
    units: { MILITIA: 66, ARCHER: 28, SQUIRE: 11, TEMPLAR: 5 },
  },

  T5: {
    buildings: [
      { type: BUILDING_TYPES.CASTLE, level: 16 },
      { type: BUILDING_TYPES.BARRACKS, level: 11 },
      { type: BUILDING_TYPES.WOOD, level: 12 },
      { type: BUILDING_TYPES.STONE, level: 12 },
      { type: BUILDING_TYPES.IRON, level: 11 },
      { type: BUILDING_TYPES.WAREHOUSE, level: 4 },
      { type: BUILDING_TYPES.FARM, level: 12 },
      { type: BUILDING_TYPES.WALL, level: 10 },
      { type: BUILDING_TYPES.WATCHTOWER, level: 8 },
    ],
    populationMax: 400,
    units: { MILITIA: 90, ARCHER: 38, SQUIRE: 15, TEMPLAR: 7 },
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
  return warehouse?.level || 1;
}

export function getUnits(tier: string): UnitMap {
  return BARBARIAN_TIER_TEMPLATES[tier]?.units ?? BARBARIAN_TIER_TEMPLATES.T1.units;
}
