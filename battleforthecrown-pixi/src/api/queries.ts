import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { z } from "zod";
import {
  PublicPlayerProfileResponseSchema,
  PublicWorldsResponseSchema,
  WorldConfigSchema,
  type PublicPlayerProfileResponse,
  type PublicWorld,
  type WorldConfig,
} from "@battleforthecrown/shared/world";
import { authSessionResponseSchema } from "@battleforthecrown/shared/auth";
import type {
  StrategyBonus,
  UpdateVillageLabelRequest,
  VillageLabel,
  VillageStrategyChangeCost,
  VillageStrategyDefinition,
  VillageStrategyType,
} from "@battleforthecrown/shared/village";
import { apiClient } from "./index";
import { gameSocket } from "./ws";
import {
  toAuthSession,
  type AuthSession,
  type BuildingDto,
  type JoinedVillage,
  type JoinWorldResult,
  type PopulationDto,
  type QueueEntryDto,
  type UpgradeResponseDto,
  type World,
  type WorldMembership,
} from "./types";
import type { WorldEntitiesResponse } from "./world-types";
import { useAuthStore } from "@/stores/auth";
import { useExpeditionsStore } from "@/stores/expeditions";
import { useGameStore } from "@/stores/game";
import { resetGameSessionStores } from "@/stores/session";
import { buildRecalledExpeditionPatch } from "@/lib/expeditionRecall";
import { pushRefundToast } from "./refundToast";
import {
  CancelConstructionResponseSchema,
  CancelTrainingResponseSchema,
  type CancelConstructionResponse,
  type CancelTrainingResponse,
} from "./cancelResponses";
import type {
  Expedition,
  CaravanPayload,
  GarrisonLine,
  RecallReinforcementPayload,
  ReinforcePayload,
} from "@/lib/types";
import {
  RetentionSummarySchema,
  type ClaimDailyCardRequest,
  type ClaimDailyCardResponse,
  type RetentionSummaryDto,
} from "@battleforthecrown/shared/retention";
import type { RenownStatus } from "@battleforthecrown/shared";
import type { CosmeticAwardResponse } from "@battleforthecrown/shared";
import { COSMETIC_AWARD_KINDS } from "@battleforthecrown/shared";
import type {
  OpenConquestDto,
  OpenExpeditionDto,
  CaravanReportResponse,
  ReinforcementReportResponse,
  ScoutReportResponse,
} from "@battleforthecrown/shared/combat";
import {
  VillageIntelDtoSchema,
  type VillageIntelDto,
} from "@battleforthecrown/shared/world";
import type { OnboardingSummaryDto } from "@battleforthecrown/shared/onboarding";
import {
  RankingCyclesCurrentResponseSchema,
  RankingsSummaryResponseSchema,
  RankingTitlesResponseSchema,
  WorldFinalRankingsResponseSchema,
  type RankingCyclesCurrentResponse,
  type RankingsSummaryResponse,
  type RankingTitlesResponse,
  type WorldFinalRankingsResponse,
} from "@battleforthecrown/shared/rankings";

const CaravanReportResourcesSchema = z.strictObject({
  wood: z.number(),
  stone: z.number(),
  iron: z.number(),
});

const CaravanReportResponseSchema = z.strictObject({
  id: z.string(),
  worldId: z.string(),
  expeditionId: z.string(),
  type: z.enum(["ARRIVED", "RETURNED"]),
  originVillageId: z.string(),
  originVillageName: z.string().nullable().optional(),
  originX: z.number(),
  originY: z.number(),
  targetVillageId: z.string(),
  targetVillageName: z.string().nullable().optional(),
  targetX: z.number(),
  targetY: z.number(),
  resources: CaravanReportResourcesSchema,
  credited: CaravanReportResourcesSchema,
  returned: CaravanReportResourcesSchema,
  lost: CaravanReportResourcesSchema,
  porters: z.number(),
  recalled: z.boolean(),
  isRead: z.boolean(),
  timestamp: z.string(),
});

const CaravanReportsResponseSchema = z.array(CaravanReportResponseSchema);

