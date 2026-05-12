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
  reportId: string | null;
  villageId: string;
  survivingUnits: UnitMap;
  loot: { resources: LootResources };
}

export interface ScoutSentPayload {
  expeditionId: string;
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: string;
  arrivalAt: string;
}

export interface ScoutReportedPayload {
  expeditionId: string;
  reportId: string;
  villageId: string;
  targetKind: string;
  targetName: string | null;
  targetX: number;
  targetY: number;
  returnAt: string;
}

export interface ScoutReturnedPayload {
  expeditionId: string;
  reportId: string | null;
  villageId: string;
  survivingUnits: UnitMap;
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

export interface VillageCaptureWindowOpenedPayload {
  pendingConquestId: string;
  targetVillageId: string;
  attackerVillageId: string;
  captureUntil: string;
}

export interface VillageCaptureWindowCompletedPayload {
  pendingConquestId: string;
  targetVillageId: string;
  newOwnerUserId: string;
}

export interface VillageCaptureWindowInterruptedPayload {
  pendingConquestId: string;
  targetVillageId: string;
  reason: string;
}

export interface NobleKilledPayload {
  attackerVillageId: string;
  attackerUserId: string;
  combatId: string;
}

export interface ReinforcementSentPayload {
  expeditionId: string;
  villageId: string;
  targetVillageId: string;
  arrivalAt: string;
}

export interface ReinforcementRecalledPayload {
  expeditionId: string;
  villageId: string;
  originVillageId: string;
  arrivalAt: string;
}

export interface ReinforcementReturnedPayload {
  expeditionId: string;
  villageId: string;
  originVillageId: string;
  units: UnitMap;
}

export interface ExpeditionRecalledPayload {
  expeditionId: string;
  villageId: string;
  returnAt: string;
}

export interface ExpeditionReturnedPayload {
  expeditionId: string;
  reportId: string | null;
  villageId: string;
  survivingUnits: UnitMap;
  loot: { resources: LootResources };
}

export interface GarrisonAddedPayload {
  villageId: string;
  originVillageId: string;
  units: UnitMap;
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
  | { kind: 'scout.sent'; payload: ScoutSentPayload }
  | { kind: 'scout.reported'; payload: ScoutReportedPayload }
  | { kind: 'scout.returned'; payload: ScoutReturnedPayload }
  | { kind: 'village.attacked'; payload: VillageAttackedPayload }
  | { kind: 'village.conquered'; payload: VillageConqueredPayload }
  | {
      kind: 'village.capture-window-opened';
      payload: VillageCaptureWindowOpenedPayload;
    }
  | {
      kind: 'village.capture-window-completed';
      payload: VillageCaptureWindowCompletedPayload;
    }
  | {
      kind: 'village.capture-window-interrupted';
      payload: VillageCaptureWindowInterruptedPayload;
    }
  | { kind: 'noble.killed'; payload: NobleKilledPayload }
  | { kind: 'reinforcement.sent'; payload: ReinforcementSentPayload }
  | { kind: 'reinforcement.recalled'; payload: ReinforcementRecalledPayload }
  | { kind: 'reinforcement.returned'; payload: ReinforcementReturnedPayload }
  | { kind: 'expedition.recalled'; payload: ExpeditionRecalledPayload }
  | { kind: 'expedition.returned'; payload: ExpeditionReturnedPayload }
  | { kind: 'garrison.added'; payload: GarrisonAddedPayload }
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
  | ScoutSentPayload
  | ScoutReportedPayload
  | ScoutReturnedPayload
  | VillageAttackedPayload
  | VillageConqueredPayload
  | VillageCaptureWindowOpenedPayload
  | VillageCaptureWindowCompletedPayload
  | VillageCaptureWindowInterruptedPayload
  | NobleKilledPayload
  | ReinforcementSentPayload
  | ReinforcementRecalledPayload
  | ReinforcementReturnedPayload
  | ExpeditionRecalledPayload
  | ExpeditionReturnedPayload
  | GarrisonAddedPayload
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
  'scout.sent': ScoutSentPayload;
  'scout.reported': ScoutReportedPayload;
  'scout.returned': ScoutReturnedPayload;
  'village.attacked': VillageAttackedPayload;
  'village.conquered': VillageConqueredPayload;
  'village.capture-window-opened': VillageCaptureWindowOpenedPayload;
  'village.capture-window-completed': VillageCaptureWindowCompletedPayload;
  'village.capture-window-interrupted': VillageCaptureWindowInterruptedPayload;
  'noble.killed': NobleKilledPayload;
  'reinforcement.sent': ReinforcementSentPayload;
  'reinforcement.recalled': ReinforcementRecalledPayload;
  'reinforcement.returned': ReinforcementReturnedPayload;
  'expedition.recalled': ExpeditionRecalledPayload;
  'expedition.returned': ExpeditionReturnedPayload;
  'garrison.added': GarrisonAddedPayload;
}

export type ServerEventName = keyof ServerEvents;
