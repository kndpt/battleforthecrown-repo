export interface BuildingCompletedPayload {
  buildingId: string;
  villageId: string;
  buildingType: string;
  level: number;
}

export interface UnitTrainingStartedPayload {
  trainingId: string;
  villageId: string;
  unitType: string;
  totalQty: number;
  completedQty: number;
  timePerUnitMs: number;
  nextUnitEta: string;
  createdAt: string;
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

export interface BattleLootResources {
  wood: number;
  stone: number;
  iron: number;
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
  loot: { resources: BattleLootResources };
  lossesAttacker: Record<string, number>;
  casualtyRate: number;
  survivingUnits: Record<string, number>;
  returnAt: string;
}

export interface BattleReturnedPayload {
  expeditionId: string;
  reportId: string;
  villageId: string;
  survivingUnits: Record<string, number>;
  loot: { resources: BattleLootResources };
}

export interface VillageAttackedPayload {
  defenderVillageId: string;
  attackerVillageId: string;
  attackerVillageName: string;
  attackerX: number;
  attackerY: number;
  defenderVillageName: string;
  isDefenseSuccessful: boolean;
  losses: Record<string, number>;
  casualtyRate: number;
  resourcesLost: BattleLootResources;
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

export interface VillageStrategyChangedPayload {
  villageId: string;
  userId: string;
  oldStrategy: string;
  newStrategy: string;
  crownsCost: number;
  worldId: string;
}

export type OutboxEventPayload =
  | { kind: 'building.completed'; payload: BuildingCompletedPayload }
  | { kind: 'unit.training.started'; payload: UnitTrainingStartedPayload }
  | { kind: 'unit.training.completed'; payload: UnitTrainingCompletedPayload }
  | { kind: 'battle.sent'; payload: BattleSentPayload }
  | { kind: 'battle.resolved'; payload: BattleResolvedPayload }
  | { kind: 'battle.returned'; payload: BattleReturnedPayload }
  | { kind: 'village.attacked'; payload: VillageAttackedPayload }
  | { kind: 'village.conquered'; payload: VillageConqueredPayload }
  | { kind: 'resources.changed'; payload: ResourcesChangedPayload }
  | { kind: 'crowns.changed'; payload: CrownsChangedPayload }
  | {
      kind: 'village.strategy.changed';
      payload: VillageStrategyChangedPayload;
    };

export type EventKind = OutboxEventPayload['kind'];

export type PayloadForKind<K extends EventKind> = Extract<
  OutboxEventPayload,
  { kind: K }
>['payload'];

export type AnyEventPayload =
  | BuildingCompletedPayload
  | UnitTrainingStartedPayload
  | UnitTrainingCompletedPayload
  | BattleSentPayload
  | BattleResolvedPayload
  | BattleReturnedPayload
  | VillageAttackedPayload
  | VillageConqueredPayload
  | ResourcesChangedPayload
  | CrownsChangedPayload
  | VillageStrategyChangedPayload;

export interface ServerEvents {
  'resources.changed': ResourcesChangedPayload;
  'crowns.changed': CrownsChangedPayload;
  'building.completed': BuildingCompletedPayload;
  'unit.training.started': UnitTrainingStartedPayload;
  'unit.training.completed': UnitTrainingCompletedPayload;
  'battle.sent': BattleSentPayload;
  'battle.resolved': BattleResolvedPayload;
  'battle.returned': BattleReturnedPayload;
  'village.attacked': VillageAttackedPayload;
  'village.conquered': VillageConqueredPayload;
  'village.strategy.changed': VillageStrategyChangedPayload;
}

export type ServerEventName = keyof ServerEvents;
