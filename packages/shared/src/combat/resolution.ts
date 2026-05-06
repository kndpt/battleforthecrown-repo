export interface LootResult {
  resources?: {
    wood: number;
    stone: number;
    iron: number;
  };
  remainingResources?: {
    wood: number;
    stone: number;
    iron: number;
  };
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
