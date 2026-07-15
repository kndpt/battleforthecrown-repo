import { z } from 'zod';
import type { ResourceType } from './types';
import { CONVERTIBLE_RESOURCE_TYPES } from './conversion';

/**
 * Royal resource exchange command: convert `amount` of `sourceType` into
 * `destinationType` inside a SINGLE village. No destination village/player field
 * exists by design — the exchange never transfers across villages or players.
 */
export interface ConvertResourcesCommand {
  villageId: string;
  sourceType: ResourceType;
  destinationType: ResourceType;
  amount: number;
}

// Single source of truth for the whitelist (wood/stone/iron, never crowns).
const ResourceTypeEnum = z.enum(CONVERTIBLE_RESOURCE_TYPES);

export const ConvertResourcesCommandSchema = z
  .object({
    villageId: z.string().min(1),
    sourceType: ResourceTypeEnum,
    destinationType: ResourceTypeEnum,
    // Strictly positive integer amount of the source resource to spend.
    amount: z.number().int().positive(),
  })
  .refine((cmd) => cmd.sourceType !== cmd.destinationType, {
    message: 'sourceType and destinationType must differ',
    path: ['destinationType'],
  }) satisfies z.ZodType<ConvertResourcesCommand>;

export type ConvertResourcesCommandDto = z.infer<
  typeof ConvertResourcesCommandSchema
>;

/**
 * Server response for a successful conversion. Validated at the client trust
 * boundary so a malformed payload surfaces as an explicit error, not silent
 * `undefined`.
 */
export const ConvertResourcesResultSchema = z.object({
  villageId: z.string().min(1),
  sourceType: ResourceTypeEnum,
  destinationType: ResourceTypeEnum,
  spent: z.number().int().nonnegative(),
  credited: z.number().int().nonnegative(),
  dayKey: z.string().min(1),
});

export type ConvertResourcesResult = z.infer<
  typeof ConvertResourcesResultSchema
>;
