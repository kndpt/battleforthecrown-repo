import type { BuildingType } from "../village/buildings";

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
