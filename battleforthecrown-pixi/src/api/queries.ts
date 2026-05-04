import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './index';
import {
  toAuthSession,
  type AuthSession,
  type AuthSessionResponse,
  type JoinedVillage,
  type JoinWorldResult,
  type World,
  type WorldMembership,
} from './types';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';

export const queryKeys = {
  worlds: () => ['worlds'] as const,
  myMemberships: (userId: string | null) => ['memberships', userId] as const,
  myVillages: (userId: string | null, worldId: string | null) => ['villages', userId, worldId] as const,
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
    queryKey: ['resources', villageId],
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
