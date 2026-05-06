export type TargetKind = 'PLAYER_VILLAGE' | 'BARBARIAN_VILLAGE';

export const TARGET_KINDS = {
  PLAYER_VILLAGE: 'PLAYER_VILLAGE',
  BARBARIAN_VILLAGE: 'BARBARIAN_VILLAGE',
} as const;

export type ExpeditionStatus = 'EN_ROUTE' | 'RESOLVED' | 'RETURNING';

export const EXPEDITION_STATUSES = {
  EN_ROUTE: 'EN_ROUTE',
  RESOLVED: 'RESOLVED',
  RETURNING: 'RETURNING',
} as const;

export interface AttackCommand {
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: TargetKind;
  targetRefId: string;
  units: Record<string, number>;
}

export interface CombatLootResources {
  wood: number;
  stone: number;
  iron: number;
}

export interface CombatLoot {
  resources?: CombatLootResources;
  remainingResources?: CombatLootResources;
}

export interface CombatReportResponse {
  id: string;
  attackerVillageId: string;
  defenderVillageId?: string;
  targetKind: string;
  targetX: number;
  targetY: number;
  loot: CombatLoot;
  lossesAttacker: Record<string, number>;
  lossesDefender?: Record<string, number>;
  timestamp: string;
}

export interface ExpeditionResponse {
  id: string;
  attackerVillageId: string;
  targetKind: string;
  targetX: number;
  targetY: number;
  status: string;
  departAt: string;
  arrivalAt: string;
  returnAt?: string;
  units: Record<string, number>;
}
