import type { BuildingType } from './buildings';
import type { VillageStrategyType } from './strategy';

export const VILLAGE_LABELS = ['OFFENSIVE', 'DEFENSIVE', 'ECONOMIC'] as const;

export type VillageLabel = (typeof VILLAGE_LABELS)[number];

export const VILLAGE_LABEL_DISPLAY: Record<VillageLabel, string> = {
  OFFENSIVE: 'Offensif',
  DEFENSIVE: 'Défensif',
  ECONOMIC: 'Économique',
};

export interface UpgradeBuildingRequest {
  buildingType: BuildingType;
}

export interface UpgradeBuildingResponse {
  id: string;
  type: string;
  currentLevel: number;
  nextLevel: number;
  startTime: string;
  endTime: string;
  cost: {
    wood: number;
    stone: number;
    iron: number;
    population: number;
    time: number;
  };
  populationCost: number;
}

export interface BuildingResponse {
  id: string;
  type: string;
  level: number;
  maxLevel: number;
  populationCost: number;
  isUnderConstruction: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface QueueEntryResponse {
  id: string;
  type: string;
  level: number;
  startTime: string;
  endTime: string;
}

export interface PopulationResponse {
  used: number;
  max: number;
  available: number;
}

export interface ChangeStrategyRequest {
  strategy: VillageStrategyType;
}

export interface UpdateVillageLabelRequest {
  label: VillageLabel | null;
}
