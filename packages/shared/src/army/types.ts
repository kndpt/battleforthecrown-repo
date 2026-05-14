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

export type UnitPassive =
  | { readonly kind: 'attackVsUnits'; readonly targets: readonly UnitType[]; readonly bonus: number }
  | { readonly kind: 'attackVsWall'; readonly bonus: number }
  | { readonly kind: 'attackOnRaid'; readonly bonus: number }
  | { readonly kind: 'defenseOnGarrison'; readonly bonus: number }
  | { readonly kind: 'aoeDamage' }
  | { readonly kind: 'scout' };

export interface UnitStats {
  attack: number;
  /**
   * Défense scindée par archétype d'attaquant. Au MVP, les 3 valeurs sont
   * identiques par design ; le split reste pour permettre la diff par run 004
   * (résolution combat) sans casser le typage côté callers.
   */
  defenseInfantry: number;
  defenseCavalry: number;
  defenseArcher: number;
  speed: number;
  carryCapacity: number;
  passive: UnitPassive | null;
}

export interface UnitsConfig {
  costs: Record<UnitType, UnitCost>;
  stats: Record<UnitType, UnitStats>;
}
