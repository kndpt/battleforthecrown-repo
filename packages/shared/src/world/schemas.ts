import { z } from 'zod';

const SpeedMultipliersSchema = z.strictObject({
  construction: z.number().positive(),
  production: z.number().positive(),
  training: z.number().positive(),
});

const CombatRulesSchema = z.strictObject({
  travelSpeed: z.number().positive(),
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

export const WorldConfigSchema = z.strictObject({
  multipliers: SpeedMultipliersSchema,
  combat: CombatRulesSchema,
  barbarianSeeding: BarbarianSeedingPlanSchema,
  playerVillagePlacement: PlayerVillagePlacementPlanSchema,
  fogOfWar: FogOfWarSettingsSchema,
});

export type WorldConfig = z.infer<typeof WorldConfigSchema>;
export type SpeedMultipliers = z.infer<typeof SpeedMultipliersSchema>;
export type BarbarianSeedingPlan = z.infer<typeof BarbarianSeedingPlanSchema>;
export type BarbarianSeedingConfig = BarbarianSeedingPlan;
export type TierWindow = z.infer<typeof TierWindowSchema>;
export type PlayerVillagePlacementPlan = z.infer<
  typeof PlayerVillagePlacementPlanSchema
>;
export type PlayerVillagePlacementConfig = PlayerVillagePlacementPlan;
export type PlayerVillageZone = z.infer<typeof PlayerVillageZoneSchema>;
export type FogOfWarSettings = z.infer<typeof FogOfWarSettingsSchema>;
export type WorldSettings = WorldConfig;
