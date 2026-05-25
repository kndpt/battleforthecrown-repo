import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PublicWorldsResponseSchema,
  WorldConfigSchema,
  type PublicWorld,
  type WorldConfig,
} from '@battleforthecrown/shared/world';
import type {
  StrategyBonus,
  UpdateVillageLabelRequest,
  VillageLabel,
  VillageStrategyChangeCost,
  VillageStrategyDefinition,
  VillageStrategyType,
} from '@battleforthecrown/shared/village';
import { apiClient } from './index';
import { gameSocket } from './ws';
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
import type { WorldEntitiesResponse } from './world-types';
import { useAuthStore } from '@/stores/auth';
import { useExpeditionsStore } from '@/stores/expeditions';
import { useGameStore } from '@/stores/game';
import { buildRecalledExpeditionPatch } from '@/lib/expeditionRecall';
import type {
  Expedition,
  GarrisonLine,
  RecallReinforcementPayload,
  ReinforcePayload,
} from '@/lib/types';
import type {
  OpenConquestDto,
  OpenExpeditionDto,
  ScoutReportResponse,
} from '@battleforthecrown/shared/combat';
import type {
  ClaimDailyCardRequest,
  ClaimDailyCardResponse,
  RetentionSummaryDto,
} from '@battleforthecrown/shared/retention';

export const queryKeys = {
  worlds: () => ['worlds'] as const,
  publicWorlds: () => ['worlds', 'public'] as const,
  myMemberships: (userId: string | null) => ['memberships', userId] as const,
  myVillages: (userId: string | null, worldId: string | null) => ['villages', userId, worldId] as const,
  buildings: (villageId: string | null) => ['buildings', villageId] as const,
  queue: (villageId: string | null) => ['queue', villageId] as const,
  population: (villageId: string | null) => ['population', villageId] as const,
  resources: (villageId: string | null) => ['resources', villageId] as const,
  crowns: (userId: string | null, worldId: string | null) => ['crowns', userId, worldId] as const,
  villageStrategy: (villageId: string | null) => ['village-strategy', villageId] as const,
  villagePower: (villageId: string | null) => ['power', 'village', villageId] as const,
  kingdomPower: (userId: string | null, worldId: string | null) => ['power', 'kingdom', userId, worldId] as const,
  armyInventory: (villageId: string | null) => ['army', 'inventory', villageId] as const,
  armyTraining: (villageId: string | null) => ['army', 'training', villageId] as const,
  activeExpeditions: (villageId: string | null) => ['combat', 'active', villageId] as const,
  openConquests: (userId: string | null, worldId: string | null) => ['combat', 'conquests', 'open', userId, worldId] as const,
  openExpeditions: (userId: string | null, worldId: string | null) => ['combat', 'expeditions', 'open', userId, worldId] as const,
  garrison: (villageId: string | null) => ['combat', 'garrison', villageId] as const,
  combatReports: (userId: string | null, worldId: string | null) => ['combat', 'reports', userId, worldId] as const,
  combatReport: (reportId: string | null, worldId: string | null) => ['combat', 'report', reportId, worldId] as const,
  scoutReports: (userId: string | null, worldId: string | null) => ['combat', 'scout-reports', userId, worldId] as const,
  scoutReport: (reportId: string | null, worldId: string | null) => ['combat', 'scout-report', reportId, worldId] as const,
  worldConfigFull: (worldId: string | null) => ['world-config-full', worldId] as const,
  worldEntities: (worldId: string | null) => ['world-entities', worldId] as const,
  worldConfig: (worldId: string | null) => ['world-config', worldId] as const,
  retentionSummary: (userId: string | null, worldId: string | null) => ['retention', 'summary', userId, worldId] as const,
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

export function usePublicWorldsQuery() {
  return useQuery<PublicWorld[]>({
    queryKey: queryKeys.publicWorlds(),
    queryFn: async () => {
      const raw = await apiClient.get<unknown>('/worlds/public', {
        skipAuth: true,
      });
      return PublicWorldsResponseSchema.parse(raw);
    },
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
      return apiClient.get<WorldMembership[]>('/world/me/memberships');
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
  return useMutation<JoinWorldResult, Error, JoinWorldInput>({
    mutationFn: ({ worldId, villageName }) => {
      const body = villageName ? { villageName } : {};
      return apiClient.post<JoinWorldResult>(`/world/${worldId}/join`, body);
    },
    onSuccess: (result) => {
      setContext({ worldId: result.membership.worldId, villageId: result.village?.id ?? null });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['villages'] });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.myMemberships(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myVillages(userId, worldId) });
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
      return apiClient.get<JoinedVillage[]>('/village', { query: { worldId } });
    },
    enabled: Boolean(userId && worldId),
  });
}

