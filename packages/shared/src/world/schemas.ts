import { z } from 'zod';

const TempoOverridesSchema = z.strictObject({
  constructionSpeed: z.number().positive().optional(),
  unitTrainingSpeed: z.number().positive().optional(),
  lordTrainingSpeed: z.number().positive().optional(),
  travelSpeed: z.number().positive().optional(),
  captureWindow: z.number().positive().optional(),
  barbarianRegen: z.number().positive().optional(),
  resourceProduction: z.number().positive().optional(),
  crownsYield: z.number().positive().optional(),
});

const TempoSchema = z.strictObject({
  global: z.number().positive(),
  overrides: TempoOverridesSchema.optional(),
});

export const DEFAULT_WORLD_LIFECYCLE_CONFIG = {
  worldDuration: 60,
  inscriptionMainDays: 7,
  inscriptionLateDays: 3,
  newWorldEverydays: 7,
  newbieShieldHours: 48,
  archiveAfterDays: 7,
} as const;

export const WorldLifecycleSchema = z.strictObject({
  worldDuration: z.number().int().positive().default(
    DEFAULT_WORLD_LIFECYCLE_CONFIG.worldDuration,
  ),
  inscriptionMainDays: z.number().int().positive().default(
    DEFAULT_WORLD_LIFECYCLE_CONFIG.inscriptionMainDays,
  ),
  inscriptionLateDays: z.number().int().nonnegative().default(
    DEFAULT_WORLD_LIFECYCLE_CONFIG.inscriptionLateDays,
  ),
  newWorldEverydays: z.number().int().positive().default(
    DEFAULT_WORLD_LIFECYCLE_CONFIG.newWorldEverydays,
  ),
  newbieShieldHours: z.number().int().positive().default(
    DEFAULT_WORLD_LIFECYCLE_CONFIG.newbieShieldHours,
  ),
  // Days a world stays consultable in ENDED before ARCHIVED purge (run 065).
  // Surfaced now so the read-only UI can derive the « archivé dans {M}j »
  // countdown (archiveAt = endsAt + archiveAfterDays).
  archiveAfterDays: z.number().int().positive().default(
    DEFAULT_WORLD_LIFECYCLE_CONFIG.archiveAfterDays,
  ),
});

export const newbieShieldStateSchema = z.object({
  endsAt: z.string().datetime(),
  brokenAt: z.string().datetime().nullable(),
  active: z.boolean(),
});

export const WorldSigilSchema = z.enum([
  'crown',
  'tree',
  'star',
  'cross',
  'flame',
  'fleur',
  'lion',
  'tower',
]);

export const WorldThemeColorSchema = z.enum([
  'green',
  'teal',
  'crimson',
  'purple',
  'gold',
  'azure',
  'silver',
  'onyx',
]);

export const WorldIdentityTierSchema = z.enum(['DEBUTANTS', 'CLASSED']);

export const DEFAULT_WORLD_IDENTITY_CONFIG = {
  displayName: 'Aubeforge',
  tagline: 'Un royaume pour apprendre et conquerir.',
  sigil: 'crown',
  themeColor: 'green',
  tier: 'DEBUTANTS',
} as const;

export const WorldIdentitySchema = z.strictObject({
  displayName: z
    .string()
    .trim()
    .min(1)
    .default(DEFAULT_WORLD_IDENTITY_CONFIG.displayName),
  tagline: z
    .string()
    .trim()
    .max(80)
    .default(DEFAULT_WORLD_IDENTITY_CONFIG.tagline),
  sigil: WorldSigilSchema.default(DEFAULT_WORLD_IDENTITY_CONFIG.sigil),
  themeColor: WorldThemeColorSchema.default(
    DEFAULT_WORLD_IDENTITY_CONFIG.themeColor,
  ),
  tier: WorldIdentityTierSchema.default(DEFAULT_WORLD_IDENTITY_CONFIG.tier),
});

const CombatRulesSchema = z.strictObject({
  attackBonus: z.number().nonnegative(),
  defenseBonus: z.number().nonnegative(),
  lootFactor: z.number().min(0).max(1),
});

const LootRangeSchema = z.strictObject({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
});

const TierWindowSchema = z.strictObject({
  minPoints: z.number().nonnegative(),
  maxPoints: z.number().nonnegative(),
  buildingRatio: z.number().min(0).max(1),
  loot: z.strictObject({
    wood: LootRangeSchema,
    stone: LootRangeSchema,
    iron: LootRangeSchema,
  }),
  visibleIndexNoise: z.number().min(0).max(1),
});

const BarbarianSeedingPlanSchema = z.strictObject({
  enabled: z.boolean(),
  chunkSize: z.number().int().positive(),
  rMin: z.number().nonnegative(),
  rMax: z.number().nonnegative(),
  targetMin: z.number().int().nonnegative(),
  targetMax: z.number().int().nonnegative(),
  minSpacing: z.number().nonnegative(),
  playerExclusion: z.number().nonnegative(),
  seedVersion: z.number().int().nonnegative(),
  tiers: z.record(z.string(), TierWindowSchema),
  tierRanges: z.array(
    z.strictObject({
      minDistance: z.number().nonnegative(),
      maxDistance: z.number().nonnegative(),
      tier: z.string(),
    }),
  ),
});

