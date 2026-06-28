import { BUILDING_TYPES, type BuildingType } from '../village/buildings';
import type { UnitMap } from '../army/unit-map';
import { typedEntries } from '../utils/typed-record';

export interface BuildingTemplate {
  type: BuildingType;
  level: number;
}

export interface TierTemplate {
  buildings: BuildingTemplate[];
  populationMax: number;
  units: UnitMap;
}

export interface BarbarianRegenRates {
  troopRatePerHour: number;
  resourceRatePerHour: number;
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
      { type: BUILDING_TYPES.QUARTER, level: 2 },
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
      { type: BUILDING_TYPES.QUARTER, level: 5 },
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
      { type: BUILDING_TYPES.QUARTER, level: 8 },
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
      { type: BUILDING_TYPES.QUARTER, level: 10 },
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
      { type: BUILDING_TYPES.QUARTER, level: 12 },
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

export function getBarbarianRegenRates(tier: string): BarbarianRegenRates {
  const normalizedTier = BARBARIAN_TIER_TEMPLATES[tier] ? tier : 'T1';
  const tierIndex = Number(normalizedTier.slice(1)) - 1;

  return {
    troopRatePerHour: 0.02 + tierIndex * 0.005,
    resourceRatePerHour: 0.04 + tierIndex * 0.01,
  };
}

export function rollInitialBarbarianUnits(
  tier: string,
  random: () => number = Math.random,
): UnitMap {
  const blueprint = getUnits(tier);
  const maxTotal = sumUnits(blueprint);
  const initialTotal = Math.floor(maxTotal * (0.6 + random() * 0.4));

  return allocateUnits(initialTotal, blueprint, blueprint);
}

export function calculateBarbarianUnitRegen(params: {
  tier: string;
  currentUnits: UnitMap;
  elapsedHours: number;
}): UnitMap {
  const blueprint = getUnits(params.tier);
  const maxTotal = sumUnits(blueprint);
  const missingCapacity = subtractUnits(blueprint, params.currentUnits);
  const missingTotal = sumUnits(missingCapacity);
  const { troopRatePerHour } = getBarbarianRegenRates(params.tier);
  const regenTotal = Math.min(
    missingTotal,
    Math.floor(maxTotal * troopRatePerHour * params.elapsedHours),
  );

  return allocateUnits(regenTotal, blueprint, missingCapacity);
}

function allocateUnits(total: number, weights: UnitMap, caps: UnitMap): UnitMap {
  if (total <= 0) return {};

  const cappedWeights: UnitMap = {};
  for (const [unitType, weight] of typedEntries(weights)) {
    const cap = caps[unitType] ?? 0;
    if (weight && cap > 0) cappedWeights[unitType] = weight;
  }

  const weightTotal = sumUnits(cappedWeights);
  if (weightTotal <= 0) return {};

  const allocated: UnitMap = {};
  const remainders: Array<{ unitType: keyof UnitMap; remainder: number }> = [];

  for (const [unitType, weight] of typedEntries(cappedWeights)) {
    const cap = caps[unitType] ?? 0;
    const exact = (total * weight) / weightTotal;
    const quantity = Math.min(Math.floor(exact), cap);
    if (quantity > 0) allocated[unitType] = quantity;
    remainders.push({ unitType, remainder: exact - quantity });
  }

  let remaining = Math.min(total, sumUnits(caps)) - sumUnits(allocated);
  remainders.sort((a, b) => b.remainder - a.remainder);

  while (remaining > 0) {
    const next = remainders.find(
      ({ unitType }) => (allocated[unitType] ?? 0) < (caps[unitType] ?? 0),
    );
    if (!next) break;
    allocated[next.unitType] = (allocated[next.unitType] ?? 0) + 1;
    remaining--;
  }

  return allocated;
}

function subtractUnits(maxUnits: UnitMap, currentUnits: UnitMap): UnitMap {
  const result: UnitMap = {};
  for (const [unitType, maxQuantity] of typedEntries(maxUnits)) {
    const current = currentUnits[unitType] ?? 0;
    result[unitType] = Math.max(0, maxQuantity - current);
  }
  return result;
}

function sumUnits(units: UnitMap): number {
  return Object.values(units).reduce((sum, quantity) => sum + quantity, 0);
}
