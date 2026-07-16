import { z } from 'zod';

/**
 * Request body for `POST /resources/:villageId/convert`. The `villageId` comes
 * from the route param; the body only carries the conversion intent. Bounds:
 * source/destination whitelisted to WOOD/STONE/IRON (never crowns), strictly
 * positive integer amount, and source must differ from destination.
 */
export const convertResourcesBodySchema = z
  .object({
    sourceType: z.enum(['WOOD', 'STONE', 'IRON']),
    destinationType: z.enum(['WOOD', 'STONE', 'IRON']),
    amount: z.number().int().positive(),
  })
  .refine((body) => body.sourceType !== body.destinationType, {
    message: 'sourceType and destinationType must differ',
    path: ['destinationType'],
  });

export type ConvertResourcesBodyDto = z.infer<
  typeof convertResourcesBodySchema
>;
