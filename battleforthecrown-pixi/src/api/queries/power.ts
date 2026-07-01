import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { z } from "zod";
import {
  PublicPlayerProfileResponseSchema,
  type PublicPlayerProfileResponse,
} from "@battleforthecrown/shared/world";
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
import { apiClient } from "../index";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { queryKeys } from "./keys";

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
    refetchInterval: 120_000,
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
