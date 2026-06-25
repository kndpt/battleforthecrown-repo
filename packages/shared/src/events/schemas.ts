import { z } from "zod";
import { UnitMapSchema } from "../army/unit-map";
import { LootResourcesSchema } from "../combat/schemas";
import type { EventKind, PayloadForKind } from "./types";

const BuildingCompletedPayloadSchema = z.object({
  buildingId: z.string(),
  villageId: z.string(),
  buildingType: z.string(),
  level: z.number(),
  ownerId: z.string().nullable(),
  worldId: z.string(),
});

const UnitTrainingCompletedPayloadSchema = z.object({
  trainingId: z.string(),
  villageId: z.string(),
  unitType: z.string(),
  completedQty: z.number(),
  totalQty: z.number(),
});

const UnitTrainedPayloadSchema = z.object({
  trainingId: z.string(),
  villageId: z.string(),
  unitType: z.string(),
  completedQty: z.number(),
  totalQty: z.number(),
});

const BattleSentPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  targetX: z.number(),
  targetY: z.number(),
  targetKind: z.string(),
  arrivalAt: z.string(),
});

const BattleResolvedPayloadSchema = z.object({
  expeditionId: z.string(),
  reportId: z.string(),
  villageId: z.string(),
  villageName: z.string(),
  targetKind: z.string(),
  targetName: z.string(),
  targetTier: z.string().nullable().optional(),
  targetOriginKind: z.enum(["STANDARD", "ONBOARDING_NARRATIVE"]).optional(),
  targetX: z.number(),
  targetY: z.number(),
  isVictory: z.boolean(),
  loot: z.object({ resources: LootResourcesSchema }),
  lossesAttacker: UnitMapSchema,
  casualtyRate: z.number(),
  survivingUnits: UnitMapSchema,
  returnAt: z.string().nullable(),
});

const BattleReturnedPayloadSchema = z.object({
  expeditionId: z.string(),
  reportId: z.string().nullable(),
  villageId: z.string(),
  survivingUnits: UnitMapSchema,
  loot: z.object({ resources: LootResourcesSchema }),
});

const ScoutSentPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  targetX: z.number(),
  targetY: z.number(),
  targetKind: z.string(),
  arrivalAt: z.string(),
});

const ScoutReportedPayloadSchema = z.object({
  expeditionId: z.string(),
  reportId: z.string(),
  villageId: z.string(),
  targetKind: z.string(),
  targetName: z.string().nullable(),
  targetX: z.number(),
  targetY: z.number(),
  returnAt: z.string(),
});

const ScoutReturnedPayloadSchema = z.object({
  expeditionId: z.string(),
  reportId: z.string().nullable(),
  villageId: z.string(),
  survivingUnits: UnitMapSchema,
});

const VillageAttackedPayloadSchema = z.object({
  defenderVillageId: z.string(),
  defenderUserId: z.string().optional(),
  observerUserId: z.string().optional(),
  attackerVillageId: z.string(),
  attackerVillageName: z.string(),
  attackerX: z.number(),
  attackerY: z.number(),
  defenderVillageName: z.string(),
  isDefenseSuccessful: z.boolean(),
  losses: UnitMapSchema,
  reinforcementOriginVillageIds: z.array(z.string()).optional(),
  casualtyRate: z.number(),
  resourcesLost: LootResourcesSchema,
  timestamp: z.string(),
});

const VillageConqueredPayloadSchema = z.object({
  villageId: z.string(),
  villageName: z.string(),
  newOwnerId: z.string(),
  newOwnerName: z.string(),
  previousOwnerId: z.string().nullable(),
  previousTier: z.string().nullable(),
  lostVillageVisualTier: z.number().int().min(1).max(6),
  x: z.number(),
  y: z.number(),
  buildingsKept: z.number(),
});

const VillageRemovedPayloadSchema = z.object({
  worldId: z.string(),
  villageId: z.string(),
  x: z.number().int(),
  y: z.number().int(),
});

const VillageCaptureWindowOpenedPayloadSchema = z.object({
  pendingConquestId: z.string(),
  targetVillageId: z.string(),
  attackerVillageId: z.string(),
  attackerUserId: z.string().optional(),
  captureUntil: z.string(),
});

const VillageCaptureWindowCompletedPayloadSchema = z.object({
  pendingConquestId: z.string(),
  targetVillageId: z.string(),
  newOwnerUserId: z.string(),
});

const VillageCaptureWindowInterruptedPayloadSchema = z.object({
  pendingConquestId: z.string(),
  targetVillageId: z.string(),
  attackerUserId: z.string().optional(),
  reason: z.string(),
});

const NobleKilledPayloadSchema = z.object({
  attackerVillageId: z.string(),
  attackerUserId: z.string(),
  combatId: z.string(),
});

const PvpShieldBrokenPayloadSchema = z.object({
  userId: z.string(),
  worldId: z.string(),
  brokenAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

const ReinforcementSentPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  targetVillageId: z.string(),
  arrivalAt: z.string(),
});

const ReinforcementRecalledPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  originVillageId: z.string(),
  arrivalAt: z.string(),
});

const ReinforcementReturnedPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  originVillageId: z.string(),
  hostVillageId: z.string().optional(),
  units: UnitMapSchema,
});

const CaravanSentPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  targetVillageId: z.string(),
  targetX: z.number(),
  targetY: z.number(),
  resources: LootResourcesSchema,
  porters: z.number().int().nonnegative(),
  arrivalAt: z.string(),
});

const CaravanArrivedPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  targetVillageId: z.string(),
  credited: LootResourcesSchema,
  lost: LootResourcesSchema,
  returnAt: z.string(),
});

const CaravanRecalledPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  targetVillageId: z.string(),
  resources: LootResourcesSchema,
  porters: z.number().int().nonnegative(),
  returnAt: z.string(),
});

const CaravanReturnedPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  targetVillageId: z.string(),
  resources: LootResourcesSchema,
  porters: z.number().int().nonnegative(),
  recalled: z.boolean(),
});

const ExpeditionRecalledPayloadSchema = z.object({
  expeditionId: z.string(),
  villageId: z.string(),
  returnAt: z.string(),
});

const ExpeditionReturnedPayloadSchema = z.object({
  expeditionId: z.string(),
  reportId: z.string().nullable(),
  villageId: z.string(),
  survivingUnits: UnitMapSchema,
  loot: z.object({ resources: LootResourcesSchema }),
});

const GarrisonAddedPayloadSchema = z.object({
  villageId: z.string(),
  originVillageId: z.string(),
  units: UnitMapSchema,
});

const ResourcesChangedPayloadSchema = z.object({
  villageId: z.string(),
  wood: z.number(),
  stone: z.number(),
  iron: z.number(),
  maxPerType: z.number(),
  lastUpdateTs: z.string(),
  productionRates: z.object({
    wood: z.number(),
    stone: z.number(),
    iron: z.number(),
  }),
});

const CrownsChangedPayloadSchema = z.object({
  userId: z.string(),
  worldId: z.string(),
  balance: z.number(),
  productionRate: z.number(),
  lastUpdateTs: z.string(),
});

const WorldStatusChangedPayloadSchema = z.object({
  worldId: z.string(),
  from: z.enum(["PLANNED", "OPEN", "LOCKED", "ENDED"]),
  to: z.enum(["PLANNED", "OPEN", "LOCKED", "ENDED"]),
  at: z.string().datetime(),
});

const WorldPlannedCreatedPayloadSchema = z.object({
  worldId: z.string(),
  plannedOpenAt: z.string().datetime(),
  source: z.literal("auto"),
});

const WorldInscriptionPhaseChangedPayloadSchema = z.object({
  worldId: z.string(),
  from: z.literal("main"),
  to: z.literal("late"),
  at: z.string().datetime(),
});

const RankingsChangedPayloadSchema = z.object({
  worldId: z.string(),
  signal: z.enum(["ASSAULT_GLORY", "RAMPART_GLORY"]),
  scorerUserId: z.string(),
  opponentUserId: z.string(),
  points: z.number().int().positive(),
  combatReportId: z.string(),
  occurredAt: z.string().datetime(),
});

const IntelUpdatedPayloadSchema = z.object({
  userId: z.string(),
  worldId: z.string(),
  villageId: z.string(),
});

const RankingsCycleClosedPayloadSchema = z.object({
  worldId: z.string(),
  signal: z.enum(["ASSAULT_GLORY", "RAMPART_GLORY"]),
  cycleIndex: z.number().int().positive(),
  cycleEndAt: z.string().datetime(),
});

export const EVENT_PAYLOAD_SCHEMAS = {
  "building.completed": BuildingCompletedPayloadSchema,
  "unit.training.completed": UnitTrainingCompletedPayloadSchema,
  "unit.trained": UnitTrainedPayloadSchema,
  "battle.sent": BattleSentPayloadSchema,
  "battle.resolved": BattleResolvedPayloadSchema,
  "battle.returned": BattleReturnedPayloadSchema,
  "scout.sent": ScoutSentPayloadSchema,
  "scout.reported": ScoutReportedPayloadSchema,
  "scout.returned": ScoutReturnedPayloadSchema,
  "village.attacked": VillageAttackedPayloadSchema,
  "village.conquered": VillageConqueredPayloadSchema,
  "village.removed": VillageRemovedPayloadSchema,
  "village.capture-window-opened": VillageCaptureWindowOpenedPayloadSchema,
  "village.capture-window-completed":
    VillageCaptureWindowCompletedPayloadSchema,
  "village.capture-window-interrupted":
    VillageCaptureWindowInterruptedPayloadSchema,
  "noble.killed": NobleKilledPayloadSchema,
  "reinforcement.sent": ReinforcementSentPayloadSchema,
  "reinforcement.recalled": ReinforcementRecalledPayloadSchema,
  "reinforcement.returned": ReinforcementReturnedPayloadSchema,
  "caravan.sent": CaravanSentPayloadSchema,
  "caravan.arrived": CaravanArrivedPayloadSchema,
  "caravan.recalled": CaravanRecalledPayloadSchema,
  "caravan.returned": CaravanReturnedPayloadSchema,
  "expedition.recalled": ExpeditionRecalledPayloadSchema,
  "expedition.returned": ExpeditionReturnedPayloadSchema,
  "garrison.added": GarrisonAddedPayloadSchema,
  "resources.changed": ResourcesChangedPayloadSchema,
  "crowns.changed": CrownsChangedPayloadSchema,
  "rankings.changed": RankingsChangedPayloadSchema,
  "rankings.cycle.closed": RankingsCycleClosedPayloadSchema,
  "world.status.changed": WorldStatusChangedPayloadSchema,
  "world.planned.created": WorldPlannedCreatedPayloadSchema,
  "world.inscription-phase.changed":
    WorldInscriptionPhaseChangedPayloadSchema,
  "pvp.shield.broken": PvpShieldBrokenPayloadSchema,
  "intel.updated": IntelUpdatedPayloadSchema,
} as const satisfies Record<EventKind, z.ZodType>;

export type EventPayloadSchema<K extends EventKind> = z.ZodType<
  PayloadForKind<K>
>;
