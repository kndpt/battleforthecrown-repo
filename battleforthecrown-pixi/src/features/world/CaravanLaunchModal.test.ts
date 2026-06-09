import { describe, expect, it } from "vitest";
import { CARRY_PER_PORTER } from "@battleforthecrown/shared/logic";
import { getCaravanLaunchState } from "./caravanLaunchState";

const stock = { wood: 10_000, stone: 10_000, iron: 10_000 };
const capacityRemaining = { wood: 3_500, stone: 3_500, iron: 3_500 };

describe("getCaravanLaunchState", () => {
  it.each([
    [{ wood: 0, stone: 0, iron: 0 }, 0],
    [{ wood: 1, stone: 0, iron: 0 }, 1],
    [{ wood: CARRY_PER_PORTER, stone: 0, iron: 0 }, 1],
    [{ wood: CARRY_PER_PORTER + 1, stone: 0, iron: 0 }, 2],
  ])("rounds porter requirements for %o", (resources, porters) => {
    expect(
      getCaravanLaunchState({
        villageId: "origin",
        targetVillageId: "target",
        resources,
        stock,
        capacityRemaining,
        freePopulation: 10,
        isLoading: false,
        isPending: false,
      }).porters,
    ).toBe(porters);
  });

  it("blocks submission when origin stock is insufficient", () => {
    const state = getCaravanLaunchState({
      villageId: "origin",
      targetVillageId: "target",
      resources: { wood: 2_000, stone: 0, iron: 0 },
      stock: { wood: 1_000, stone: 10_000, iron: 10_000 },
      capacityRemaining,
      freePopulation: 10,
      isLoading: false,
      isPending: false,
    });

    expect(state.hasEnoughResources).toBe(false);
    expect(state.canSubmit).toBe(false);
    expect(state.mutationPayload).toBeNull();
  });

  it("blocks submission when free population cannot cover porters", () => {
    const state = getCaravanLaunchState({
      villageId: "origin",
      targetVillageId: "target",
      resources: { wood: CARRY_PER_PORTER + 1, stone: 0, iron: 0 },
      stock,
      capacityRemaining,
      freePopulation: 1,
      isLoading: false,
      isPending: false,
    });

    expect(state.hasEnoughPopulation).toBe(false);
    expect(state.canSubmit).toBe(false);
  });

  it("builds the mutation payload when all guards pass", () => {
    const resources = { wood: 500, stone: 200, iron: 0 };
    const state = getCaravanLaunchState({
      villageId: "origin",
      targetVillageId: "target",
      resources,
      stock,
      capacityRemaining,
      freePopulation: 2,
      isLoading: false,
      isPending: false,
    });

    expect(state).toMatchObject({
      canSubmit: true,
      totalVolume: 700,
      porters: 2,
      mutationPayload: {
        villageId: "origin",
        targetVillageId: "target",
        resources,
      },
    });
  });
});
