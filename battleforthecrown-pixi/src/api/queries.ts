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
import type { WorldEntityResponse } from './world-types';
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
  crowns: (userId: string | null, worldId: string | null) => ['crowns', userId, worldId] as const,
  villagePower: (villageId: string | null) => ['power', 'village', villageId] as const,
  kingdomPower: (userId: string | null) => ['power', 'kingdom', userId] as const,
  armyInventory: (villageId: string | null) => ['army', 'inventory', villageId] as const,
  armyTraining: (villageId: string | null) => ['army', 'training', villageId] as const,
  activeExpeditions: (villageId: string | null) => ['combat', 'active', villageId] as const,
  combatReports: (userId: string | null) => ['combat', 'reports', userId] as const,
  combatReport: (reportId: string | null) => ['combat', 'report', reportId] as const,
  worldConfigFull: (worldId: string | null) => ['world-config-full', worldId] as const,
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

export interface CrownsBalanceDto {
  balance: number;
  productionRate: number;
}

export function useCrownsQuery(userId: string | null, worldId: string | null) {
  return useQuery<CrownsBalanceDto>({
    queryKey: queryKeys.crowns(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) {
        return Promise.reject(new Error('No user or world selected'));
      }
      return apiClient.get<CrownsBalanceDto>(`/crowns/${userId}/${worldId}`);
    },
    enabled: Boolean(userId && worldId),
    staleTime: 30_000,
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

export interface VillagePowerDto {
  total: number;
  buildings: number;
  army: number;
  breakdown?: Record<string, unknown>;
}

export interface KingdomPowerVillageDto {
  villageId: string;
  villageName: string;
  total: number;
  buildings: number;
  army: number;
}

export interface KingdomPowerDto {
  userId: string;
  kingdomPower: number;
  villageCount: number;
  villages: KingdomPowerVillageDto[];
  totalBuildings: number;
  totalArmy: number;
}

export function useVillagePowerQuery(villageId: string | null) {
  return useQuery<VillagePowerDto>({
    queryKey: queryKeys.villagePower(villageId),
    queryFn: () => {
      if (!villageId) return Promise.reject(new Error('No village selected'));
      return apiClient.get<VillagePowerDto>('/power', { query: { villageId } });
    },
    enabled: Boolean(villageId),
    staleTime: 30_000,
  });
}

export function useKingdomPowerQuery(userId: string | null) {
  return useQuery<KingdomPowerDto>({
    queryKey: queryKeys.kingdomPower(userId),
    queryFn: () => {
      if (!userId) return Promise.reject(new Error('No user'));
      return apiClient.get<KingdomPowerDto>(`/power/kingdom/${userId}`);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export interface ArmyUnitDto {
  id: string;
  type: string;
  quantity: number;
  populationCost: number;
}

export interface ArmyTrainingDto {
  id: string;
  villageId: string;
  unitType: string;
  totalQty: number;
  completedQty: number;
  timePerUnitMs: number;
  nextUnitEta: string;
  createdAt: string;
}

export function useArmyInventoryQuery(villageId: string | null) {
  return useQuery<ArmyUnitDto[]>({
    queryKey: queryKeys.armyInventory(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as ArmyUnitDto[]);
      return apiClient.get<ArmyUnitDto[]>(`/army/${villageId}/inventory`);
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });
}

export function useArmyTrainingQuery(villageId: string | null) {
  return useQuery<ArmyTrainingDto[]>({
    queryKey: queryKeys.armyTraining(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as ArmyTrainingDto[]);
      return apiClient.get<ArmyTrainingDto[]>(`/army/${villageId}/training`);
    },
    enabled: Boolean(villageId),
    refetchInterval: (query) => (query.state.data && query.state.data.length > 0 ? 5_000 : false),
    staleTime: 2_000,
  });
}

interface TrainUnitsInput {
  villageId: string;
  unitType: string;
  quantity: number;
}

export function useTrainUnitsMutation() {
  const queryClient = useQueryClient();
  return useMutation<ArmyTrainingDto, Error, TrainUnitsInput>({
    mutationFn: ({ villageId, unitType, quantity }) =>
      apiClient.post<ArmyTrainingDto>(`/army/${villageId}/train`, { unitType, quantity }),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyTraining(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
    },
  });
}

interface CancelTrainingInput {
  villageId: string;
  trainingId: string;
}

export function useCancelTrainingMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, CancelTrainingInput>({
    mutationFn: ({ villageId, trainingId }) =>
      apiClient.delete<void>(`/army/${villageId}/training/${trainingId}/cancel`),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyTraining(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
    },
  });
}

export interface ActiveExpeditionDto {
  id: string;
  attackerVillageId: string;
  attackerUserId: string;
  defenderVillageId?: string | null;
  defenderUserId?: string | null;
  targetX: number;
  targetY: number;
  targetKind: string;
  departAt: string;
  arrivalAt: string;
  returnAt?: string | null;
  status: string;
  units: Record<string, number>;
  reportId?: string | null;
}

export function useActiveExpeditionsQuery(villageId: string | null, userId: string | null) {
  return useQuery<ActiveExpeditionDto[]>({
    queryKey: queryKeys.activeExpeditions(villageId),
    queryFn: () => {
      if (!villageId || !userId) return Promise.resolve([] as ActiveExpeditionDto[]);
      return apiClient.get<ActiveExpeditionDto[]>(`/combat/${villageId}/active`, {
        query: { userId },
      });
    },
    enabled: Boolean(villageId && userId),
    // Poll while there are active expeditions so phase transitions stay in
    // sync even when a WS event is missed (the socket can drop briefly).
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 5_000 : false,
    staleTime: 2_000,
  });
}

export interface CombatLootDto {
  resources?: { wood?: number; stone?: number; iron?: number };
  remainingResources?: { wood?: number; stone?: number; iron?: number };
  artifacts?: unknown[];
  honor?: number;
  items?: unknown[];
}

export interface CombatReportDto {
  id: string;
  worldId: string;
  attackerVillageId: string;
  attackerUserId: string;
  defenderVillageId?: string | null;
  defenderUserId?: string | null;
  targetKind: string;
  targetX: number;
  targetY: number;
  loot: CombatLootDto;
  totalUnitsAttacker: Record<string, number>;
  totalUnitsDefender: Record<string, number>;
  lossesAttacker: Record<string, number>;
  lossesDefender: Record<string, number>;
  isRead: boolean;
  isAttacker: boolean;
  timestamp: string;
  createdAt: string;
}

export function useCombatReportsQuery(userId: string | null) {
  return useQuery<CombatReportDto[]>({
    queryKey: queryKeys.combatReports(userId),
    queryFn: () => {
      if (!userId) return Promise.resolve([] as CombatReportDto[]);
      return apiClient.get<CombatReportDto[]>('/combat/reports', { query: { userId } });
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  });
}

export function useCombatReportQuery(reportId: string | null, userId: string | null) {
  return useQuery<CombatReportDto>({
    queryKey: queryKeys.combatReport(reportId),
    queryFn: () => {
      if (!reportId || !userId) return Promise.reject(new Error('Missing report or user'));
      return apiClient.get<CombatReportDto>(`/combat/report/${reportId}`, {
        query: { userId },
      });
    },
    enabled: Boolean(reportId && userId),
    staleTime: 60_000,
  });
}

interface MarkReportReadInput {
  reportId: string;
  userId: string;
}

export function useMarkReportReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<CombatReportDto, Error, MarkReportReadInput>({
    mutationFn: ({ reportId, userId }) =>
      apiClient.patch<CombatReportDto>(`/combat/report/${reportId}/read`, undefined, {
        query: { userId },
      }),
    onSettled: (_data, _err, { reportId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.combatReports(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.combatReport(reportId) });
    },
  });
}

interface DeleteReportInput {
  reportId: string;
  userId: string;
}

export function useDeleteReportMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, DeleteReportInput>({
    mutationFn: ({ reportId, userId }) =>
      apiClient.delete<unknown>(`/combat/report/${reportId}`, {
        query: { userId },
      }),
    onSettled: (_data, _err, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.combatReports(userId) });
    },
  });
}

export interface WorldConfigDto {
  multipliers?: { construction: number; production: number; training: number };
  combat?: { travelSpeed: number; [key: string]: unknown };
  [key: string]: unknown;
}

export function useWorldConfigQuery(worldId: string | null) {
  return useQuery<WorldConfigDto>({
    queryKey: queryKeys.worldConfigFull(worldId),
    queryFn: () => {
      if (!worldId) return Promise.reject(new Error('No world selected'));
      return apiClient.get<WorldConfigDto>(`/world/${worldId}/config`);
    },
    enabled: Boolean(worldId),
    staleTime: 5 * 60_000,
  });
}

interface AttackInput {
  villageId: string;
  userId: string;
  targetX: number;
  targetY: number;
  targetKind: 'PLAYER_VILLAGE' | 'BARBARIAN_VILLAGE';
  targetRefId: string;
  units: Record<string, number>;
}

export function useInitiateAttackMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, AttackInput>({
    mutationFn: ({ userId, villageId, targetX, targetY, targetKind, targetRefId, units }) =>
      apiClient.post<unknown>(
        '/combat/attack',
        { villageId, targetX, targetY, targetKind, targetRefId, units },
        { query: { userId } },
      ),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
    },
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
  return useQuery<WorldEntityResponse[]>({
    queryKey: queryKeys.worldEntities(worldId),
    queryFn: () => {
      if (!worldId) return Promise.resolve([] as WorldEntityResponse[]);
      return apiClient.get<WorldEntityResponse[]>(`/world/${worldId}/entities`);
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