const PlayerVillageZoneSchema = z.strictObject({
  minRadius: z.number().nonnegative(),
  maxRadius: z.number().nonnegative(),
  maxVillages: z.number().int().nonnegative(),
});

const PlayerVillagePlacementPlanSchema = z.strictObject({
  enabled: z.boolean(),
  minSpacing: z.number().nonnegative(),
  zones: z.array(PlayerVillageZoneSchema),
});

const FogOfWarSettingsSchema = z.strictObject({
  enabled: z.boolean(),
});

export const DEFAULT_WORLD_OYEZ_CONFIG = {
  enabled: true,
  weeklyCadence: 2,
  defaultDurationHours: 18,
} as const;

export const WorldOyezSchema = z.strictObject({
  enabled: z.boolean().default(DEFAULT_WORLD_OYEZ_CONFIG.enabled),
  weeklyCadence: z
    .number()
    .int()
    .min(0)
    .max(7)
    .default(DEFAULT_WORLD_OYEZ_CONFIG.weeklyCadence),
  // Capped < 24h so at most one Oyez window is active per world per day
  // (the `(world_id, day_key)` unique index then guarantees ≤ 1 active). See
  // ADR-18.
  defaultDurationHours: z
    .number()
    .int()
    .positive()
    .max(23)
    .default(DEFAULT_WORLD_OYEZ_CONFIG.defaultDurationHours),
});

export const DEFAULT_WORLD_RANKINGS_CONFIG = {
  // Weekly Glory cycle boundary, wall-clock aligned on Monday 00:00 UTC by
  // default (run 068). Kept wall-clock — not tempo-compressed — so "the week of
  // play" stays socially legible across worlds.
  weeklyCycleResetDayUtc: 1, // 0=Sun … 1=Mon … 6=Sat
  weeklyCycleResetHourUtc: 0,
  snapshotEntriesPerCycle: 20,
} as const;

export const WorldRankingsSchema = z.strictObject({
  weeklyCycleResetDayUtc: z
    .number()
    .int()
    .min(0)
    .max(6)
    .default(DEFAULT_WORLD_RANKINGS_CONFIG.weeklyCycleResetDayUtc),
  weeklyCycleResetHourUtc: z
    .number()
    .int()
    .min(0)
    .max(23)
    .default(DEFAULT_WORLD_RANKINGS_CONFIG.weeklyCycleResetHourUtc),
  snapshotEntriesPerCycle: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(DEFAULT_WORLD_RANKINGS_CONFIG.snapshotEntriesPerCycle),
});

export const WorldConfigSchema = z.strictObject({
  tempo: TempoSchema,
  lifecycle: WorldLifecycleSchema.default(DEFAULT_WORLD_LIFECYCLE_CONFIG),
  identity: WorldIdentitySchema.default(DEFAULT_WORLD_IDENTITY_CONFIG),
  combat: CombatRulesSchema,
  barbarianSeeding: BarbarianSeedingPlanSchema,
  playerVillagePlacement: PlayerVillagePlacementPlanSchema,
  fogOfWar: FogOfWarSettingsSchema,
  oyez: WorldOyezSchema.default(DEFAULT_WORLD_OYEZ_CONFIG),
  rankings: WorldRankingsSchema.default(DEFAULT_WORLD_RANKINGS_CONFIG),
});

export type WorldConfig = z.infer<typeof WorldConfigSchema>;
export type WorldTempo = z.infer<typeof TempoSchema>;
export type WorldTempoOverrides = z.infer<typeof TempoOverridesSchema>;
export type WorldLifecycleConfig = z.infer<typeof WorldLifecycleSchema>;
export type WorldIdentityConfig = z.infer<typeof WorldIdentitySchema>;
export type WorldSigil = z.infer<typeof WorldSigilSchema>;
export type WorldThemeColor = z.infer<typeof WorldThemeColorSchema>;
export type WorldIdentityTier = z.infer<typeof WorldIdentityTierSchema>;
export type BarbarianSeedingPlan = z.infer<typeof BarbarianSeedingPlanSchema>;
export type BarbarianSeedingConfig = BarbarianSeedingPlan;
export type TierWindow = z.infer<typeof TierWindowSchema>;
export type PlayerVillagePlacementPlan = z.infer<
  typeof PlayerVillagePlacementPlanSchema
>;
export type PlayerVillagePlacementConfig = PlayerVillagePlacementPlan;
export type PlayerVillageZone = z.infer<typeof PlayerVillageZoneSchema>;
export type FogOfWarSettings = z.infer<typeof FogOfWarSettingsSchema>;
export type WorldOyezConfig = z.infer<typeof WorldOyezSchema>;
