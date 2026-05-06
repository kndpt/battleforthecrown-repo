import { z } from 'zod';
import { UnitMapSchema } from '../army/unit-map';
import { LootResourcesSchema } from '../combat/schemas';
import type { EventKind, PayloadForKind } from './types';

const BuildingCompletedPayloadSchema = z.object({
  buildingId: z.string(),
  villageId: z.string(),
  buildingType: z.string(),
  level: z.number(),
});

const UnitTrainingCompletedPayloadSchema = z.object({
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
  targetX: z.number(),
  targetY: z.number(),
  isVictory: z.boolean(),
  loot: z.object({ resources: LootResourcesSchema }),
  lossesAttacker: UnitMapSchema,
  casualtyRate: z.number(),
  survivingUnits: UnitMapSchema,
  returnAt: z.string(),
});

const BattleReturnedPayloadSchema = z.object({
  expeditionId: z.string(),
  reportId: z.string(),
  villageId: z.string(),
  survivingUnits: UnitMapSchema,
  loot: z.object({ resources: LootResourcesSchema }),
});

const VillageAttackedPayloadSchema = z.object({
  defenderVillageId: z.string(),
  attackerVillageId: z.string(),
  attackerVillageName: z.string(),
  attackerX: z.number(),
  attackerY: z.number(),
  defenderVillageName: z.string(),
  isDefenseSuccessful: z.boolean(),
  losses: UnitMapSchema,
  casualtyRate: z.number(),
  resourcesLost: LootResourcesSchema,
  timestamp: z.string(),
});

const VillageConqueredPayloadSchema = z.object({
  villageId: z.string(),
  newOwnerId: z.string(),
  previousTier: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  buildingsKept: z.number(),
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

export const EVENT_PAYLOAD_SCHEMAS = {
  'building.completed': BuildingCompletedPayloadSchema,
  'unit.training.completed': UnitTrainingCompletedPayloadSchema,
  'battle.sent': BattleSentPayloadSchema,
  'battle.resolved': BattleResolvedPayloadSchema,
  'battle.returned': BattleReturnedPayloadSchema,
  'village.attacked': VillageAttackedPayloadSchema,
  'village.conquered': VillageConqueredPayloadSchema,
  'resources.changed': ResourcesChangedPayloadSchema,
  'crowns.changed': CrownsChangedPayloadSchema,
} as const satisfies Record<EventKind, z.ZodType>;

export type EventPayloadSchema<K extends EventKind> = z.ZodType<
  PayloadForKind<K>
>;
