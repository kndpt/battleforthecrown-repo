import type {
  BarbarianSeedingConfig,
  PlayerVillagePlacementConfig,
} from './types';

export const DEFAULT_BARBARIAN_SEEDING_PLAN: BarbarianSeedingConfig = {
  enabled: true,
  chunkSize: 50,
  rMin: 8,
  rMax: 40,
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
  },
  tierRanges: [
    { minDistance: 8, maxDistance: 20, tier: 'T1' },
    { minDistance: 20, maxDistance: 30, tier: 'T2' },
    { minDistance: 30, maxDistance: 40, tier: 'T3' },
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
