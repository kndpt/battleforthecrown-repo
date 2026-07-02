export const UNIT_TYPES = {
  MILITIA: 'MILITIA',
  SQUIRE: 'SQUIRE',
  WARRIOR: 'WARRIOR',
  ARCHER: 'ARCHER',
  TEMPLAR: 'TEMPLAR',
  CAVALRY: 'CAVALRY',
  SPY: 'SPY',
  RAM: 'RAM',
  CATAPULT: 'CATAPULT',
  NOBLE: 'NOBLE',
} as const;

export type UnitType = (typeof UNIT_TYPES)[keyof typeof UNIT_TYPES];

const UNIT_TYPE_VALUES = new Set<string>(Object.values(UNIT_TYPES));

export function isUnitType(value: string): value is UnitType {
  return UNIT_TYPE_VALUES.has(value);
}

export const BARRACKS_UNIT_TYPES = [
  UNIT_TYPES.MILITIA,
  UNIT_TYPES.SQUIRE,
  UNIT_TYPES.WARRIOR,
  UNIT_TYPES.ARCHER,
  UNIT_TYPES.TEMPLAR,
  UNIT_TYPES.CAVALRY,
  UNIT_TYPES.SPY,
  UNIT_TYPES.RAM,
  UNIT_TYPES.CATAPULT,
] as const satisfies readonly [UnitType, ...UnitType[]];

export type BarracksUnitType = (typeof BARRACKS_UNIT_TYPES)[number];

export interface UnitCost {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  time: number; // seconds
  requiredBarracksLevel: number;
  requiredThroneHallLevel?: number;
  crowns?: number;
}

export interface UnitStats {
  attack: number;
  /**
   * Défense scindée par archétype d'attaquant. La résolution combat choisit
   * la valeur consommée selon la composition offensive.
   */
  defenseInfantry: number;
  defenseCavalry: number;
  defenseArcher: number;
  speed: number;
  carryCapacity: number;
}

export interface UnitsConfig {
  costs: Record<UnitType, UnitCost>;
  stats: Record<UnitType, UnitStats>;
}
