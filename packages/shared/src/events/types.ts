import type { LootResources } from "../combat/loot";
import type { UnitMap } from "../army/unit-map";

export interface BuildingCompletedPayload {
  buildingId: string;
  villageId: string;
  buildingType: string;
  level: number;
  /** Propriétaire du village à la complétion (capture immuable, null si barbare). */
  ownerId: string | null;
  /** Monde du village à la complétion (capture immuable). */
  worldId: string;
}

export interface UnitTrainingCompletedPayload {
  trainingId: string;
  villageId: string;
  unitType: string;
  completedQty: number;
  totalQty: number;
}

export interface UnitTrainedPayload {
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
  targetTier?: string | null;
  /**
   * Origin of the target village (STANDARD vs ONBOARDING_NARRATIVE). Only
   * meaningful when `targetKind === 'BARBARIAN_VILLAGE'`. Optional for
   * backward compat with reports replayed from before the onboarding
   * narrative target was introduced.
   */
  targetOriginKind?: "STANDARD" | "ONBOARDING_NARRATIVE";
  targetX: number;
  targetY: number;
  isVictory: boolean;
  loot: { resources: LootResources };
  lossesAttacker: UnitMap;
  casualtyRate: number;
  survivingUnits: UnitMap;
  returnAt: string | null;
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
  defenderUserId?: string;
  observerUserId?: string;
  attackerVillageId: string;
  attackerVillageName: string;
  attackerX: number;
  attackerY: number;
  defenderVillageName: string;
  isDefenseSuccessful: boolean;
  losses: UnitMap;
  reinforcementOriginVillageIds?: string[];
  casualtyRate: number;
  resourcesLost: LootResources;
  timestamp: string;
}

export interface VillageConqueredPayload {
  villageId: string;
  villageName: string;
  newOwnerId: string;
  newOwnerName: string;
  previousOwnerId: string | null;
  previousTier: string | null;
  lostVillageVisualTier: number;
  x: number;
  y: number;
  buildingsKept: number;
}

export interface VillageRemovedPayload {
  worldId: string;
  villageId: string;
  x: number;
  y: number;
}

export interface VillageCaptureWindowOpenedPayload {
  pendingConquestId: string;
  targetVillageId: string;
  attackerVillageId: string;
  /** Present in all events written after the 2026-06-06 deploy; absent in older queued rows. */
  attackerUserId?: string;
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
  /** Present in all events written after the 2026-06-06 deploy; absent in older queued rows. */
  attackerUserId?: string;
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
  hostVillageId?: string;
  units: UnitMap;
}

export interface CaravanSentPayload {
  expeditionId: string;
  villageId: string;
  targetVillageId: string;
  targetX: number;
  targetY: number;
  resources: LootResources;
  porters: number;
  arrivalAt: string;
}

export interface CaravanArrivedPayload {
  expeditionId: string;
  villageId: string;
  targetVillageId: string;
  credited: LootResources;
  lost: LootResources;
  returnAt: string;
}

export interface CaravanRecalledPayload {
  expeditionId: string;
  villageId: string;
  targetVillageId: string;
  resources: LootResources;
  porters: number;
  returnAt: string;
}

