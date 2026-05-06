export interface PlayerResources {
  wood: number;
  stone: number;
  iron: number;
  population: number;
  gold?: number;
  food?: number;
}

export type Cost = Partial<PlayerResources>;

export interface AffordabilityCheck {
  canAfford: boolean;
  missingResources: Partial<PlayerResources>;
}

export function canAffordCost(cost: Cost, playerResources: PlayerResources): AffordabilityCheck {
  const missingResources: Partial<PlayerResources> = {};
  let canAfford = true;

  for (const [resourceKey, requiredAmount] of Object.entries(cost)) {
    const key = resourceKey as keyof PlayerResources;
    const available = playerResources[key] ?? 0;
    const required = requiredAmount ?? 0;

    if (available < required) {
      canAfford = false;
      missingResources[key] = required - available;
    }
  }

  return { canAfford, missingResources };
}

export function costIncludesPopulation(cost: Cost): boolean {
  return cost.population !== undefined && cost.population > 0;
}

export function getResourceCostsOnly(cost: Cost): Omit<Cost, 'population'> {
  return Object.fromEntries(
    Object.entries(cost).filter(([key]) => key !== 'population'),
  ) as Omit<Cost, 'population'>;
}

export function getPopulationCostOnly(cost: Cost): number {
  return cost.population ?? 0;
}
