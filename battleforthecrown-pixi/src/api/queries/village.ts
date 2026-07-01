import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  StrategyBonus,
  UpdateVillageLabelRequest,
  VillageLabel,
  VillageStrategyChangeCost,
  VillageStrategyDefinition,
  VillageStrategyType,
} from "@battleforthecrown/shared/village";
import { apiClient } from "../index";
import {
  CancelConstructionResponseSchema,
  type CancelConstructionResponse,
} from "../cancelResponses";
import type {
  BuildingDto,
  JoinedVillage,
  PopulationDto,
  QueueEntryDto,
  UpgradeResponseDto,
} from "../types";
import { pushRefundToast } from "../refundToast";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { queryKeys } from "./keys";
import { invalidateBuildingMutationQueries } from "./helpers";

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
      invalidateBuildingMutationQueries(queryClient, villageId);
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
      invalidateBuildingMutationQueries(queryClient, villageId);
    },
  });
}
