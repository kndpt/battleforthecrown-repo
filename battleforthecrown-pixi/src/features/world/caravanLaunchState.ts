import { CARRY_PER_PORTER } from "@battleforthecrown/shared/logic";
import type { LootResources } from "@battleforthecrown/shared/combat";

const RESOURCE_KEYS = ["wood", "stone", "iron"] as const;

interface CaravanLaunchStateInput {
  villageId: string | null;
  targetVillageId: string;
  resources: LootResources;
  stock: LootResources | null | undefined;
  capacityRemaining: LootResources;
  freePopulation: number;
  isLoading: boolean;
  isPending: boolean;
}

interface CaravanLaunchState {
  canSubmit: boolean;
  hasEnoughCaravanCapacity: boolean;
  hasEnoughPopulation: boolean;
  hasEnoughResources: boolean;
  maxResources: LootResources;
  mutationPayload: {
    villageId: string;
    targetVillageId: string;
    resources: LootResources;
  } | null;
  porters: number;
  totalMaxVolume: number;
  totalVolume: number;
}

export function getCaravanLaunchState(
  input: CaravanLaunchStateInput,
): CaravanLaunchState {
  const maxResources: LootResources = {
    wood: Math.max(
      0,
      Math.min(input.stock?.wood ?? 0, input.capacityRemaining.wood),
    ),
    stone: Math.max(
      0,
      Math.min(input.stock?.stone ?? 0, input.capacityRemaining.stone),
    ),
    iron: Math.max(
      0,
      Math.min(input.stock?.iron ?? 0, input.capacityRemaining.iron),
    ),
  };
  const totalVolume =
    input.resources.wood + input.resources.stone + input.resources.iron;
  const totalMaxVolume =
    maxResources.wood + maxResources.stone + maxResources.iron;
  const porters =
    totalVolume > 0 ? Math.ceil(totalVolume / CARRY_PER_PORTER) : 0;
  const hasEnoughResources =
    !input.stock ||
    (input.resources.wood <= input.stock.wood &&
      input.resources.stone <= input.stock.stone &&
      input.resources.iron <= input.stock.iron);
  const hasEnoughPopulation = porters <= input.freePopulation;
  const hasEnoughCaravanCapacity = RESOURCE_KEYS.every(
    (key) => input.resources[key] <= input.capacityRemaining[key],
  );
  const canSubmit =
    Boolean(input.villageId) &&
    totalVolume > 0 &&
    hasEnoughResources &&
    hasEnoughPopulation &&
    hasEnoughCaravanCapacity &&
    !input.isLoading &&
    !input.isPending;

  return {
    canSubmit,
    hasEnoughCaravanCapacity,
    hasEnoughPopulation,
    hasEnoughResources,
    maxResources,
    mutationPayload:
      canSubmit && input.villageId
        ? {
            villageId: input.villageId,
            targetVillageId: input.targetVillageId,
            resources: input.resources,
          }
        : null,
    porters,
    totalMaxVolume,
    totalVolume,
  };
}
