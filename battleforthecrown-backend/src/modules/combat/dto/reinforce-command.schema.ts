import { z } from 'zod';
import { UnitMapSchema } from '@battleforthecrown/shared/army';
import type { ReinforceCommand } from '@battleforthecrown/shared/combat';

export const reinforceCommandSchema = z.object({
  villageId: z.string().min(1),
  targetVillageId: z.string().min(1),
  units: UnitMapSchema,
}) satisfies z.ZodType<ReinforceCommand>;

export type ReinforceCommandDto = z.infer<typeof reinforceCommandSchema>;
