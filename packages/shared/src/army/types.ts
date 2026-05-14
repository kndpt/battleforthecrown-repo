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
