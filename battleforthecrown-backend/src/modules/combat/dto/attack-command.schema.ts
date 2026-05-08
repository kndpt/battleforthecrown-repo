import { z } from 'zod';
import { UnitMapSchema } from '@battleforthecrown/shared/army';
import { TARGET_KINDS } from '@battleforthecrown/shared/combat';
import type { AttackCommand } from '@battleforthecrown/shared/combat';

export const attackCommandSchema = z.object({
  villageId: z.string().min(1),
  targetX: z.number().int(),
  targetY: z.number().int(),
  targetKind: z.enum([
    TARGET_KINDS.PLAYER_VILLAGE,
    TARGET_KINDS.BARBARIAN_VILLAGE,
  ]),
  targetRefId: z.string().min(1),
  units: UnitMapSchema,
}) satisfies z.ZodType<AttackCommand>;

export type AttackCommandDto = z.infer<typeof attackCommandSchema>;
