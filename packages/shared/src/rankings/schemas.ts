import { z } from "zod";

export const RankingSignalSchema = z.enum([
  "POWER",
  "ASSAULT_GLORY",
  "RAMPART_GLORY",
]);

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
