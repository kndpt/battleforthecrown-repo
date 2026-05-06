import type { LootResources } from '../combat/loot';
import type { UnitMap } from '../army/unit-map';

export interface BuildingCompletedPayload {
  buildingId: string;
  villageId: string;
  buildingType: string;
  level: number;
}

export interface UnitTrainingCompletedPayload {
  trainingId: string;
  villageId: string;
  unitType: string;
  completedQty: number;
  totalQty: number;
}

export interface BattleSentPayload {
  expeditionId: string;
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: string;
  arrivalAt: string;
}

export interface BattleResolvedPayload {
  expeditionId: string;
  reportId: string;
  villageId: string;
  villageName: string;
  targetKind: string;
  targetName: string;
  targetX: number;
  targetY: number;
  isVictory: boolean;
  loot: { resources: LootResources };
  lossesAttacker: UnitMap;
  casualtyRate: number;
  survivingUnits: UnitMap;
  returnAt: string;
}

export interface BattleReturnedPayload {
  expeditionId: string;
  reportId: string;
  villageId: string;
  survivingUnits: UnitMap;
  loot: { resources: LootResources };
}

export interface VillageAttackedPayload {
  defenderVillageId: string;
  attackerVillageId: string;
  attackerVillageName: string;
  attackerX: number;
  attackerY: number;
  defenderVillageName: string;
  isDefenseSuccessful: boolean;
  losses: UnitMap;
  casualtyRate: number;
  resourcesLost: LootResources;
  timestamp: string;
}

export interface VillageConqueredPayload {
  villageId: string;
  newOwnerId: string;
  previousTier: string | null;
  x: number;
  y: number;
  buildingsKept: number;
}

export interface ResourcesChangedPayload {
  villageId: string;
  wood: number;
  stone: number;
  iron: number;
  maxPerType: number;
  lastUpdateTs: string;
  productionRates: {
    wood: number;
    stone: number;
    iron: number;
  };
}

export interface CrownsChangedPayload {
  userId: string;
  worldId: string;
  balance: number;
  productionRate: number;
  lastUpdateTs: string;
}

export type OutboxEventPayload =
  | { kind: 'building.completed'; payload: BuildingCompletedPayload }
  | { kind: 'unit.training.completed'; payload: UnitTrainingCompletedPayload }
  | { kind: 'battle.sent'; payload: BattleSentPayload }
  | { kind: 'battle.resolved'; payload: BattleResolvedPayload }
  | { kind: 'battle.returned'; payload: BattleReturnedPayload }
  | { kind: 'village.attacked'; payload: VillageAttackedPayload }
  | { kind: 'village.conquered'; payload: VillageConqueredPayload }
  | { kind: 'resources.changed'; payload: ResourcesChangedPayload }
  | { kind: 'crowns.changed'; payload: CrownsChangedPayload };

export type EventKind = OutboxEventPayload['kind'];

export type PayloadForKind<K extends EventKind> = Extract<
  OutboxEventPayload,
  { kind: K }
>['payload'];

export type AnyEventPayload =
  | BuildingCompletedPayload
  | UnitTrainingCompletedPayload
  | BattleSentPayload
  | BattleResolvedPayload
  | BattleReturnedPayload
  | VillageAttackedPayload
  | VillageConqueredPayload
  | ResourcesChangedPayload
  | CrownsChangedPayload;

export interface ServerEvents {
  'resources.changed': ResourcesChangedPayload;
  'crowns.changed': CrownsChangedPayload;
  'building.completed': BuildingCompletedPayload;
  'unit.training.completed': UnitTrainingCompletedPayload;
  'battle.sent': BattleSentPayload;
  'battle.resolved': BattleResolvedPayload;
  'battle.returned': BattleReturnedPayload;
  'village.attacked': VillageAttackedPayload;
  'village.conquered': VillageConqueredPayload;
}

export type ServerEventName = keyof ServerEvents;
