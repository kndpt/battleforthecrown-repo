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

export type ExpeditionKind = 'ATTACK' | 'REINFORCE' | 'SCOUT' | 'CARAVAN';

export const EXPEDITION_KINDS = {
  ATTACK: 'ATTACK',
  REINFORCE: 'REINFORCE',
  SCOUT: 'SCOUT',
  CARAVAN: 'CARAVAN',
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

export interface ScoutCommand {
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: TargetKind;
  targetRefId: string;
  units: UnitMap;
}

export interface CaravanCommand {
  villageId: string;
  targetVillageId: string;
  resources: LootResources;
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
  attackerVillageName?: string | null;
  attackerX?: number | null;
  attackerY?: number | null;
  defenderVillageId?: string | null;
  defenderVillageName?: string | null;
  defenderX?: number | null;
  defenderY?: number | null;
  observerUserId?: string | null;
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
  recipientRole?: 'attacker' | 'defender' | 'observer' | null;
  details?: {
    targetTier?: string | null;
    occupationDefense?: unknown;
    captureFinalized?: {
      pendingConquestId?: string;
      villageId?: string;
      villageName?: string;
      openedAt?: string;
      completedAt?: string;
      outcome?: string;
    };
  };
  timestamp: string;
}

export interface ScoutReportResponse {
  id: string;
  scoutVillageId: string;
  targetVillageId?: string;
  targetKind: string;
  targetX: number;
  targetY: number;
  targetName?: string | null;
  targetTier?: string | null;
  units: UnitMap;
  resources: LootResources;
  strategy?: string | null;
  details?: { scoutLosses?: UnitMap; scoutUnits?: UnitMap; wallLevel?: number };
  isRead: boolean;
  timestamp: string;
}

export type ReinforcementReportType = 'STATIONED' | 'RETURNED';

export const REINFORCEMENT_REPORT_TYPES = {
  STATIONED: 'STATIONED',
  RETURNED: 'RETURNED',
} as const;

/**
 * A reinforcement movement report (arrival or homecoming) as seen by one
 * recipient. `isRead` reflects the connected player's own inbox entry.
 * No attacker/defender, no losses, no loot, no victory outcome.
 */
export interface ReinforcementReportResponse {
  id: string;
  worldId: string;
  type: ReinforcementReportType;
  originVillageId: string;
  originVillageName?: string | null;
  originX: number;
  originY: number;
  hostVillageId: string;
  hostVillageName?: string | null;
  hostX: number;
  hostY: number;
  units: UnitMap;
  actorUserId?: string | null;
  isRead: boolean;
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

export interface OpenConquestDto {
  pendingConquestId: string;
  attackerVillageId: string;
  attackerVillageName: string;
  targetVillageId: string;
  targetName: string;
  targetX: number;
  targetY: number;
  targetKind: TargetKind;
  targetCastleLevel: number | null;
  targetTier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | null;
  captureStartedAt: string;
  captureUntil: string;
  status: 'OPEN';
}

export interface OpenExpeditionDto {
  expeditionId: string;
  kind: ExpeditionKind;
  isConquest: boolean;
  attackerVillageId: string;
  attackerVillageName: string;
  targetVillageId: string | null;
  targetName: string | null;
  targetX: number;
  targetY: number;
  targetKind: string;
  departAt: string;
  arrivalAt: string;
  returnAt: string | null;
  status: ExpeditionStatus;
  recalled: boolean;
  resources?: LootResources;
}
