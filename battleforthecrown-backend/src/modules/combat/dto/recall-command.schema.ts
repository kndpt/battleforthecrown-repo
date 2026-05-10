import { z } from 'zod';
import { UnitMapSchema } from '@battleforthecrown/shared/army';
import type { RecallCommand } from '@battleforthecrown/shared/combat';

export const recallCommandSchema = z.object({
  villageId: z.string().min(1),
  originVillageId: z.string().min(1),
  units: UnitMapSchema,
}) satisfies z.ZodType<RecallCommand>;

export type RecallCommandDto = z.infer<typeof recallCommandSchema>;
