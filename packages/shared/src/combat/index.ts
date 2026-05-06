export interface CombatRules {
  travelSpeed: number;
  attackBonus: number;
  defenseBonus: number;
  lootFactor: number;
}

export const DEFAULT_COMBAT_RULES: CombatRules = {
  travelSpeed: 1,
  attackBonus: 1.0,
  defenseBonus: 1.0,
  lootFactor: 0.5,
};

// Legacy alias
export type CombatConfig = CombatRules;

export * from './dtos';
export * from './utils';
export * from './loot';
