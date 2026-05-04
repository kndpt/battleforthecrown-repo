import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './index';
import {
  toAuthSession,
  type AuthSession,
  type AuthSessionResponse,
  type BuildingDto,
  type JoinedVillage,
  type JoinWorldResult,
  type PopulationDto,
  type QueueEntryDto,
  type UpgradeResponseDto,
  type World,
  type WorldMembership,
} from './types';
import type { WorldEntityDto } from './world-types';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';

export const queryKeys = {
  worlds: () => ['worlds'] as const,
  myMemberships: (userId: string | null) => ['memberships', userId] as const,
  myVillages: (userId: string | null, worldId: string | null) => ['villages', userId, worldId] as const,
  buildings: (villageId: string | null) => ['buildings', villageId] as const,
  queue: (villageId: string | null) => ['queue', villageId] as const,
  population: (villageId: string | null) => ['population', villageId] as const,
  resources: (villageId: string | null) => ['resources', villageId] as const,
  worldEntities: (worldId: string | null) => ['world-entities', worldId] as const,
  worldConfig: (worldId: string | null) => ['world-config', worldId] as const,
};

interface LoginInput {
  email: string;
  password: string;
}

type RegisterInput = LoginInput;

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation<AuthSession, Error, LoginInput>({
    mutationFn: async (input) => {
      const payload = await apiClient.post<AuthSessionResponse>('/auth/login', input, { skipAuth: true });
      return toAuthSession(payload);
    },
    onSuccess: (session) => {
      setSession(session);
    },
  });
}

export function useRegisterMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation<AuthSession, Error, RegisterInput>({
    mutationFn: async (input) => {
      const payload = await apiClient.post<AuthSessionResponse>('/auth/register', input, { skipAuth: true });
      return toAuthSession(payload);
    },
    onSuccess: (session) => {
      setSession(session);
    },
  });
}

export function useWorldsQuery() {
  return useQuery<World[]>({
    queryKey: queryKeys.worlds(),
    queryFn: () => apiClient.get<World[]>('/world'),
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
      return apiClient.get<WorldMembership[]>(`/world/users/${userId}/memberships`);
    },
    enabled: Boolean(userId),
  });
}

interface JoinWorldInput {
  worldId: string;
  villageName?: string;
}

export function useJoinWorldMutation() {
  const queryClient = useQueryClient();
  const setContext = useGameStore((state) => state.setContext);
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation<JoinWorldResult, Error, JoinWorldInput>({
    mutationFn: ({ worldId, villageName }) => {
      if (!userId) {
        return Promise.reject(new Error('Not authenticated'));
      }
      const body = { userId, ...(villageName ? { villageName } : {}) };
      return apiClient.post<JoinWorldResult>(`/world/${worldId}/join`, body);
    },
    onSuccess: (result) => {
      setContext({ worldId: result.membership.worldId, villageId: result.village?.id ?? null });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['villages'] });
    },
  });
}

export function useMyVillagesQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<JoinedVillage[]>({
    queryKey: queryKeys.myVillages(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) {
        return Promise.resolve([] as JoinedVillage[]);
      }
      return apiClient.get<JoinedVillage[]>('/village', { query: { worldId, userId } });
    },
    enabled: Boolean(userId && worldId),
  });
}

export interface ResourcesPayload {
  wood: number;
  stone: number;
  iron: number;
  maxPerType: number;
  lastUpdateTs: string;
  productionRates: { wood: number; stone: number; iron: number };
}

