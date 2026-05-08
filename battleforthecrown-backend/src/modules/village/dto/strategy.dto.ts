import { z } from 'zod';
import type { ChangeStrategyRequest } from '@battleforthecrown/shared/village';

export const changeStrategySchema = z.object({
  strategy: z.enum(['FORTRESS', 'RAIDERS', 'ECONOMIC', 'BALANCED']),
}) satisfies z.ZodType<ChangeStrategyRequest>;

export type ChangeStrategyDto = ChangeStrategyRequest;
