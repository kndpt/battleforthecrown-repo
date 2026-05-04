import type { BuildingType } from "../village/buildings";
import type { ResourcesConfig } from "../resources/types";
import type { UnitsConfig } from "../army/types";
import type { VillageStrategyPlan } from "../village/strategy";
import type { CombatRules } from "../combat";
import type { CrownsSettings } from "../crowns";

export type Level = number;

export interface PopulationConfig {
  limits: Record<Level, number>;
}

export interface PowerConfig {
  buildingWeights: Record<BuildingType, number>;
  unitSoftCapThreshold: number;
  unitSoftCapDecay: number; // 0..1
  defaultWeights: {
    kingdom: number;
    army: number;
  };
}

export interface SpeedMultipliers {
  construction: number;
  production: number;
  training: number;
}

export interface TierWindow {
  minPoints: number;
  maxPoints: number;
  buildingRatio: number; // 0..1, rest goes to army
  loot: {
    wood: { min: number; max: number };
    stone: { min: number; max: number };
    iron: { min: number; max: number };
  };
  visibleIndexNoise: number; // % noise
}

export interface BarbarianSeedingPlan {
  enabled: boolean;
  chunkSize: number; // default 50
  rMin: number; // min ring distance in tiles
  rMax: number; // max ring distance in tiles
  targetMin: number; // min BVs per chunk
  targetMax: number; // max BVs per chunk
  minSpacing: number; // min distance between BVs
  playerExclusion: number; // min distance from player villages
  seedVersion: number; // bump to regenerate with new patterns
  tiers: Record<string, TierWindow>; // tier name -> config
  tierRanges: Array<{ minDistance: number; maxDistance: number; tier: string }>;
}

export type BarbarianSeedingConfig = BarbarianSeedingPlan;

export interface PlayerVillageZone {
  minRadius: number; // distance from center
  maxRadius: number; // distance from center
  maxVillages: number; // max villages in this zone
}

export interface PlayerVillagePlacementPlan {
  enabled: boolean;
  minSpacing: number; // min distance between player villages (default: 3)
  zones: PlayerVillageZone[]; // concentric zones from center
}

export type PlayerVillagePlacementConfig = PlayerVillagePlacementPlan;

export interface WorldSettings {
  multipliers: SpeedMultipliers;
  barbarianSeeding?: BarbarianSeedingPlan;
  playerVillagePlacement?: PlayerVillagePlacementPlan;
  combat: CombatRules;
}

export type WorldConfig = WorldSettings;
