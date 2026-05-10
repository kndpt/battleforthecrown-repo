export interface CombatRules {
  attackBonus: number;
  defenseBonus: number;
  lootFactor: number;
}

export const DEFAULT_COMBAT_RULES: CombatRules = {
  attackBonus: 1.0,
  defenseBonus: 1.0,
  lootFactor: 0.5,
};

// Legacy alias
export type CombatConfig = CombatRules;

export type {
  TargetKind,
  ExpeditionStatus,
  ExpeditionKind,
  AttackCommand,
  ReinforceCommand,
  RecallCommand,
  ExpeditionResponse,
  CombatLoot,
  CombatReportResponse,
} from './dtos';

export * from './dtos';
export * from './utils';
export * from './loot';
export * from './schemas';
