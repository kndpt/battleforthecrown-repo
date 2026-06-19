import { type UnitType as SharedUnitType } from '@battleforthecrown/shared/army';
import {
  type ExpeditionKind,
  type ExpeditionStatus,
  type LootResources,
  type TargetKind,
} from '@battleforthecrown/shared/combat';

export type UnitType = SharedUnitType;

export interface Expedition {
  id: string;
  worldId: string;
  attackerVillageId: string;
  kind?: ExpeditionKind;
  targetKind: TargetKind;
  targetRefId: string;
  targetX: number;
  targetY: number;
  units: Record<string, number>;
  status: ExpeditionStatus;
  departAt: Date | string;
  arrivalAt: Date | string;
  returnAt?: Date | string;
  reportId?: string;
  createdAt: Date | string;
}

export interface GarrisonLine {
  villageId: string;
  hostVillageName: string | null;
  hostPlayerName?: string | null;
  originVillageId: string;
  originVillageName: string | null;
  originPlayerName?: string | null;
  direction: 'INCOMING' | 'OUTGOING';
  unitType: UnitType;
  quantity: number;
}

export interface ReinforcePayload {
  villageId: string;
  targetVillageId: string;
  units: Partial<Record<UnitType, number>>;
}

export interface CaravanPayload {
  villageId: string;
  targetVillageId: string;
  resources: LootResources;
}

export interface RecallReinforcementPayload {
  villageId: string;
  originVillageId: string;
  units: Partial<Record<UnitType, number>>;
}
