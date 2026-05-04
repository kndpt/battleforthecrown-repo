export type ResourceType = 'WOOD' | 'STONE' | 'IRON';

export interface ResourceCost {
  wood: number;
  stone: number;
  iron: number;
  population: number;
}

export interface StorageLimits {
  wood: number;
  stone: number;
  iron: number;
}

export interface ResourcesConfig {
  storageLimits: Record<number, StorageLimits>;
}