interface UpdateVillageLabelInput {
  villageId: string;
  label: VillageLabel | null;
}

export function useUpdateVillageLabelMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);

  return useMutation<Pick<JoinedVillage, 'id' | 'label'>, Error, UpdateVillageLabelInput>({
    mutationFn: ({ villageId, label }) =>
      apiClient.patch<Pick<JoinedVillage, 'id' | 'label'>>(`/village/${villageId}/label`, {
        label,
      } satisfies UpdateVillageLabelRequest),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myVillages(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: ['villages'] });
    },
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

export interface VillageStrategyInfoDto {
  currentStrategy: VillageStrategyType;
  lastChangedAt: string;
  cooldownEndsAt: string | null;
  canChange: boolean;
  changeCost: number;
  changeCosts: Record<VillageStrategyType, VillageStrategyChangeCost>;
  hasCouncilHall: boolean;
  strategies: Record<
    VillageStrategyType,
    Omit<VillageStrategyDefinition, 'bonuses'> & { bonuses: StrategyBonus }
  >;
}

export interface ChangeVillageStrategyResultDto {
  success: boolean;
  newStrategy: VillageStrategyType;
  cost: VillageStrategyChangeCost;
  cooldownEndsAt: string;
  message: string;
}

export function useCrownsQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<CrownsBalanceDto>({
    queryKey: queryKeys.crowns(userId, worldId),
    queryFn: () => {
      if (!worldId) {
        return Promise.reject(new Error('No world selected'));
      }
      return apiClient.get<CrownsBalanceDto>(`/crowns/${worldId}`);
    },
    enabled: Boolean(userId && worldId),
    staleTime: 30_000,
  });
}

export function useVillageStrategyQuery(villageId: string | null, enabled = true) {
  return useQuery<VillageStrategyInfoDto>({
    queryKey: queryKeys.villageStrategy(villageId),
    queryFn: () => {
      if (!villageId) {
        return Promise.reject(new Error('No village selected'));
      }
      return apiClient.get<VillageStrategyInfoDto>('/village/strategy', { query: { villageId } });
    },
    enabled: Boolean(villageId && enabled),
    staleTime: 5_000,
  });
}

interface ChangeVillageStrategyInput {
  villageId: string;
  strategy: VillageStrategyType;
}

