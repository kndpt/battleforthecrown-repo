import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { queryKeys } from "./queries";

vi.mock("./index", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("./ws", () => ({
  gameSocket: { on: vi.fn(() => () => undefined) },
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function seedPowerQueries(villageId: string, userId: string, worldId: string) {
  queryClient.setQueryData(queryKeys.villagePower(villageId), { total: 1 });
  queryClient.setQueryData(queryKeys.kingdomPower(userId, worldId), {
    kingdomPower: 1,
  });
}

function expectPowerInvalidated(
  villageId: string,
  userId: string,
  worldId: string,
) {
  expect(
    queryClient.getQueryState(queryKeys.villagePower(villageId))?.isInvalidated,
  ).toBe(true);
  expect(
    queryClient.getQueryState(queryKeys.kingdomPower(userId, worldId))
      ?.isInvalidated,
  ).toBe(true);
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  useAuthStore.getState().setSession({
    accessToken: "access",
    refreshToken: "refresh",
    user: { displayName: "User", id: "user-1" },
  });
  useGameStore.getState().setContext({ worldId: "world-1", villageId: "v-1" });
});

describe("useInitiateAttackMutation invalidations", () => {
  it("invalidates villagePower and kingdomPower on settle", async () => {
    seedPowerQueries("v-1", "user-1", "world-1");
    const { useInitiateAttackMutation } = await import("./queries");
    const { result } = renderHook(() => useInitiateAttackMutation(), {
      wrapper,
    });

    result.current.mutate({
      villageId: "v-1",
      targetX: 10,
      targetY: 20,
      targetKind: "BARBARIAN_VILLAGE",
      targetRefId: "barb-1",
      units: { MILITIA: 5 },
    });

    await waitFor(() => expect(result.current.isIdle).toBe(false));
    await waitFor(() => !result.current.isPending);
    expectPowerInvalidated("v-1", "user-1", "world-1");
  });
});

describe("useInitiateScoutMutation invalidations", () => {
  it("invalidates villagePower and kingdomPower on settle", async () => {
    seedPowerQueries("v-1", "user-1", "world-1");
    const { useInitiateScoutMutation } = await import("./queries");
    const { result } = renderHook(() => useInitiateScoutMutation(), {
      wrapper,
    });

    result.current.mutate({
      villageId: "v-1",
      targetX: 10,
      targetY: 20,
      targetKind: "PLAYER_VILLAGE",
      targetRefId: "target-1",
      units: { SPY: 1 },
    });

    await waitFor(() => expect(result.current.isIdle).toBe(false));
    await waitFor(() => !result.current.isPending);
    expectPowerInvalidated("v-1", "user-1", "world-1");
  });
});

describe("useInitiateReinforceMutation invalidations", () => {
  it("invalidates population, villagePower and kingdomPower on settle", async () => {
    seedPowerQueries("v-1", "user-1", "world-1");
    queryClient.setQueryData(queryKeys.population("v-1"), { used: 10, max: 50 });
    const { useInitiateReinforceMutation } = await import("./queries");
    const { result } = renderHook(() => useInitiateReinforceMutation(), {
      wrapper,
    });

    result.current.mutate({
      villageId: "v-1",
      targetVillageId: "v-2",
      units: { MILITIA: 3 },
    });

    await waitFor(() => expect(result.current.isIdle).toBe(false));
    await waitFor(() => !result.current.isPending);
    expectPowerInvalidated("v-1", "user-1", "world-1");
    expect(
      queryClient.getQueryState(queryKeys.population("v-1"))?.isInvalidated,
    ).toBe(true);
  });
});

describe("useInitiateCaravanMutation invalidations", () => {
  it("invalidates villagePower and kingdomPower on settle", async () => {
    seedPowerQueries("v-1", "user-1", "world-1");
    const { useInitiateCaravanMutation } = await import("./queries");
    const { result } = renderHook(() => useInitiateCaravanMutation(), {
      wrapper,
    });

    result.current.mutate({
      villageId: "v-1",
      targetVillageId: "v-2",
      resources: { wood: 100, stone: 50, iron: 25 },
    });

    await waitFor(() => expect(result.current.isIdle).toBe(false));
    await waitFor(() => !result.current.isPending);
    expectPowerInvalidated("v-1", "user-1", "world-1");
  });
});
