import { z } from 'zod';

/**
 * Public, world-scoped view of a player observed from the map.
 *
 * Source of truth: backend `PublicProfileService`. Exposes display name,
 * kingdom power (spec `09-power-and-rankings.md § Visibilité`), newbie-shield
 * state, and the cross-world **renown level**.
 *
 * Renown level is safe to expose: it is purely cosmetic identity with **zero
 * in-world power** (spec `25-account-renown.md § 2`), so surfacing it leaks no
 * mechanical advantage. Only the *level* is public — never raw XP, owned
 * villages, crowns, army or intel.
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
  /** Niveau de Renommée cross-monde (cosmétique, dérivé de l'XP — spec 25). */
  renownLevel: z.number().int().min(1),
  newbieShield: PublicPlayerProfileNewbieShieldSchema.nullable(),
});

export type PublicPlayerProfileResponse = z.infer<
  typeof PublicPlayerProfileResponseSchema
>;
