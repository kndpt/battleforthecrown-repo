import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { RenownStatusSchema, type RenownStatus } from "@battleforthecrown/shared";
import type { CosmeticAwardResponse } from "@battleforthecrown/shared";
import { COSMETIC_AWARD_KINDS } from "@battleforthecrown/shared";
import {
  MyFriendshipsResponseSchema,
  type CreateFriendshipBody,
  type FriendshipDto,
  type MyFriendshipsResponse,
} from "@battleforthecrown/shared/social";
import { apiClient } from "../index";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { queryKeys } from "./keys";

export function useRenownQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<RenownStatus>({
    queryKey: queryKeys.renown(userId),
    queryFn: async () => {
      const raw = await apiClient.get("/users/me/renown");
      return RenownStatusSchema.parse(raw);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

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

/**
 * Defensive-friends list for the current player on the active world. The three
 * buckets (`active` / `pendingIn` / `pendingOut`) are owned server-side; the
 * frontend only renders them. Cap enforcement (5 ACTIVE) lives on the backend.
 */
export function useMyFriendshipsQuery() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useQuery<MyFriendshipsResponse>({
    queryKey: queryKeys.myFriendships(userId, worldId),
    queryFn: async () => {
      if (!userId || !worldId) throw new Error("No auth or world");
      const raw = await apiClient.get(
        `/worlds/${worldId}/friendships/me`,
      );
      return MyFriendshipsResponseSchema.parse(raw);
    },
    enabled: Boolean(userId && worldId),
    staleTime: 30_000,
  });
}

export function useCreateFriendshipMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<FriendshipDto, Error, CreateFriendshipBody>({
    mutationFn: (body) => {
      if (!worldId) throw new Error("No world selected");
      return apiClient.post<FriendshipDto>(
        `/worlds/${worldId}/friendships`,
        body,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myFriendships(userId, worldId),
      });
    },
  });
}

export function useAcceptFriendshipMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<FriendshipDto, Error, { friendshipId: string }>({
    mutationFn: ({ friendshipId }) => {
      if (!worldId) throw new Error("No world selected");
      return apiClient.post<FriendshipDto>(
        `/worlds/${worldId}/friendships/${friendshipId}/accept`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myFriendships(userId, worldId),
      });
    },
  });
}

export function useDeleteFriendshipMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<void, Error, { friendshipId: string }>({
    mutationFn: ({ friendshipId }) => {
      if (!worldId) throw new Error("No world selected");
      return apiClient.delete<void>(
        `/worlds/${worldId}/friendships/${friendshipId}`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myFriendships(userId, worldId),
      });
    },
  });
}
