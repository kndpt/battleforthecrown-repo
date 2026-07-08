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

/** Per-resource amounts (wood/stone/iron), e.g. a stock, a reward, or a delta. */
export interface ResourceAmounts {
  wood: number;
  stone: number;
  iron: number;
}