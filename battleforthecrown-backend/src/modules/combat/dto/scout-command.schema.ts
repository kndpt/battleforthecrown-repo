import { z } from 'zod';
import { UnitMapSchema, UNIT_TYPES } from '@battleforthecrown/shared/army';
import { TARGET_KINDS } from '@battleforthecrown/shared/combat';
import type { ScoutCommand } from '@battleforthecrown/shared/combat';

export const scoutCommandSchema = z.object({
  villageId: z.string().min(1),
  targetX: z.number().int(),
  targetY: z.number().int(),
  targetKind: z.enum([
    TARGET_KINDS.PLAYER_VILLAGE,
    TARGET_KINDS.BARBARIAN_VILLAGE,
  ]),
  targetRefId: z.string().min(1),
  units: UnitMapSchema.refine(
    (units) =>
      (units[UNIT_TYPES.SPY] ?? 0) > 0 &&
      Object.entries(units).every(
        ([unitType, quantity]) =>
          unitType === UNIT_TYPES.SPY ||
          quantity === undefined ||
          quantity === 0,
      ),
    { message: 'Scout missions must contain SPY units only' },
  ),
}) satisfies z.ZodType<ScoutCommand>;

export type ScoutCommandDto = z.infer<typeof scoutCommandSchema>;
