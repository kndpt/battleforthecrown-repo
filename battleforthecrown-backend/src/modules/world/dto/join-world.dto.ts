import { z } from 'zod';
import type { JoinWorldRequest } from '@battleforthecrown/shared/world';

export const joinWorldSchema = z.object({
  villageName: z.string().min(1).max(50).optional(),
}) satisfies z.ZodType<JoinWorldRequest>;

export type JoinWorldDto = JoinWorldRequest;
