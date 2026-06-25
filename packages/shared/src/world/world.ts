import {
  DEFAULT_WORLD_IDENTITY_CONFIG,
  DEFAULT_WORLD_LIFECYCLE_CONFIG,
  DEFAULT_WORLD_OYEZ_CONFIG,
  DEFAULT_WORLD_RANKINGS_CONFIG,
  type BarbarianSeedingConfig,
  type PlayerVillagePlacementConfig,
  type WorldConfig,
} from './schemas';

export const DEFAULT_BARBARIAN_SEEDING_PLAN: BarbarianSeedingConfig = {
  enabled: true,
  chunkSize: 50,
  rMin: 8,
  rMax: 60,
  targetMin: 3,
  targetMax: 6,
  minSpacing: 6,
  playerExclusion: 2,
  seedVersion: 1,
  tiers: {
    T1: {
      minPoints: 550,
      maxPoints: 750,
      buildingRatio: 0.7,
      loot: {
        wood: { min: 200, max: 400 },
        stone: { min: 200, max: 400 },
        iron: { min: 100, max: 250 },
      },
      visibleIndexNoise: 0.08,
    },
    T2: {
      minPoints: 1200,
      maxPoints: 1600,
      buildingRatio: 0.6,
      loot: {
        wood: { min: 600, max: 1000 },
        stone: { min: 600, max: 1000 },
        iron: { min: 400, max: 700 },
      },
      visibleIndexNoise: 0.1,
    },
    T3: {
      minPoints: 2500,
      maxPoints: 3200,
      buildingRatio: 0.5,
      loot: {
        wood: { min: 1500, max: 2500 },
        stone: { min: 1500, max: 2500 },
        iron: { min: 1000, max: 1800 },
      },
      visibleIndexNoise: 0.12,
    },
    T4: {
      minPoints: 4500,
      maxPoints: 5800,
      buildingRatio: 0.4,
      loot: {
        wood: { min: 2200, max: 3300 },
        stone: { min: 2200, max: 3300 },
        iron: { min: 1500, max: 2500 },
      },
      visibleIndexNoise: 0.14,
    },
    T5: {
      minPoints: 7000,
      maxPoints: 9000,
      buildingRatio: 0.35,
      loot: {
        wood: { min: 3300, max: 4500 },
        stone: { min: 3300, max: 4500 },
        iron: { min: 2200, max: 3300 },
      },
      visibleIndexNoise: 0.16,
    },
  },
  tierRanges: [
    { minDistance: 8, maxDistance: 20, tier: 'T1' },
    { minDistance: 20, maxDistance: 30, tier: 'T2' },
    { minDistance: 30, maxDistance: 40, tier: 'T3' },
    { minDistance: 40, maxDistance: 50, tier: 'T4' },
    { minDistance: 50, maxDistance: 60, tier: 'T5' },
  ],
};

export const DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN: PlayerVillagePlacementConfig =
  {
    enabled: true,
    minSpacing: 3,
    zones: [
      { minRadius: 0, maxRadius: 30, maxVillages: 15 },
      { minRadius: 30, maxRadius: 60, maxVillages: 30 },
      { minRadius: 60, maxRadius: 90, maxVillages: 45 },
      { minRadius: 90, maxRadius: 120, maxVillages: 60 },
      { minRadius: 120, maxRadius: 150, maxVillages: 80 },
      { minRadius: 150, maxRadius: 200, maxVillages: 120 },
      { minRadius: 200, maxRadius: 999, maxVillages: 10000 },
    ],
  };

/**
 * Configuration canonique d'un monde neuf. Source de vérité TS pour la création
 * runtime d'un monde (auto-spawner lifecycle, run 064) quand aucun monde
 * template n'existe (bootstrap DB vide). Composée des constantes de défaut
 * partagées + des sections sans défaut Zod (tempo/combat/fogOfWar).
 *
 * Doit rester alignée avec `prisma/seed-default-world-config.sql` (le seed reste
 * la source pour le monde `default` provisionné en base). Un test backend
 * (`world-spawner.logic.spec.ts`) garantit que cet objet parse via
 * `WorldConfigSchema`.
 */
export const DEFAULT_WORLD_CONFIG: WorldConfig = {
  tempo: {
    global: 1,
    overrides: {
      constructionSpeed: 1,
      unitTrainingSpeed: 1,
      lordTrainingSpeed: 1,
      travelSpeed: 1,
      captureWindow: 1,
      barbarianRegen: 1,
      resourceProduction: 1,
      crownsYield: 1,
    },
  },
  lifecycle: { ...DEFAULT_WORLD_LIFECYCLE_CONFIG },
  identity: { ...DEFAULT_WORLD_IDENTITY_CONFIG },
  combat: { attackBonus: 1, defenseBonus: 1, lootFactor: 0.5 },
  barbarianSeeding: DEFAULT_BARBARIAN_SEEDING_PLAN,
  playerVillagePlacement: DEFAULT_PLAYER_VILLAGE_PLACEMENT_PLAN,
  fogOfWar: { enabled: true },
  oyez: { ...DEFAULT_WORLD_OYEZ_CONFIG },
  rankings: { ...DEFAULT_WORLD_RANKINGS_CONFIG },
};
