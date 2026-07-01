import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PublicWorldsResponseSchema,
  type PublicWorld,
} from "@battleforthecrown/shared/world";
import { apiClient } from "../index";
import type {
  JoinWorldResult,
  World,
  WorldMembership,
} from "../types";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { queryKeys } from "./keys";

export function useWorldsQuery() {
  return useQuery<World[]>({
    queryKey: queryKeys.worlds(),
    queryFn: () => apiClient.get<World[]>("/world"),
    staleTime: 30_000,
  });
}

export function usePublicWorldsQuery() {
  return useQuery<PublicWorld[]>({
    queryKey: queryKeys.publicWorlds(),
    queryFn: async () => {
      const raw = await apiClient.get<unknown>("/worlds/public", {
        skipAuth: true,
      });
      return PublicWorldsResponseSchema.parse(raw);
    },
    staleTime: 30_000,
  });
}

export function useMyMembershipsQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<WorldMembership[]>({
    queryKey: queryKeys.myMemberships(userId),
    queryFn: () => {
      if (!userId) {
        return Promise.resolve([] as WorldMembership[]);
      }
      return apiClient.get<WorldMembership[]>("/world/me/memberships");
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  });
}

interface JoinWorldInput {
  worldId: string;
  villageName?: string;
}

interface EnterWorldInput {
  worldId: string;
}

export function useJoinWorldMutation() {
  const queryClient = useQueryClient();
  const setContext = useGameStore((state) => state.setContext);
  return useMutation<JoinWorldResult, Error, JoinWorldInput>({
    mutationFn: ({ worldId, villageName }) => {
      const body = villageName ? { villageName } : {};
      return apiClient.post<JoinWorldResult>(`/world/${worldId}/join`, body);
    },
    onSuccess: (result) => {
      setContext({
        worldId: result.membership.worldId,
        villageId: result.village?.id ?? null,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.membershipsPrefix(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.villagesPrefix() });
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingPrefix() });
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds() });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicWorlds() });
    },
  });
}

export function useEnterWorldMutation() {
  const queryClient = useQueryClient();
  const setContext = useGameStore((state) => state.setContext);
  return useMutation<WorldMembership, Error, EnterWorldInput>({
    mutationFn: ({ worldId }) =>
      apiClient.post<WorldMembership>(`/world/${worldId}/enter`),
    onSuccess: (membership) => {
      setContext({ worldId: membership.worldId, villageId: null });
      queryClient.invalidateQueries({
        queryKey: queryKeys.membershipsPrefix(),
      });
    },
  });
}

interface ResetWorldInput {
  worldId: string;
}

export function useResetWorldMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const contextWorldId = useGameStore((state) => state.worldId);
  const clearContext = useGameStore((state) => state.clear);
  return useMutation<void, Error, ResetWorldInput>({
    mutationFn: async ({ worldId }) => {
      await apiClient.delete<void>(`/world/${worldId}/me`);
    },
    onSuccess: (_data, { worldId }) => {
      if (contextWorldId === worldId) {
        clearContext();
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.myMemberships(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.myVillages(userId, worldId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds() });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicWorlds() });
    },
  });
}