export function useChangeVillageStrategyMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);

  return useMutation<ChangeVillageStrategyResultDto, Error, ChangeVillageStrategyInput>({
    mutationFn: ({ villageId, strategy }) =>
      apiClient.post<ChangeVillageStrategyResultDto>(`/village/${villageId}/strategy`, { strategy }),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.villageStrategy(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crowns(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
    },
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

export function useKingdomPowerQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useQuery<KingdomPowerDto>({
    queryKey: queryKeys.kingdomPower(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) return Promise.reject(new Error('No world selected'));
      return apiClient.get<KingdomPowerDto>('/power/kingdom');
    },
    enabled: Boolean(userId && worldId),
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
  return useMutation<ArmyTrainingDto, Error, TrainUnitsInput, { previousTraining?: ArmyTrainingDto[] }>({
    mutationFn: ({ villageId, unitType, quantity }) =>
      apiClient.post<ArmyTrainingDto>(`/army/${villageId}/train`, { unitType, quantity }),
    onMutate: async ({ villageId, unitType, quantity }) => {
      const key = queryKeys.armyTraining(villageId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousTraining = queryClient.getQueryData<ArmyTrainingDto[]>(key);
      const now = Date.now();
      const optimistic: ArmyTrainingDto = {
        id: `optimistic-train-${unitType}-${now}`,
        villageId,
        unitType,
        totalQty: quantity,
        completedQty: 0,
        timePerUnitMs: 60_000,
        nextUnitEta: new Date(now + 60_000).toISOString(),
        createdAt: new Date(now).toISOString(),
      };
      queryClient.setQueryData<ArmyTrainingDto[]>(key, (current = []) => [...current, optimistic]);
      return { previousTraining };
    },
    onError: (_err, { villageId }, context) => {
      if (context?.previousTraining !== undefined) {
        queryClient.setQueryData(queryKeys.armyTraining(villageId), context.previousTraining);
      }
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyTraining(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
    },
  });
}

interface RecruitNobleInput {
  villageId: string;
}

export function useRecruitNobleMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<ArmyTrainingDto, Error, RecruitNobleInput>({
    mutationFn: ({ villageId }) =>
      apiClient.post<ArmyTrainingDto>(`/army/${villageId}/throne/recruit-noble`, {}),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyTraining(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.crowns(userId, worldId) });
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
  kind?: 'ATTACK' | 'REINFORCE' | 'SCOUT';
  attackerVillageId: string;
  attackerUserId: string;
  defenderVillageId?: string | null;
  defenderUserId?: string | null;
  targetRefId?: string | null;
  reinforcementOriginVillageId?: string | null;
  targetX: number;
  targetY: number;
  targetKind: string;
  departAt: string;
  arrivalAt: string;
  returnAt?: string | null;
  status: string;
  units: Record<string, number>;
  reportId?: string | null;
  recalled?: boolean;
  updatedAt?: string;
}

export function useActiveExpeditionsQuery(villageId: string | null) {
  return useQuery<ActiveExpeditionDto[]>({
    queryKey: queryKeys.activeExpeditions(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as ActiveExpeditionDto[]);
      return apiClient.get<ActiveExpeditionDto[]>(`/combat/${villageId}/active`);
    },
    enabled: Boolean(villageId),
    // Poll while there are active expeditions so phase transitions stay in
    // sync even when a WS event is missed (the socket can drop briefly).
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 5_000 : false,
    staleTime: 2_000,
  });
}

export function useOpenConquestsQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<OpenConquestDto[]>({
    queryKey: queryKeys.openConquests(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) return Promise.resolve([] as OpenConquestDto[]);
      return apiClient.get<OpenConquestDto[]>('/combat/conquests/open', { query: { worldId } });
    },
    enabled: Boolean(userId && worldId),
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 10_000 : false,
    staleTime: 2_000,
  });
}

export function useOpenExpeditionsQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<OpenExpeditionDto[]>({
    queryKey: queryKeys.openExpeditions(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) return Promise.resolve([] as OpenExpeditionDto[]);
      return apiClient.get<OpenExpeditionDto[]>('/combat/expeditions/open', { query: { worldId } });
    },
    enabled: Boolean(userId && worldId),
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 5_000 : false,
    staleTime: 2_000,
  });
}

