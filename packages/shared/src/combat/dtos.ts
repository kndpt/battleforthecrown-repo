import type { LootResources } from './loot';
import type { UnitMap } from '../army/unit-map';

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

export type ExpeditionKind = 'ATTACK' | 'REINFORCE';

export const EXPEDITION_KINDS = {
  ATTACK: 'ATTACK',
  REINFORCE: 'REINFORCE',
} as const;

export interface AttackCommand {
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: TargetKind;
  targetRefId: string;
  units: UnitMap;
}

export interface ReinforceCommand {
  villageId: string;
  targetVillageId: string;
  units: UnitMap;
}

export interface RecallCommand {
  villageId: string;
  originVillageId: string;
  units: UnitMap;
}

export interface CombatLoot {
  resources?: LootResources;
  remainingResources?: LootResources;
}

export interface CombatReportResponse {
  id: string;
  attackerVillageId: string;
  defenderVillageId?: string;
  targetKind: string;
  targetX: number;
  targetY: number;
  loot: CombatLoot;
  totalUnitsAttacker?: UnitMap;
  totalUnitsDefender?: UnitMap;
  lossesAttacker: UnitMap;
  lossesDefender?: UnitMap;
  isRead: boolean;
  isAttacker: boolean;
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
  units: UnitMap;
}
