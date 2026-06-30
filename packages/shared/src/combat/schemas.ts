import { z } from 'zod';
import { UnitMapSchema } from '../army/unit-map';

export const LootResourcesSchema = z.strictObject({
  wood: z.number().nonnegative(),
  stone: z.number().nonnegative(),
  iron: z.number().nonnegative(),
});

export const LootResultSchema = z.object({
  resources: LootResourcesSchema.optional(),
  remainingResources: LootResourcesSchema.optional(),
  artifacts: z.array(z.unknown()).optional(),
  honor: z.number().optional(),
  items: z.array(z.unknown()).optional(),
  metadata: z.strictObject({
    totalCapacityUsed: z.number().nonnegative(),
    totalCapacityAvailable: z.number().nonnegative(),
    cappedByCapacity: z.boolean(),
  }),
});

export const CombatLootSchema = z.object({
  resources: LootResourcesSchema.optional(),
  remainingResources: LootResourcesSchema.optional(),
});

export { UnitMapSchema as LossesSchema };
export { UnitMapSchema as ExpeditionUnitsSchema };

// ---------------------------------------------------------------------------
// Report response schemas — trust-boundary validation for frontend queries
// ---------------------------------------------------------------------------

const CombatReportCaptureSchema = z.object({
  pendingConquestId: z.string().optional(),
  villageId: z.string().optional(),
  villageName: z.string().optional(),
  openedAt: z.string().optional(),
  completedAt: z.string().optional(),
  outcome: z.string().optional(),
  conquerorName: z.string().optional(),
  visualTier: z.number().optional(),
}).optional();

const CombatReportDetailsSchema = z.object({
  targetTier: z.string().nullable().optional(),
  occupationDefense: z.unknown().optional(),
  captureFinalized: CombatReportCaptureSchema,
}).optional();

// z.object (non-strict): backend presenter spreads raw Prisma record,
// so extra internal fields (readBy*, hiddenBy*) pass through silently.
export const CombatReportResponseSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  attackerVillageId: z.string(),
  attackerVillageName: z.string().nullable().optional(),
  attackerX: z.number().nullable().optional(),
  attackerY: z.number().nullable().optional(),
  attackerUserId: z.string(),
  defenderVillageId: z.string().nullable().optional(),
  defenderVillageName: z.string().nullable().optional(),
  defenderX: z.number().nullable().optional(),
  defenderY: z.number().nullable().optional(),
  defenderUserId: z.string().nullable().optional(),
  observerUserId: z.string().nullable().optional(),
  targetKind: z.string(),
  targetX: z.number(),
  targetY: z.number(),
  loot: CombatLootSchema.passthrough(),
  totalUnitsAttacker: UnitMapSchema.optional(),
  totalUnitsDefender: UnitMapSchema.optional(),
  lossesAttacker: UnitMapSchema,
  lossesDefender: UnitMapSchema.optional(),
  isRead: z.boolean(),
  isAttacker: z.boolean(),
  recipientRole: z.enum(['attacker', 'defender', 'observer']).nullable().optional(),
  details: CombatReportDetailsSchema,
  timestamp: z.string(),
  createdAt: z.string(),
}).passthrough();

export const CombatReportsResponseSchema = z.array(CombatReportResponseSchema);

const NewbieShieldSnapshotSchema = z.object({
  active: z.boolean(),
  endsAt: z.string().nullable(),
});

const ScoutReportDetailsSchema = z.object({
  scoutLosses: UnitMapSchema.optional(),
  scoutUnits: UnitMapSchema.optional(),
  wallLevel: z.number().optional(),
  castleLevel: z.number().optional(),
  newbieShield: NewbieShieldSnapshotSchema.optional(),
  defensiveFriendsDisplayNames: z.array(z.string()).optional(),
}).optional();

export const ScoutReportResponseSchema = z.object({
  id: z.string(),
  scoutVillageId: z.string(),
  targetVillageId: z.string().optional(),
  targetKind: z.string(),
  targetX: z.number(),
  targetY: z.number(),
  targetName: z.string().nullable().optional(),
  targetTier: z.string().nullable().optional(),
  units: UnitMapSchema,
  resources: LootResourcesSchema,
  strategy: z.string().nullable().optional(),
  details: ScoutReportDetailsSchema,
  isRead: z.boolean(),
  timestamp: z.string(),
});

export const ScoutReportsResponseSchema = z.array(ScoutReportResponseSchema);

export const ReinforcementReportResponseSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  type: z.enum(['STATIONED', 'RETURNED']),
  originVillageId: z.string(),
  originVillageName: z.string().nullable().optional(),
  originX: z.number(),
  originY: z.number(),
  hostVillageId: z.string(),
  hostVillageName: z.string().nullable().optional(),
  hostX: z.number(),
  hostY: z.number(),
  units: UnitMapSchema,
  actorUserId: z.string().nullable().optional(),
  isRead: z.boolean(),
  timestamp: z.string(),
});

export const ReinforcementReportsResponseSchema = z.array(
  ReinforcementReportResponseSchema,
);

export const CaravanReportResponseSchema = z.strictObject({
  id: z.string(),
  worldId: z.string(),
  expeditionId: z.string(),
  type: z.enum(['ARRIVED', 'RETURNED']),
  originVillageId: z.string(),
  originVillageName: z.string().nullable().optional(),
  originX: z.number(),
  originY: z.number(),
  targetVillageId: z.string(),
  targetVillageName: z.string().nullable().optional(),
  targetX: z.number(),
  targetY: z.number(),
  resources: LootResourcesSchema,
  credited: LootResourcesSchema,
  returned: LootResourcesSchema,
  lost: LootResourcesSchema,
  porters: z.number(),
  recalled: z.boolean(),
  isRead: z.boolean(),
  timestamp: z.string(),
});

export const CaravanReportsResponseSchema = z.array(CaravanReportResponseSchema);