export interface CaravanReturnedPayload {
  expeditionId: string;
  villageId: string;
  targetVillageId: string;
  resources: LootResources;
  porters: number;
  recalled: boolean;
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

export interface PvpShieldBrokenPayload {
  userId: string;
  worldId: string;
  brokenAt: string;
  endsAt: string;
}

export interface WorldStatusChangedPayload {
  worldId: string;
  from: "PLANNED" | "OPEN" | "LOCKED" | "ENDED";
  to: "PLANNED" | "OPEN" | "LOCKED" | "ENDED";
  at: string;
}

export interface WorldPlannedCreatedPayload {
  worldId: string;
  plannedOpenAt: string;
  source: "auto";
}

export interface RankingsChangedPayload {
  worldId: string;
  signal: "ASSAULT_GLORY" | "RAMPART_GLORY";
  scorerUserId: string;
  opponentUserId: string;
  points: number;
  combatReportId: string;
  occurredAt: string;
}

export interface IntelUpdatedPayload {
  userId: string;
  worldId: string;
  villageId: string;
}

export type OutboxEventPayload =
  | { kind: "building.completed"; payload: BuildingCompletedPayload }
  | { kind: "unit.training.completed"; payload: UnitTrainingCompletedPayload }
  | { kind: "unit.trained"; payload: UnitTrainedPayload }
  | { kind: "battle.sent"; payload: BattleSentPayload }
  | { kind: "battle.resolved"; payload: BattleResolvedPayload }
  | { kind: "battle.returned"; payload: BattleReturnedPayload }
  | { kind: "scout.sent"; payload: ScoutSentPayload }
  | { kind: "scout.reported"; payload: ScoutReportedPayload }
  | { kind: "scout.returned"; payload: ScoutReturnedPayload }
  | { kind: "village.attacked"; payload: VillageAttackedPayload }
  | { kind: "village.conquered"; payload: VillageConqueredPayload }
  | { kind: "village.removed"; payload: VillageRemovedPayload }
  | {
      kind: "village.capture-window-opened";
      payload: VillageCaptureWindowOpenedPayload;
    }
  | {
      kind: "village.capture-window-completed";
      payload: VillageCaptureWindowCompletedPayload;
    }
  | {
      kind: "village.capture-window-interrupted";
      payload: VillageCaptureWindowInterruptedPayload;
    }
  | { kind: "noble.killed"; payload: NobleKilledPayload }
  | { kind: "reinforcement.sent"; payload: ReinforcementSentPayload }
  | { kind: "reinforcement.recalled"; payload: ReinforcementRecalledPayload }
  | { kind: "reinforcement.returned"; payload: ReinforcementReturnedPayload }
  | { kind: "caravan.sent"; payload: CaravanSentPayload }
  | { kind: "caravan.arrived"; payload: CaravanArrivedPayload }
  | { kind: "caravan.recalled"; payload: CaravanRecalledPayload }
  | { kind: "caravan.returned"; payload: CaravanReturnedPayload }
  | { kind: "expedition.recalled"; payload: ExpeditionRecalledPayload }
  | { kind: "expedition.returned"; payload: ExpeditionReturnedPayload }
  | { kind: "garrison.added"; payload: GarrisonAddedPayload }
  | { kind: "resources.changed"; payload: ResourcesChangedPayload }
  | { kind: "crowns.changed"; payload: CrownsChangedPayload }
  | { kind: "rankings.changed"; payload: RankingsChangedPayload }
  | { kind: "world.status.changed"; payload: WorldStatusChangedPayload }
  | { kind: "world.planned.created"; payload: WorldPlannedCreatedPayload }
  | { kind: "pvp.shield.broken"; payload: PvpShieldBrokenPayload }
  | { kind: "intel.updated"; payload: IntelUpdatedPayload };

export type EventKind = OutboxEventPayload["kind"];

export type PayloadForKind<K extends EventKind> = Extract<
  OutboxEventPayload,
  { kind: K }
>["payload"];

export type AnyEventPayload =
  | BuildingCompletedPayload
  | UnitTrainingCompletedPayload
  | UnitTrainedPayload
  | BattleSentPayload
  | BattleResolvedPayload
  | BattleReturnedPayload
  | ScoutSentPayload
  | ScoutReportedPayload
  | ScoutReturnedPayload
  | VillageAttackedPayload
  | VillageConqueredPayload
  | VillageRemovedPayload
  | VillageCaptureWindowOpenedPayload
  | VillageCaptureWindowCompletedPayload
  | VillageCaptureWindowInterruptedPayload
  | NobleKilledPayload
  | ReinforcementSentPayload
  | ReinforcementRecalledPayload
  | ReinforcementReturnedPayload
  | CaravanSentPayload
  | CaravanArrivedPayload
  | CaravanRecalledPayload
  | CaravanReturnedPayload
  | ExpeditionRecalledPayload
  | ExpeditionReturnedPayload
  | GarrisonAddedPayload
  | ResourcesChangedPayload
  | CrownsChangedPayload
  | RankingsChangedPayload
  | WorldStatusChangedPayload
  | WorldPlannedCreatedPayload
  | PvpShieldBrokenPayload
  | IntelUpdatedPayload;

export interface ServerEvents {
  "resources.changed": ResourcesChangedPayload;
  "crowns.changed": CrownsChangedPayload;
  "rankings.changed": RankingsChangedPayload;
  "building.completed": BuildingCompletedPayload;
  "unit.training.completed": UnitTrainingCompletedPayload;
  "unit.trained": UnitTrainedPayload;
  "battle.sent": BattleSentPayload;
  "battle.resolved": BattleResolvedPayload;
  "battle.returned": BattleReturnedPayload;
  "scout.sent": ScoutSentPayload;
  "scout.reported": ScoutReportedPayload;
  "scout.returned": ScoutReturnedPayload;
  "village.attacked": VillageAttackedPayload;
  "village.conquered": VillageConqueredPayload;
  "village.removed": VillageRemovedPayload;
  "village.capture-window-opened": VillageCaptureWindowOpenedPayload;
  "village.capture-window-completed": VillageCaptureWindowCompletedPayload;
  "village.capture-window-interrupted": VillageCaptureWindowInterruptedPayload;
  "noble.killed": NobleKilledPayload;
  "reinforcement.sent": ReinforcementSentPayload;
  "reinforcement.recalled": ReinforcementRecalledPayload;
  "reinforcement.returned": ReinforcementReturnedPayload;
  "caravan.sent": CaravanSentPayload;
  "caravan.arrived": CaravanArrivedPayload;
  "caravan.recalled": CaravanRecalledPayload;
  "caravan.returned": CaravanReturnedPayload;
  "expedition.recalled": ExpeditionRecalledPayload;
  "expedition.returned": ExpeditionReturnedPayload;
  "garrison.added": GarrisonAddedPayload;
  "world.status.changed": WorldStatusChangedPayload;
  "world.planned.created": WorldPlannedCreatedPayload;
  "pvp.shield.broken": PvpShieldBrokenPayload;
  "intel.updated": IntelUpdatedPayload;
}

export type ServerEventName = keyof ServerEvents;
