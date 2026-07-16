import type { LootDistanceConfig } from '../logic/loot-distance';
import { DEFAULT_LOOT_DISTANCE_CONFIG } from '../world/schemas';

export interface CombatRules {
  attackBonus: number;
  defenseBonus: number;
  lootFactor: number;
  // Friction distance sur le pillage (raid only). Doit rester alignée avec
  // `CombatRulesSchema` (world/schemas.ts). Voir `logic/loot-distance.ts`.
  lootDistance: LootDistanceConfig;
}

export const DEFAULT_COMBAT_RULES: CombatRules = {
  attackBonus: 1.0,
  defenseBonus: 1.0,
  lootFactor: 0.5,
  lootDistance: DEFAULT_LOOT_DISTANCE_CONFIG,
};

export * from './dtos';
export * from './utils';
export * from './loot';
export * from './schemas';
export * from './capture-duration';
export * from './scout-precision';
