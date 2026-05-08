import { z } from 'zod';

// Speed multipliers: a value > 1 means "faster" (time is divided by it).
// Production is split off because its semantic is inverted — see EconomySchema.
const GameSpeedSchema = z.strictObject({
  construction: z.number().positive(),
  training: z.number().positive(),
  travel: z.number().positive(),
});

// productionRate amplifies the resource yield (rate × productionRate).
// A value > 1 means "more resources per minute" — opposite of GameSpeed dividers.
const EconomySchema = z.strictObject({
  productionRate: z.number().positive(),
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

export const WorldConfigSchema = z.strictObject({
  gameSpeed: GameSpeedSchema,
  economy: EconomySchema,
  combat: CombatRulesSchema,
  barbarianSeeding: BarbarianSeedingPlanSchema,
  playerVillagePlacement: PlayerVillagePlacementPlanSchema,
  fogOfWar: FogOfWarSettingsSchema,
});

export type WorldConfig = z.infer<typeof WorldConfigSchema>;
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
