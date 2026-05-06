export interface LootResources {
  wood: number;
  stone: number;
  iron: number;
}

export interface LootResult {
  resources?: LootResources;
  remainingResources?: LootResources;
  artifacts?: unknown[];
  honor?: number;
  items?: unknown[];
  metadata: {
    totalCapacityUsed: number;
    totalCapacityAvailable: number;
    cappedByCapacity: boolean;
  };
}

export interface CombatResolution {
  loot: LootResult;
  lossesAttacker: Record<string, number>;
  lossesDefender: Record<string, number> | null;
  survivingUnits: Record<string, number>;
}
