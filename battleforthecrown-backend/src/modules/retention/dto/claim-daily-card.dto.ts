import { z } from 'zod';
import {
  ClaimDailyCardRequestSchema,
  type ClaimDailyCardRequest,
} from '@battleforthecrown/shared/retention';

export const claimDailyCardSchema =
  ClaimDailyCardRequestSchema satisfies z.ZodType<ClaimDailyCardRequest>;
export type ClaimDailyCardDto = ClaimDailyCardRequest;