export function useGarrisonQuery(villageId: string | null) {
  return useQuery<GarrisonLine[]>({
    queryKey: queryKeys.garrison(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as GarrisonLine[]);
      return apiClient.get<GarrisonLine[]>(`/combat/${villageId}/garrison`);
    },
    enabled: Boolean(villageId),
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
  details?: { targetTier?: string | null };
  isRead: boolean;
  isAttacker: boolean;
  timestamp: string;
  createdAt: string;
}

export function useCombatReportsQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useQuery<CombatReportDto[]>({
    queryKey: queryKeys.combatReports(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) return Promise.resolve([] as CombatReportDto[]);
      return apiClient.get<CombatReportDto[]>('/combat/reports');
    },
    enabled: Boolean(userId && worldId),
    staleTime: 10_000,
  });
}

export function useCombatReportQuery(reportId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useQuery<CombatReportDto>({
    queryKey: queryKeys.combatReport(reportId, worldId),
    queryFn: () => {
      if (!reportId || !worldId) return Promise.reject(new Error('Missing report'));
      return apiClient.get<CombatReportDto>(`/combat/report/${reportId}`);
    },
    enabled: Boolean(reportId && userId && worldId),
    staleTime: 60_000,
  });
}

export type ScoutReportDto = ScoutReportResponse;

export function useScoutReportsQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useQuery<ScoutReportDto[]>({
    queryKey: queryKeys.scoutReports(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) return Promise.resolve([] as ScoutReportDto[]);
      return apiClient.get<ScoutReportDto[]>('/combat/scout-reports');
    },
    enabled: Boolean(userId && worldId),
    staleTime: 10_000,
  });
}

export function useScoutReportQuery(reportId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useQuery<ScoutReportDto>({
    queryKey: queryKeys.scoutReport(reportId, worldId),
    queryFn: () => {
      if (!reportId || !worldId) return Promise.reject(new Error('Missing scout report'));
      return apiClient.get<ScoutReportDto>(`/combat/scout-report/${reportId}`);
    },
    enabled: Boolean(reportId && userId && worldId),
    staleTime: 60_000,
  });
}

interface MarkReportReadInput {
  reportId: string;
}

export function useMarkReportReadMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<CombatReportDto, Error, MarkReportReadInput>({
    mutationFn: ({ reportId }) =>
      apiClient.patch<CombatReportDto>(`/combat/report/${reportId}/read`),
    onSettled: (_data, _err, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.combatReports(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.combatReport(reportId, worldId) });
    },
  });
}

export function useMarkScoutReportReadMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<ScoutReportDto, Error, MarkReportReadInput>({
    mutationFn: ({ reportId }) =>
      apiClient.patch<ScoutReportDto>(`/combat/scout-report/${reportId}/read`),
    onSettled: (_data, _err, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scoutReports(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scoutReport(reportId, worldId) });
    },
  });
}

interface DeleteReportInput {
  reportId: string;
}

export function useDeleteReportMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<unknown, Error, DeleteReportInput>({
    mutationFn: ({ reportId }) =>
      apiClient.delete<unknown>(`/combat/report/${reportId}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.combatReports(userId, worldId) });
    },
  });
}

export function useDeleteScoutReportMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<unknown, Error, DeleteReportInput>({
    mutationFn: ({ reportId }) =>
      apiClient.delete<unknown>(`/combat/scout-report/${reportId}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scoutReports(userId, worldId) });
    },
  });
}

export function useWorldConfigQuery(worldId: string | null) {
  return useQuery<WorldConfig>({
    queryKey: queryKeys.worldConfigFull(worldId),
    queryFn: async () => {
      if (!worldId) throw new Error('No world selected');
      const raw = await apiClient.get<unknown>(`/world/${worldId}/config`);
      return WorldConfigSchema.parse(raw);
    },
    enabled: Boolean(worldId),
    staleTime: 5 * 60_000,
  });
}

interface AttackInput {
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: 'PLAYER_VILLAGE' | 'BARBARIAN_VILLAGE';
  targetRefId: string;
  units: Record<string, number>;
}

