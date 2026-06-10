import { z } from 'zod';
import {
  LootResourcesSchema,
  type CaravanCommand,
} from '@battleforthecrown/shared/combat';

export const caravanCommandSchema = z.object({
  villageId: z.string().min(1),
  targetVillageId: z.string().min(1),
  resources: LootResourcesSchema,
}) satisfies z.ZodType<CaravanCommand>;

export type CaravanCommandDto = z.infer<typeof caravanCommandSchema>;
