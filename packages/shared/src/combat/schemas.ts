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
