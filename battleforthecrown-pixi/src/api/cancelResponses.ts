import { z } from 'zod';

const CancelConstructionRefundSchema = z.object({
  wood: z.number(),
  stone: z.number(),
  iron: z.number(),
  population: z.number(),
});

const CancelTrainingRefundSchema = CancelConstructionRefundSchema.extend({
  crowns: z.number(),
});

export const CancelConstructionResponseSchema = z.object({
  success: z.boolean(),
  refunded: CancelConstructionRefundSchema,
});

export const CancelTrainingResponseSchema = z.object({
  success: z.boolean(),
  refunded: CancelTrainingRefundSchema,
});

export type CancelConstructionRefund = z.infer<
  typeof CancelConstructionRefundSchema
>;

export type CancelTrainingRefund = z.infer<typeof CancelTrainingRefundSchema>;

export type CancelConstructionResponse = z.infer<
  typeof CancelConstructionResponseSchema
>;

export type CancelTrainingResponse = z.infer<
  typeof CancelTrainingResponseSchema
>;