export function useInitiateAttackMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<unknown, Error, AttackInput>({
    mutationFn: ({ villageId, targetX, targetY, targetKind, targetRefId, units }) =>
      apiClient.post<unknown>('/combat/attack', {
        villageId,
        targetX,
        targetY,
        targetKind,
        targetRefId,
        units,
      }),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
    },
  });
}

export function useInitiateScoutMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<unknown, Error, AttackInput>({
    mutationFn: ({ villageId, targetX, targetY, targetKind, targetRefId, units }) =>
      apiClient.post<unknown>('/combat/scout', {
        villageId,
        targetX,
        targetY,
        targetKind,
        targetRefId,
        units,
      }),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
    },
  });
}

interface RecallExpeditionInput {
  expeditionId: string;
  villageId: string;
}

export function useRecallExpeditionMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, RecallExpeditionInput>({
    mutationFn: ({ expeditionId }) =>
      apiClient.post<Expedition>(`/combat/recall/${expeditionId}`, {}),
    onSuccess: (expedition, { expeditionId }) => {
      const store = useExpeditionsStore.getState();
      const current = store.byId[expeditionId];
      const returnAt = expedition.returnAt ? Date.parse(String(expedition.returnAt)) : undefined;
      store.update(
        expeditionId,
        current && returnAt
          ? current.phase === 'RETURNING'
            ? { phase: 'RETURNING', returnAt }
            : buildRecalledExpeditionPatch(current, Date.now(), returnAt)
          : {
              phase: 'RETURNING',
              returnAt,
            },
      );
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
    },
  });
}

export function useInitiateReinforceMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, ReinforcePayload>({
    mutationFn: ({ villageId, targetVillageId, units }) =>
      apiClient.post<Expedition>('/combat/reinforce', {
        villageId,
        targetVillageId,
        units,
      }),
    onSettled: (_data, _err, { villageId, targetVillageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(targetVillageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(targetVillageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.garrison(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.garrison(targetVillageId) });
    },
  });
}

export function useRecallReinforcementMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, RecallReinforcementPayload>({
    mutationFn: ({ villageId, originVillageId, units }) =>
      apiClient.post<Expedition>('/combat/recall', {
        villageId,
        originVillageId,
        units,
      }),
    onSettled: (_data, _err, { villageId, originVillageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.armyInventory(originVillageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeExpeditions(originVillageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.garrison(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.garrison(originVillageId) });
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
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
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
    onSettled: (_data, _err, { villageId, buildingType }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.population(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
      if (buildingType === 'CASTLE') {
        queryClient.invalidateQueries({ queryKey: queryKeys.myVillages(userId, worldId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.worldEntities(worldId) });
      }
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
      if (!worldId) return Promise.reject(new Error('No world selected'));
      return apiClient.get<World>(`/world/${worldId}/details`);
    },
    enabled: Boolean(worldId),
    staleTime: 5 * 60_000,
  });
}

export function useRetentionSummaryQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<RetentionSummaryDto>({
    queryKey: queryKeys.retentionSummary(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) return Promise.reject(new Error('No world selected'));
      return apiClient.get<RetentionSummaryDto>('/retention', { query: { worldId } });
    },
    enabled: Boolean(userId && worldId),
    refetchInterval: (query) =>
      query.state.data && query.state.data.cards.some((card) => card.status !== 'CLAIMED')
        ? 30_000
        : false,
    staleTime: 10_000,
  });
}

interface ClaimDailyCardInput {
  cardId: string;
  villageId: string;
}

export function useClaimDailyCardMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);

  return useMutation<ClaimDailyCardResponse, Error, ClaimDailyCardInput>({
    mutationFn: ({ cardId, villageId }) =>
      apiClient.post<ClaimDailyCardResponse>(`/retention/cards/${cardId}/claim`, {
        villageId,
      } satisfies ClaimDailyCardRequest),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retentionSummary(userId, worldId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources(villageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myVillages(userId, worldId) });
    },
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
    gameSocket.disconnect();
    queryClient.clear();
  };
}
