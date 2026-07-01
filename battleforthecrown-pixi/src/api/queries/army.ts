import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CancelTrainingResponseSchema,
  type CancelTrainingResponse,
} from "../cancelResponses";
import { apiClient } from "../index";
import { pushRefundToast } from "../refundToast";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { queryKeys } from "./keys";
import { invalidateArmyMutationQueries } from "./helpers";

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

export const armyTrainingQueryOptions = (villageId: string | null) =>
  queryOptions({
    queryKey: queryKeys.armyTraining(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as ArmyTrainingDto[]);
      return apiClient.get<ArmyTrainingDto[]>(`/army/${villageId}/training`);
    },
    enabled: Boolean(villageId),
    staleTime: 2_000,
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
      invalidateArmyMutationQueries(queryClient, villageId);
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
      invalidateArmyMutationQueries(queryClient, villageId);
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
      invalidateArmyMutationQueries(queryClient, villageId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.crowns(userId, worldId),
      });
    },
  });
}
