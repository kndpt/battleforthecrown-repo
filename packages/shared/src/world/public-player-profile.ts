import { z } from 'zod';

/**
 * Public, world-scoped view of a player observed from the map.
 *
 * Source of truth: backend `PublicProfileService`. Exposes ONLY information
 * that spec `09-power-and-rankings.md § Visibilité` marks public — display
 * name, kingdom power, newbie-shield state. No renown, owned villages, crowns,
 * army or intel: leaking any of those would regress the public/private
 * boundary (spec 09).
 *
 * `newbieShield` is `null` when the shield is inactive (broken or expired):
 * the absence of a shield is intentionally not surfaced as an explicit
 * "exposed" signal (spec `14-pvp-conquest.md § 3` — discretion).
 */
export const PublicPlayerProfileNewbieShieldSchema = z.object({
  active: z.literal(true),
  endsAt: z.string(),
});

export const PublicPlayerProfileResponseSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  kingdomPower: z.number(),
  newbieShield: PublicPlayerProfileNewbieShieldSchema.nullable(),
});

export type PublicPlayerProfileResponse = z.infer<
  typeof PublicPlayerProfileResponseSchema
>;
