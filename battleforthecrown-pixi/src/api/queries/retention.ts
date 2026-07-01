import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RetentionSummarySchema,
  type ClaimDailyCardRequest,
  type ClaimDailyCardResponse,
  type RetentionSummaryDto,
} from "@battleforthecrown/shared/retention";
import {
  OnboardingSummarySchema,
  type OnboardingSummaryDto,
} from "@battleforthecrown/shared/onboarding";
import { apiClient } from "../index";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { queryKeys } from "./keys";

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
    queryFn: async () => {
      if (!userId || !worldId) throw new Error("No world selected");
      const raw = await apiClient.get("/onboarding", {
        query: { worldId },
      });
      return OnboardingSummarySchema.parse(raw);
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
