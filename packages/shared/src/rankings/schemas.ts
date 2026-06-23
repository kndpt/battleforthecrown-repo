import { z } from "zod";
import { RANKING_SIGNALS } from "./consts";

export const RankingSignalSchema = z.enum(RANKING_SIGNALS);

export const RankingsPeriodSchema = z.enum([
  "LIVE",
  "WEEKLY",
  "ALL_TIME",
  // Frozen end-of-world snapshot served by GET /worlds/:worldId/rankings/final.
  "FINAL",
]);

export const RankingsLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  playerName: z.string(),
  score: z.number().int().nonnegative(),
  villageCount: z.number().int().nonnegative().optional(),
});

export const RankingsLeaderboardResponseSchema = z.object({
  worldId: z.string(),
  signal: RankingSignalSchema,
  period: RankingsPeriodSchema,
  label: z.string(),
  entries: z.array(RankingsLeaderboardEntrySchema),
});

export const RankingsSummaryResponseSchema = z.object({
  leaderboards: z.array(RankingsLeaderboardResponseSchema),
});

/**
 * One entry of a frozen final-ranking leaderboard (run 061 snapshot). Same
 * shape as a live entry but without the optional villageCount (the snapshot
 * only persists rank/score/user).
 */
export const WorldFinalRankingSnapshotEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  playerName: z.string(),
  score: z.number().int().nonnegative(),
});

export const WorldFinalRankingsResponseSchema = z.object({
  worldId: z.string(),
  /** ISO instant the snapshot was taken (LOCKED → ENDED transition). */
  snapshotAt: z.string().datetime(),
  leaderboards: z.array(RankingsLeaderboardResponseSchema),
});

export type RankingsLeaderboardEntry = z.infer<
  typeof RankingsLeaderboardEntrySchema
>;

export type RankingsPeriod = z.infer<typeof RankingsPeriodSchema>;

export type RankingsLeaderboardResponse = z.infer<
  typeof RankingsLeaderboardResponseSchema
>;

export type RankingsSummaryResponse = z.infer<
  typeof RankingsSummaryResponseSchema
>;

export type WorldFinalRankingSnapshotEntry = z.infer<
  typeof WorldFinalRankingSnapshotEntrySchema
>;

export type WorldFinalRankingsResponse = z.infer<
  typeof WorldFinalRankingsResponseSchema
>;