export function useResourcesQuery(villageId: string | null) {
  return useQuery<ResourcesPayload>({
    queryKey: queryKeys.resources(villageId),
    queryFn: () => {
      if (!villageId) {
        return Promise.reject(new Error('No village selected'));
      }
      return apiClient.get<ResourcesPayload>(`/resources/${villageId}`);
    },
    enabled: Boolean(villageId),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useVillageBuildingsQuery(villageId: string | null) {
  return useQuery<BuildingDto[]>({
    queryKey: queryKeys.buildings(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as BuildingDto[]);
      return apiClient.get<BuildingDto[]>('/village/buildings', { query: { villageId } });
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });
}

export function useBuildingQueueQuery(villageId: string | null) {
  return useQuery<QueueEntryDto[]>({
    queryKey: queryKeys.queue(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as QueueEntryDto[]);
      return apiClient.get<QueueEntryDto[]>('/village/queue', { query: { villageId } });
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });
}

export function usePopulationQuery(villageId: string | null) {
  return useQuery<PopulationDto>({
    queryKey: queryKeys.population(villageId),
    queryFn: () => {
      if (!villageId) {
        return Promise.reject(new Error('No village selected'));
      }
      return apiClient.get<PopulationDto>('/population', { query: { villageId } });
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });
}

interface UpgradeBuildingInput {
  villageId: string;
  buildingType: string;
}

interface UpgradeContext {
  previousQueue?: QueueEntryDto[];
  previousResources?: ResourcesPayload;
  optimisticEntryId?: string;
}

export function useUpgradeBuildingMutation() {
  const queryClient = useQueryClient();
  return useMutation<UpgradeResponseDto, Error, UpgradeBuildingInput, UpgradeContext>({
    mutationFn: ({ villageId, buildingType }) =>
      apiClient.post<UpgradeResponseDto>(`/village/${villageId}/upgrade`, { buildingType }),
    onMutate: async ({ villageId, buildingType }) => {
      const queueKey = queryKeys.queue(villageId);
      const resourcesKey = queryKeys.resources(villageId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queueKey }),
        queryClient.cancelQueries({ queryKey: resourcesKey }),
      ]);
      const previousQueue = queryClient.getQueryData<QueueEntryDto[]>(queueKey);
      const previousResources = queryClient.getQueryData<ResourcesPayload>(resourcesKey);

      const optimisticEntryId = `optimistic-${buildingType}-${Date.now()}`;
      const now = new Date();
      const optimisticEntry: QueueEntryDto = {
        id: optimisticEntryId,
        type: buildingType,
        level: 0,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 60_000).toISOString(),
      };

      queryClient.setQueryData<QueueEntryDto[]>(queueKey, (current = []) => [...current, optimisticEntry]);

      return { previousQueue, previousResources, optimisticEntryId };
    },
    onError: (_err, { villageId }, context) => {
      if (!context) return;
      if (context.previousQueue !== undefined) {
        queryClient.setQueryData(queryKeys.queue(villageId), context.previousQueue);
      }
      if (context.previousResources !== undefined) {
        queryClient.setQueryData(queryKeys.resources(villageId), context.previousResources);
      }
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
    },
  });
}

interface CancelConstructionInput {
  villageId: string;
  buildingId: string;
}

interface CancelContext {
  previousQueue?: QueueEntryDto[];
}

export function useWorldEntitiesQuery(worldId: string | null) {
  return useQuery<WorldEntityDto[]>({
    queryKey: queryKeys.worldEntities(worldId),
    queryFn: () => {
      if (!worldId) return Promise.resolve([] as WorldEntityDto[]);
      return apiClient.get<WorldEntityDto[]>(`/world/${worldId}/entities`);
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
      if (!worldId) return Promise.reject(new Error('No world selected'));
      return apiClient.get<World>(`/world/${worldId}/details`);
    },
    enabled: Boolean(worldId),
    staleTime: 5 * 60_000,
  });
}

export function useCancelConstructionMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, CancelConstructionInput, CancelContext>({
    mutationFn: ({ villageId, buildingId }) =>
      apiClient.delete<void>(`/village/${villageId}/buildings/${buildingId}/cancel`),
    onMutate: async ({ villageId, buildingId }) => {
      const queueKey = queryKeys.queue(villageId);
      await queryClient.cancelQueries({ queryKey: queueKey });
      const previousQueue = queryClient.getQueryData<QueueEntryDto[]>(queueKey);
      queryClient.setQueryData<QueueEntryDto[]>(queueKey, (current = []) =>
        current.filter((entry) => entry.id !== buildingId),
      );
      return { previousQueue };
    },
    onError: (_err, { villageId }, context) => {
      if (!context?.previousQueue) return;
      queryClient.setQueryData(queryKeys.queue(villageId), context.previousQueue);
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearGame = useGameStore((state) => state.clear);
  return () => {
    clearSession();
    clearGame();
    queryClient.clear();
  };
}
