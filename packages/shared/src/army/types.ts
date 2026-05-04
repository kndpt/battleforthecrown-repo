export const UNIT_TYPES = {
  MILITIA: 'MILITIA',
  SQUIRE: 'SQUIRE',
  ARCHER: 'ARCHER',
  CAVALRY: 'CAVALRY',
  TEMPLAR: 'TEMPLAR',
  CATAPULT: 'CATAPULT',
  SPY: 'SPY',
  NOBLE: 'NOBLE',
} as const;

export type UnitType = (typeof UNIT_TYPES)[keyof typeof UNIT_TYPES];

export interface UnitCost {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  time: number; // seconds
  requiredBarracksLevel: number;
}

export interface UnitStats {
  attack: number;
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
