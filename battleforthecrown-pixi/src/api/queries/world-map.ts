import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  WorldConfigSchema,
  VillageIntelDtoSchema,
  type WorldConfig,
  type VillageIntelDto,
} from "@battleforthecrown/shared/world";
import { apiClient } from "../index";
import type { World } from "../types";
import type { WorldEntitiesResponse } from "../world-types";
import { queryKeys } from "./keys";

export function useWorldEntitiesQuery(worldId: string | null) {
  return useQuery<WorldEntitiesResponse>({
    queryKey: queryKeys.worldEntities(worldId),
    queryFn: () => {
      if (!worldId) {
        return Promise.resolve({
          entities: [],
          visionDisks: [],
          fogOfWarEnabled: true,
        } satisfies WorldEntitiesResponse);
      }
      return apiClient.get<WorldEntitiesResponse>(`/world/${worldId}/entities`);
    },
    enabled: Boolean(worldId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useWorldDetailsQuery(worldId: string | null) {
  return useQuery<World>({
    queryKey: queryKeys.worldConfig(worldId),
    queryFn: () => {
      if (!worldId) return Promise.reject(new Error("No world selected"));
      return apiClient.get<World>(`/world/${worldId}/details`);
    },
    enabled: Boolean(worldId),
    staleTime: 5 * 60_000,
  });
}

export function useWorldConfigQuery(worldId: string | null) {
  return useQuery<WorldConfig>({
    queryKey: queryKeys.worldConfigFull(worldId),
    queryFn: async () => {
      if (!worldId) throw new Error("No world selected");
      const raw = await apiClient.get<unknown>(`/world/${worldId}/config`);
      return WorldConfigSchema.parse(raw);
    },
    enabled: Boolean(worldId),
    staleTime: 5 * 60_000,
  });
}

export function useVillageIntelQuery(
  worldId: string | null,
  villageId: string | null,
  enabled = true,
): UseQueryResult<VillageIntelDto | null> {
  return useQuery<VillageIntelDto | null>({
    queryKey: queryKeys.villageIntel(worldId, villageId),
    queryFn: async () => {
      if (!worldId || !villageId) return null;
      const raw = await apiClient.get<unknown>(
        `/worlds/${worldId}/intel/${villageId}`,
      );
      return VillageIntelDtoSchema.nullable().parse(raw ?? null);
    },
    enabled: Boolean(worldId && villageId && enabled),
    staleTime: 30_000,
  });
}