export const queryKeys = {
  worlds: () => ["worlds"] as const,
  publicWorlds: () => ["worlds", "public"] as const,
  myMemberships: (userId: string | null) => ["memberships", userId] as const,
  myVillages: (userId: string | null, worldId: string | null) =>
    ["villages", userId, worldId] as const,
  buildings: (villageId: string | null) => ["buildings", villageId] as const,
  queue: (villageId: string | null) => ["queue", villageId] as const,
  population: (villageId: string | null) => ["population", villageId] as const,
  resources: (villageId: string | null) => ["resources", villageId] as const,
  crowns: (userId: string | null, worldId: string | null) =>
    ["crowns", userId, worldId] as const,
  villageStrategy: (villageId: string | null) =>
    ["village-strategy", villageId] as const,
  villagePower: (villageId: string | null) =>
    ["power", "village", villageId] as const,
  kingdomPower: (userId: string | null, worldId: string | null) =>
    ["power", "kingdom", userId, worldId] as const,
  publicKingdomPower: (userId: string | null, worldId: string | null) =>
    ["power", "kingdom", "public", userId, worldId] as const,
  publicVillagePower: (villageId: string | null) =>
    ["power", "village", "public", villageId] as const,
  publicPlayerProfile: (userId: string | null, worldId: string | null) =>
    ["public-player-profile", userId, worldId] as const,
  armyInventory: (villageId: string | null) =>
    ["army", "inventory", villageId] as const,
  armyTraining: (villageId: string | null) =>
    ["army", "training", villageId] as const,
  activeExpeditions: (villageId: string | null) =>
    ["combat", "active", villageId] as const,
  openConquests: (userId: string | null, worldId: string | null) =>
    ["combat", "conquests", "open", userId, worldId] as const,
  openExpeditions: (userId: string | null, worldId: string | null) =>
    ["combat", "expeditions", "open", userId, worldId] as const,
  garrison: (villageId: string | null) =>
    ["combat", "garrison", villageId] as const,
  combatReports: (userId: string | null, worldId: string | null) =>
    ["combat", "reports", userId, worldId] as const,
  combatReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "report", reportId, worldId] as const,
  scoutReports: (userId: string | null, worldId: string | null) =>
    ["combat", "scout-reports", userId, worldId] as const,
  scoutReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "scout-report", reportId, worldId] as const,
  reinforcementReports: (userId: string | null, worldId: string | null) =>
    ["combat", "reinforcement-reports", userId, worldId] as const,
  reinforcementReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "reinforcement-report", reportId, worldId] as const,
  caravanReports: (userId: string | null, worldId: string | null) =>
    ["combat", "caravan-reports", userId, worldId] as const,
  caravanReport: (reportId: string | null, worldId: string | null) =>
    ["combat", "caravan-report", reportId, worldId] as const,
  worldConfigFull: (worldId: string | null) =>
    ["world-config-full", worldId] as const,
  worldEntities: (worldId: string | null) =>
    ["world-entities", worldId] as const,
  worldConfig: (worldId: string | null) => ["world-config", worldId] as const,
  retentionSummary: (userId: string | null, worldId: string | null) =>
    ["retention", "summary", userId, worldId] as const,
  onboardingSummary: (userId: string | null, worldId: string | null) =>
    ["onboarding", "summary", userId, worldId] as const,
  rankingsSummary: (worldId: string | null) =>
    ["rankings", "summary", worldId] as const,
  rankingCycles: (worldId: string | null) =>
    ["rankings", "cycles", worldId] as const,
  rankingTitles: (userId: string | null) =>
    ["ranking-titles", userId] as const,
  finalRankings: (worldId: string | null) =>
    ["rankings", "final", worldId] as const,
  renown: (userId: string | null) => ["renown", userId] as const,
  cosmeticAwards: (userId: string | null) =>
    ["cosmetic-awards", userId] as const,
  villageIntel: (worldId: string | null, villageId: string | null) =>
    ["intel", worldId, villageId] as const,
  // Broad-invalidation prefixes (omit trailing discriminants to match across worlds/users).
  renownPrefix: () => ["renown"] as const,
  membershipsPrefix: () => ["memberships"] as const,
  villagesPrefix: () => ["villages"] as const,
  worldEntitiesPrefix: () => ["world-entities"] as const,
  onboardingPrefix: () => ["onboarding"] as const,
  kingdomPowerPrefix: (userId: string | null) =>
    ["power", "kingdom", userId] as const,
  combatReportsPrefix: (userId: string | null) =>
    ["combat", "reports", userId] as const,
  scoutReportsPrefix: (userId: string | null) =>
    ["combat", "scout-reports", userId] as const,
  reinforcementReportsPrefix: (userId: string | null) =>
    ["combat", "reinforcement-reports", userId] as const,
  caravanReportsPrefix: (userId: string | null) =>
    ["combat", "caravan-reports", userId] as const,
  caravanReportPrefix: () => ["combat", "caravan-report"] as const,
};

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  displayName: string;
}

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation<AuthSession, Error, LoginInput>({
    mutationFn: async (input) => {
      const payload = authSessionResponseSchema.parse(
        await apiClient.post("/auth/login", input, { skipAuth: true }),
      );
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
      const payload = authSessionResponseSchema.parse(
        await apiClient.post("/auth/register", input, { skipAuth: true }),
      );
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
      return apiClient.get<JoinedVillage[]>("/village", { query: { worldId } });
    },
    enabled: Boolean(userId && worldId),
    staleTime: 30_000,
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

  return useMutation<
    Pick<JoinedVillage, "id" | "label">,
    Error,
    UpdateVillageLabelInput
  >({
    mutationFn: ({ villageId, label }) =>
      apiClient.patch<Pick<JoinedVillage, "id" | "label">>(
        `/village/${villageId}/label`,
        {
          label,
        } satisfies UpdateVillageLabelRequest,
      ),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myVillages(userId, worldId),
      });
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

export const resourcesQueryOptions = (villageId: string | null) =>
  queryOptions({
    queryKey: queryKeys.resources(villageId),
    queryFn: () => {
      if (!villageId) return Promise.reject(new Error("No village selected"));
      return apiClient.get<ResourcesPayload>(`/resources/${villageId}`);
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });

export function useResourcesQuery(villageId: string | null) {
  return useQuery(resourcesQueryOptions(villageId));
}

export const buildingsQueryOptions = (villageId: string | null) =>
  queryOptions({
    queryKey: queryKeys.buildings(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as BuildingDto[]);
      return apiClient.get<BuildingDto[]>("/village/buildings", {
        query: { villageId },
      });
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });

export function useVillageBuildingsQuery(villageId: string | null) {
  return useQuery(buildingsQueryOptions(villageId));
}

export const queueQueryOptions = (villageId: string | null) =>
  queryOptions({
    queryKey: queryKeys.queue(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as QueueEntryDto[]);
      return apiClient.get<QueueEntryDto[]>("/village/queue", {
        query: { villageId },
      });
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });

export function useBuildingQueueQuery(villageId: string | null) {
  return useQuery(queueQueryOptions(villageId));
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
    Omit<VillageStrategyDefinition, "bonuses"> & { bonuses: StrategyBonus }
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
        return Promise.reject(new Error("No world selected"));
      }
      return apiClient.get<CrownsBalanceDto>(`/crowns/${worldId}`);
    },
    enabled: Boolean(userId && worldId),
    staleTime: 30_000,
  });
}

