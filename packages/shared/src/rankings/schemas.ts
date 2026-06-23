import { z } from "zod";
import { RANKING_SIGNALS } from "./consts";

export const RankingSignalSchema = z.enum(RANKING_SIGNALS);

// Live leaderboard periods. The frozen end-of-world snapshot uses its own
// `period: "FINAL"` literal in WorldFinalRankingLeaderboardSchema below — it is
// deliberately kept out of this enum so the live contract can never emit FINAL.
export const RankingsPeriodSchema = z.enum(["LIVE", "WEEKLY", "ALL_TIME"]);

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

/**
 * One frozen final leaderboard. Deliberately stricter than the live
 * RankingsLeaderboardResponseSchema: `period` is the `FINAL` literal and entries
 * use WorldFinalRankingSnapshotEntrySchema (no `villageCount`). This pins the
 * public endpoint contract so any backend drift fails parse instead of slipping
 * through on the shared live schema.
 */
export const WorldFinalRankingLeaderboardSchema = z.object({
  worldId: z.string(),
  signal: RankingSignalSchema,
  period: z.literal("FINAL"),
  label: z.string(),
  entries: z.array(WorldFinalRankingSnapshotEntrySchema),
});

export const WorldFinalRankingsResponseSchema = z.object({
  worldId: z.string(),
  /** ISO instant the snapshot was taken (LOCKED → ENDED transition). */
  snapshotAt: z.string().datetime(),
  leaderboards: z.array(WorldFinalRankingLeaderboardSchema),
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

export type WorldFinalRankingLeaderboard = z.infer<
  typeof WorldFinalRankingLeaderboardSchema
>;

export type WorldFinalRankingsResponse = z.infer<
  typeof WorldFinalRankingsResponseSchema
>;