export const villageStrategyQueryOptions = (villageId: string | null) =>
  queryOptions({
    queryKey: queryKeys.villageStrategy(villageId),
    queryFn: () => {
      if (!villageId) return Promise.reject(new Error("No village selected"));
      return apiClient.get<VillageStrategyInfoDto>("/village/strategy", {
        query: { villageId },
      });
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });

export function useVillageStrategyQuery(
  villageId: string | null,
  enabled = true,
) {
  return useQuery({
    ...villageStrategyQueryOptions(villageId),
    enabled: Boolean(villageId && enabled),
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

  return useMutation<
    ChangeVillageStrategyResultDto,
    Error,
    ChangeVillageStrategyInput
  >({
    mutationFn: ({ villageId, strategy }) =>
      apiClient.post<ChangeVillageStrategyResultDto>(
        `/village/${villageId}/strategy`,
        { strategy },
      ),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.villageStrategy(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crowns(userId, worldId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
    },
  });
}

export const populationQueryOptions = (villageId: string | null) =>
  queryOptions({
    queryKey: queryKeys.population(villageId),
    queryFn: () => {
      if (!villageId) return Promise.reject(new Error("No village selected"));
      return apiClient.get<PopulationDto>("/population", {
        query: { villageId },
      });
    },
    enabled: Boolean(villageId),
    staleTime: 5_000,
  });

export function usePopulationQuery(villageId: string | null) {
  return useQuery(populationQueryOptions(villageId));
}

export interface VillagePowerDto {
  total: number;
  buildings: number;
  army: number;
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
      if (!villageId) return Promise.reject(new Error("No village selected"));
      return apiClient.get<VillagePowerDto>("/power", { query: { villageId } });
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
      if (!userId || !worldId)
        return Promise.reject(new Error("No world selected"));
      return apiClient.get<KingdomPowerDto>("/power/kingdom");
    },
    enabled: Boolean(userId && worldId),
    staleTime: 30_000,
  });
}

const PublicKingdomPowerSchema = z.strictObject({
  userId: z.string(),
  kingdomPower: z.number(),
});

export type PublicKingdomPowerDto = z.infer<typeof PublicKingdomPowerSchema>;

export const publicKingdomPowerQueryOptions = (
  userId: string | null,
  worldId: string,
) =>
  queryOptions({
    enabled: userId !== null,
    queryFn: async (): Promise<PublicKingdomPowerDto> => {
      if (!userId) return Promise.reject(new Error("userId required"));
      const raw = await apiClient.get<unknown>(
        `/power/kingdom/${userId}/public`,
        {
          query: { worldId },
          skipAuth: true,
        },
      );
      return PublicKingdomPowerSchema.parse(raw);
    },
    queryKey: queryKeys.publicKingdomPower(userId, worldId),
    staleTime: 30_000,
  });

const PublicVillagePowerSchema = z.strictObject({
  villageId: z.string(),
  buildings: z.number(),
});

export type PublicVillagePowerDto = z.infer<typeof PublicVillagePowerSchema>;

/**
 * Building-only power of any village (no ownership check), used to surface a
 * foreign/barbarian village's strength in the world-map selection panel.
 * Troops are intentionally excluded — they are not public information.
 */
export function usePublicVillagePowerQuery(villageId: string | null) {
  return useQuery<PublicVillagePowerDto>({
    queryKey: queryKeys.publicVillagePower(villageId),
    queryFn: async () => {
      if (!villageId) return Promise.reject(new Error("villageId required"));
      const raw = await apiClient.get<unknown>(
        `/power/village/${villageId}/public`,
        {
          skipAuth: true,
        },
      );
      return PublicVillagePowerSchema.parse(raw);
    },
    enabled: Boolean(villageId),
    staleTime: 30_000,
  });
}

/**
 * World-scoped public profile of another player, opened from the map panel.
 * JWT-protected (no `skipAuth`): the shield `endsAt` is only readable by
 * authenticated players. Returns null-shield when the target is unprotected.
 */
export function usePublicPlayerProfileQuery(
  userId: string | null,
  worldId: string | null,
) {
  return useQuery<PublicPlayerProfileResponse>({
    queryKey: queryKeys.publicPlayerProfile(userId, worldId),
    queryFn: async () => {
      if (!userId || !worldId) {
        return Promise.reject(new Error("userId and worldId required"));
      }
      const raw = await apiClient.get<unknown>(
        `/worlds/${worldId}/users/${userId}/public-profile`,
      );
      return PublicPlayerProfileResponseSchema.parse(raw);
    },
    enabled: Boolean(userId) && Boolean(worldId),
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

export function useRankingsSummaryQuery(worldId: string | null) {
  return useQuery<RankingsSummaryResponse>({
    queryKey: queryKeys.rankingsSummary(worldId),
    queryFn: async () => {
      if (!worldId) return Promise.resolve({ leaderboards: [] });
      const response = await apiClient.get<unknown>("/rankings", {
        query: { worldId },
      });
      return RankingsSummaryResponseSchema.parse(response);
    },
    enabled: Boolean(worldId),
    staleTime: 30_000,
    // Poll while in a world so the leaderboard self-heals after WS drop.
    // applyRankingsChanged only fires on glory writes; power changes are
    // covered by invalidatePowerQueries, but a dropped socket covers neither.
    refetchInterval: 30_000,
  });
}

/**
 * Frozen end-of-world leaderboards (Hall of fame), served from the run 061
 * snapshot via GET /worlds/:worldId/rankings/final. Public: any player can
 * consult an ENDED world's final rankings, even one they never joined.
 * 404 (world not ENDED yet) and 409 (ENDED but snapshot missing) surface as
 * query errors — the screen renders an explicit empty/error state.
 */
export function useFinalRankingsQuery(
  worldId: string | null,
): UseQueryResult<WorldFinalRankingsResponse> {
  return useQuery<WorldFinalRankingsResponse>({
    queryKey: queryKeys.finalRankings(worldId),
    queryFn: async () => {
      if (!worldId) throw new Error("No world selected");
      const response = await apiClient.get<unknown>(
        `/worlds/${worldId}/rankings/final`,
      );
      return WorldFinalRankingsResponseSchema.parse(response);
    },
    enabled: Boolean(worldId),
    // Snapshot is immutable once written → cache aggressively, no polling.
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * Live weekly Glory cycle (current cycle + last closed champion) per signal,
 * for the rankings banner. Public endpoint; polls so the banner self-heals.
 */
export function useRankingCyclesQuery(
  worldId: string | null,
): UseQueryResult<RankingCyclesCurrentResponse> {
  return useQuery<RankingCyclesCurrentResponse>({
    queryKey: queryKeys.rankingCycles(worldId),
    queryFn: async () => {
      if (!worldId) throw new Error("No world selected");
      const response = await apiClient.get<unknown>(
        `/worlds/${worldId}/rankings/cycles/current`,
      );
      return RankingCyclesCurrentResponseSchema.parse(response);
    },
    enabled: Boolean(worldId),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

/** Temporary championship titles (active + historical) owned by the player. */
export function useRankingTitlesQuery(): UseQueryResult<RankingTitlesResponse> {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<RankingTitlesResponse>({
    queryKey: queryKeys.rankingTitles(userId),
    queryFn: async () => {
      const response = await apiClient.get<unknown>("/users/me/ranking-titles");
      return RankingTitlesResponseSchema.parse(response);
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
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

export const armyTrainingQueryOptions = (villageId: string | null) =>
  queryOptions({
    queryKey: queryKeys.armyTraining(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as ArmyTrainingDto[]);
      return apiClient.get<ArmyTrainingDto[]>(`/army/${villageId}/training`);
    },
    enabled: Boolean(villageId),
    staleTime: 2_000,
    // Poll while trainings are active so ArmyScreen self-heals on WS drop.
    // Noble training can last 10+ min, making a dropped socket a real risk.
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 5_000 : false,
  });

export function useArmyTrainingQuery(villageId: string | null) {
  return useQuery(armyTrainingQueryOptions(villageId));
}

interface TrainUnitsInput {
  villageId: string;
  unitType: string;
  quantity: number;
}

export function useTrainUnitsMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ArmyTrainingDto,
    Error,
    TrainUnitsInput,
    { previousTraining?: ArmyTrainingDto[] }
  >({
    mutationFn: ({ villageId, unitType, quantity }) =>
      apiClient.post<ArmyTrainingDto>(`/army/${villageId}/train`, {
        unitType,
        quantity,
      }),
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
      queryClient.setQueryData<ArmyTrainingDto[]>(key, (current = []) => [
        ...current,
        optimistic,
      ]);
      return { previousTraining };
    },
    onError: (_err, { villageId }, context) => {
      if (context?.previousTraining !== undefined) {
        queryClient.setQueryData(
          queryKeys.armyTraining(villageId),
          context.previousTraining,
        );
      }
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyTraining(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyInventory(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
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
      apiClient.post<ArmyTrainingDto>(
        `/army/${villageId}/throne/recruit-noble`,
        {},
      ),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyTraining(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyInventory(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crowns(userId, worldId),
      });
    },
  });
}

interface CancelTrainingInput {
  villageId: string;
  trainingId: string;
}

export function useCancelTrainingMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<CancelTrainingResponse, Error, CancelTrainingInput>({
    mutationFn: async ({ villageId, trainingId }) => {
      const raw = await apiClient.delete<unknown>(
        `/army/${villageId}/training/${trainingId}/cancel`,
      );
      return CancelTrainingResponseSchema.parse(raw);
    },
    onSuccess: (data) => {
      pushRefundToast("Entraînement annulé", data.refunded);
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyTraining(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.armyInventory(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.crowns(userId, worldId),
      });
    },
  });
}

export interface ActiveExpeditionDto {
  id: string;
  kind?: "ATTACK" | "REINFORCE" | "SCOUT" | "CARAVAN";
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
      return apiClient.get<ActiveExpeditionDto[]>(
        `/combat/${villageId}/active`,
      );
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
      return apiClient.get<OpenConquestDto[]>("/combat/conquests/open", {
        query: { worldId },
      });
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
      if (!userId || !worldId)
        return Promise.resolve([] as OpenExpeditionDto[]);
      return apiClient.get<OpenExpeditionDto[]>("/combat/expeditions/open", {
        query: { worldId },
      });
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
  honor?: number;
}

export interface CombatReportDto {
  id: string;
  worldId: string;
  attackerVillageId: string;
  attackerVillageName?: string | null;
  attackerX?: number | null;
  attackerY?: number | null;
  attackerUserId: string;
  defenderVillageId?: string | null;
  defenderVillageName?: string | null;
  defenderX?: number | null;
  defenderY?: number | null;
  defenderUserId?: string | null;
  observerUserId?: string | null;
  targetKind: string;
  targetX: number;
  targetY: number;
  loot: CombatLootDto;
  totalUnitsAttacker: Record<string, number>;
  totalUnitsDefender: Record<string, number>;
  lossesAttacker: Record<string, number>;
  lossesDefender: Record<string, number>;
  details?: {
    targetTier?: string | null;
    occupationDefense?: {
      attackerVillageId: string;
      defenderUserId?: string;
    };
    captureFinalized?: {
      pendingConquestId?: string;
      villageId?: string;
      villageName?: string;
      openedAt?: string;
      completedAt?: string;
      outcome?: string;
      conquerorName?: string;
      visualTier?: number;
    };
  };
  isRead: boolean;
  isAttacker: boolean;
  recipientRole?: "attacker" | "defender" | "observer" | null;
  timestamp: string;
  createdAt: string;
}

interface ReportHooksConfig<TList, TDetail> {
  listPath: string;
  detailPath: (id: string) => string;
  readPath: (id: string) => string;
  deletePath: (id: string) => string;
  listKey: (a: string | null, b: string | null) => readonly unknown[];
  detailKey: (a: string | null, b: string | null) => readonly unknown[];
  parseList?: (raw: unknown) => TList[];
  parseDetail?: (raw: unknown) => TDetail;
}

function createReportHooks<TList, TDetail>(
  cfg: ReportHooksConfig<TList, TDetail>,
) {
  function useListQuery() {
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useQuery<TList[]>({
      queryKey: cfg.listKey(userId, worldId),
      queryFn: async () => {
        if (!userId || !worldId) return [] as TList[];
        const raw = await apiClient.get<unknown>(cfg.listPath);
        return cfg.parseList ? cfg.parseList(raw) : (raw as TList[]);
      },
      enabled: Boolean(userId && worldId),
      staleTime: 10_000,
    });
  }

  function useDetailQuery(reportId: string | null) {
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useQuery<TDetail>({
      queryKey: cfg.detailKey(reportId, worldId),
      queryFn: async () => {
        if (!reportId || !worldId)
          return Promise.reject(new Error("Missing report"));
        const raw = await apiClient.get<unknown>(cfg.detailPath(reportId));
        return cfg.parseDetail ? cfg.parseDetail(raw) : (raw as TDetail);
      },
      enabled: Boolean(reportId && userId && worldId),
      staleTime: 60_000,
    });
  }

  function useMarkReadMutation() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useMutation<TDetail, Error, { reportId: string }>({
      mutationFn: async ({ reportId }) => {
        const raw = await apiClient.patch<unknown>(cfg.readPath(reportId));
        return cfg.parseDetail ? cfg.parseDetail(raw) : (raw as TDetail);
      },
      onSettled: (_data, _err, { reportId }) => {
        queryClient.invalidateQueries({
          queryKey: cfg.listKey(userId, worldId),
        });
        queryClient.invalidateQueries({
          queryKey: cfg.detailKey(reportId, worldId),
        });
      },
    });
  }

  function useDeleteMutation() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useMutation<unknown, Error, { reportId: string }>({
      mutationFn: ({ reportId }) =>
        apiClient.delete<unknown>(cfg.deletePath(reportId)),
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: cfg.listKey(userId, worldId),
        });
      },
    });
  }

  return {
    useListQuery,
    useDetailQuery,
    useMarkReadMutation,
    useDeleteMutation,
  };
}

const combatReport = createReportHooks<CombatReportDto, CombatReportDto>({
  listPath: "/combat/reports",
  detailPath: (id) => `/combat/report/${id}`,
  readPath: (id) => `/combat/report/${id}/read`,
  deletePath: (id) => `/combat/report/${id}`,
  listKey: queryKeys.combatReports,
  detailKey: queryKeys.combatReport,
});
export const useCombatReportsQuery = combatReport.useListQuery;
export const useCombatReportQuery = combatReport.useDetailQuery;
export const useMarkReportReadMutation = combatReport.useMarkReadMutation;
export const useDeleteReportMutation = combatReport.useDeleteMutation;

const scoutReport = createReportHooks<ScoutReportResponse, ScoutReportResponse>(
  {
    listPath: "/combat/scout-reports",
    detailPath: (id) => `/combat/scout-report/${id}`,
    readPath: (id) => `/combat/scout-report/${id}/read`,
    deletePath: (id) => `/combat/scout-report/${id}`,
    listKey: queryKeys.scoutReports,
    detailKey: queryKeys.scoutReport,
  },
);
export const useScoutReportsQuery = scoutReport.useListQuery;
export const useScoutReportQuery = scoutReport.useDetailQuery;
export const useMarkScoutReportReadMutation = scoutReport.useMarkReadMutation;
export const useDeleteScoutReportMutation = scoutReport.useDeleteMutation;

const reinforcementReport = createReportHooks<
  ReinforcementReportResponse,
  ReinforcementReportResponse
>({
  listPath: "/combat/reinforcement-reports",
  detailPath: (id) => `/combat/reinforcement-report/${id}`,
  readPath: (id) => `/combat/reinforcement-report/${id}/read`,
  deletePath: (id) => `/combat/reinforcement-report/${id}`,
  listKey: queryKeys.reinforcementReports,
  detailKey: queryKeys.reinforcementReport,
});
export const useReinforcementReportsQuery = reinforcementReport.useListQuery;
export const useReinforcementReportQuery = reinforcementReport.useDetailQuery;
export const useMarkReinforcementReportReadMutation =
  reinforcementReport.useMarkReadMutation;
export const useDeleteReinforcementReportMutation =
  reinforcementReport.useDeleteMutation;

const caravanReport = createReportHooks<
  CaravanReportResponse,
  CaravanReportResponse
>({
  listPath: "/combat/caravan-reports",
  detailPath: (id) => `/combat/caravan-report/${id}`,
  readPath: (id) => `/combat/caravan-report/${id}/read`,
  deletePath: (id) => `/combat/caravan-report/${id}`,
  listKey: queryKeys.caravanReports,
  detailKey: queryKeys.caravanReport,
  parseList: (raw) => CaravanReportsResponseSchema.parse(raw),
  parseDetail: (raw) => CaravanReportResponseSchema.parse(raw),
});
export const useCaravanReportsQuery = caravanReport.useListQuery;
export const useCaravanReportQuery = caravanReport.useDetailQuery;
export const useMarkCaravanReportReadMutation =
  caravanReport.useMarkReadMutation;
export const useDeleteCaravanReportMutation = caravanReport.useDeleteMutation;

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

function invalidateCombatDispatchQueries(
  qc: QueryClient,
  villageId: string,
  userId: string | null,
  worldId: string | null,
): void {
  qc.invalidateQueries({ queryKey: queryKeys.armyInventory(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.activeExpeditions(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
  qc.invalidateQueries({ queryKey: queryKeys.population(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.villagePower(villageId) });
  qc.invalidateQueries({ queryKey: queryKeys.kingdomPowerPrefix(userId) });
}

function invalidateTroopMovementQueries(
  qc: QueryClient,
  villageIds: string[],
  userId: string | null,
  worldId: string | null,
): void {
  for (const vid of new Set(villageIds)) {
    qc.invalidateQueries({ queryKey: queryKeys.armyInventory(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.activeExpeditions(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.garrison(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.population(vid) });
    qc.invalidateQueries({ queryKey: queryKeys.villagePower(vid) });
  }
  qc.invalidateQueries({ queryKey: queryKeys.openExpeditions(userId, worldId) });
  qc.invalidateQueries({ queryKey: queryKeys.kingdomPowerPrefix(userId) });
}

interface AttackInput {
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: "PLAYER_VILLAGE" | "BARBARIAN_VILLAGE";
  targetRefId: string;
  units: Record<string, number>;
}

export function useInitiateAttackMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<unknown, Error, AttackInput>({
    mutationFn: ({
      villageId,
      targetX,
      targetY,
      targetKind,
      targetRefId,
      units,
    }) =>
      apiClient.post<unknown>("/combat/attack", {
        villageId,
        targetX,
        targetY,
        targetKind,
        targetRefId,
        units,
      }),
    onSettled: (_data, _err, { villageId }) => {
      invalidateCombatDispatchQueries(queryClient, villageId, userId, worldId);
    },
  });
}

export function useInitiateScoutMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<unknown, Error, AttackInput>({
    mutationFn: ({
      villageId,
      targetX,
      targetY,
      targetKind,
      targetRefId,
      units,
    }) =>
      apiClient.post<unknown>("/combat/scout", {
        villageId,
        targetX,
        targetY,
        targetKind,
        targetRefId,
        units,
      }),
    onSettled: (_data, _err, { villageId }) => {
      invalidateCombatDispatchQueries(queryClient, villageId, userId, worldId);
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
      const returnAt = expedition.returnAt
        ? Date.parse(String(expedition.returnAt))
        : undefined;
      store.update(
        expeditionId,
        current && returnAt
          ? current.phase === "RETURNING"
            ? { phase: "RETURNING", returnAt }
            : buildRecalledExpeditionPatch(current, Date.now(), returnAt)
          : {
              phase: "RETURNING",
              returnAt,
            },
      );
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activeExpeditions(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.openExpeditions(userId, worldId),
      });
    },
  });
}

export function useInitiateReinforceMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, ReinforcePayload>({
    mutationFn: ({ villageId, targetVillageId, units }) =>
      apiClient.post<Expedition>("/combat/reinforce", {
        villageId,
        targetVillageId,
        units,
      }),
    onSettled: (_data, _err, { villageId, targetVillageId }) => {
      invalidateTroopMovementQueries(
        queryClient,
        [villageId, targetVillageId],
        userId,
        worldId,
      );
    },
  });
}

export function useInitiateCaravanMutation(): UseMutationResult<
  Expedition,
  Error,
  CaravanPayload
> {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, CaravanPayload>({
    mutationFn: ({ villageId, targetVillageId, resources }) =>
      apiClient.post<Expedition>("/combat/caravan", {
        villageId,
        targetVillageId,
        resources,
      }),
    onSettled: (_data, _err, { villageId, targetVillageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(targetVillageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activeExpeditions(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.openExpeditions(userId, worldId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.villagePower(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.kingdomPowerPrefix(userId),
      });
    },
  });
}

export function useRecallReinforcementMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, RecallReinforcementPayload>({
    mutationFn: ({ villageId, originVillageId, units }) =>
      apiClient.post<Expedition>("/combat/recall", {
        villageId,
        originVillageId,
        units,
      }),
    onSettled: (_data, _err, { villageId, originVillageId }) => {
      invalidateTroopMovementQueries(
        queryClient,
        [villageId, originVillageId],
        userId,
        worldId,
      );
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
  return useMutation<
    UpgradeResponseDto,
    Error,
    UpgradeBuildingInput,
    UpgradeContext
  >({
    mutationFn: ({ villageId, buildingType }) =>
      apiClient.post<UpgradeResponseDto>(`/village/${villageId}/upgrade`, {
        buildingType,
      }),
    onMutate: async ({ villageId, buildingType }) => {
      const queueKey = queryKeys.queue(villageId);
      const resourcesKey = queryKeys.resources(villageId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queueKey }),
        queryClient.cancelQueries({ queryKey: resourcesKey }),
      ]);
      const previousQueue = queryClient.getQueryData<QueueEntryDto[]>(queueKey);
      const previousResources =
        queryClient.getQueryData<ResourcesPayload>(resourcesKey);

      const optimisticEntryId = `optimistic-${buildingType}-${Date.now()}`;
      const now = new Date();
      const optimisticEntry: QueueEntryDto = {
        id: optimisticEntryId,
        type: buildingType,
        level: 0,
        startTime: now.toISOString(),
        endTime: new Date(now.getTime() + 60_000).toISOString(),
      };

      queryClient.setQueryData<QueueEntryDto[]>(queueKey, (current = []) => [
        ...current,
        optimisticEntry,
      ]);

      return { previousQueue, previousResources, optimisticEntryId };
    },
    onError: (_err, { villageId }, context) => {
      if (!context) return;
      if (context.previousQueue !== undefined) {
        queryClient.setQueryData(
          queryKeys.queue(villageId),
          context.previousQueue,
        );
      }
      if (context.previousResources !== undefined) {
        queryClient.setQueryData(
          queryKeys.resources(villageId),
          context.previousResources,
        );
      }
    },
    onSettled: (_data, _err, { villageId, buildingType }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue(villageId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.buildings(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      if (buildingType === "CASTLE") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.myVillages(userId, worldId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.worldEntities(worldId),
        });
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
      if (!worldId) return Promise.reject(new Error("No world selected"));
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
    queryFn: async () => {
      if (!userId || !worldId)
        return Promise.reject(new Error("No world selected"));
      const raw = await apiClient.get<unknown>("/retention", {
        query: { worldId },
      });
      return RetentionSummarySchema.parse(raw);
    },
    enabled: Boolean(userId && worldId),
    refetchInterval: (query) =>
      query.state.data &&
      query.state.data.cards.some((card) => card.status !== "CLAIMED")
        ? 30_000
        : false,
    staleTime: 10_000,
  });
}

export function useOnboardingSummaryQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<OnboardingSummaryDto>({
    queryKey: queryKeys.onboardingSummary(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId)
        return Promise.reject(new Error("No world selected"));
      return apiClient.get<OnboardingSummaryDto>("/onboarding", {
        query: { worldId },
      });
    },
    enabled: Boolean(userId && worldId),
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
      apiClient.post<ClaimDailyCardResponse>(
        `/retention/cards/${cardId}/claim`,
        {
          villageId,
        } satisfies ClaimDailyCardRequest,
      ),
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.retentionSummary(userId, worldId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.myVillages(userId, worldId),
      });
    },
  });
}

export function useCancelConstructionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    CancelConstructionResponse,
    Error,
    CancelConstructionInput,
    CancelContext
  >({
    mutationFn: async ({ villageId, buildingId }) => {
      const raw = await apiClient.delete<unknown>(
        `/village/${villageId}/buildings/${buildingId}/cancel`,
      );
      return CancelConstructionResponseSchema.parse(raw);
    },
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
      queryClient.setQueryData(
        queryKeys.queue(villageId),
        context.previousQueue,
      );
    },
    onSuccess: (data) => {
      pushRefundToast("Construction annulée", data.refunded);
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queue(villageId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.buildings(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
    },
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
      // The endpoint replies 200 with an empty body when no intel exists; the
      // client yields `undefined` there, which TanStack Query forbids → null.
      const raw = await apiClient.get<unknown>(
        `/worlds/${worldId}/intel/${villageId}`,
      );
      return VillageIntelDtoSchema.nullable().parse(raw ?? null);
    },
    enabled: Boolean(worldId && villageId && enabled),
    staleTime: 30_000,
  });
}

export function useRenownQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<RenownStatus>({
    queryKey: queryKeys.renown(userId),
    queryFn: () => apiClient.get<RenownStatus>("/users/me/renown"),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

// Trust boundary: validate the cosmetic-awards payload with Zod before it enters
// the React Query cache, so an unknown `kind` or malformed item can't silently
// break the profile UI downstream. `kind` is pinned to the shared catalogue.
const CosmeticAwardResponseSchema = z.strictObject({
  kind: z.enum(COSMETIC_AWARD_KINDS),
  worldDisplayName: z.string(),
  awardedAt: z.string(),
}) satisfies z.ZodType<CosmeticAwardResponse>;

export function useCosmeticAwardsQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<CosmeticAwardResponse[]>({
    queryKey: queryKeys.cosmeticAwards(userId),
    queryFn: async () => {
      const raw = await apiClient.get<unknown>("/users/me/cosmetic-awards");
      return CosmeticAwardResponseSchema.array().parse(raw);
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  return () => {
    clearSession();
    resetGameSessionStores();
    gameSocket.disconnect();
    queryClient.clear();
  };
}
