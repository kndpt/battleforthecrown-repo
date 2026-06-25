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

// ---------------------------------------------------------------------------
// Weekly Glory cycles (run 068) — POWER is live and never cycles, so the cycle
// contract is restricted to the two Glory signals.
// ---------------------------------------------------------------------------

export const GlorySignalSchema = z.enum(["ASSAULT_GLORY", "RAMPART_GLORY"]);

/** One entry of a closed cycle's frozen leaderboard. */
export const RankingCycleSnapshotEntrySchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  score: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
});

/** Current (in-progress) cycle for a single Glory signal. */
export const RankingCycleCurrentSchema = z.object({
  signal: GlorySignalSchema,
  /** 1-based; `0` while the world is still in its pre-cycle. */
  cycleIndex: z.number().int().nonnegative(),
  cycleStartAt: z.string().datetime(),
  cycleEndAt: z.string().datetime(),
  /** Current leader of the live cycle window, or null if no scoring yet. */
  leaderUserId: z.string().nullable(),
  leaderName: z.string().nullable(),
  /** Top 3 of the most recently closed cycle, or null if none closed yet. */
  lastClosedSnapshot: z
    .object({
      cycleIndex: z.number().int().positive(),
      cycleEndAt: z.string().datetime(),
      topEntries: z.array(RankingCycleSnapshotEntrySchema),
    })
    .nullable(),
});

export const RankingCyclesCurrentResponseSchema = z.object({
  worldId: z.string(),
  cycles: z.array(RankingCycleCurrentSchema),
});

/** A temporary championship title owned by a player (run 068). */
export const RankingCycleTitleSchema = z.object({
  id: z.string(),
  signal: GlorySignalSchema,
  cycleIndex: z.number().int().positive(),
  worldId: z.string(),
  worldDisplayName: z.string(),
  label: z.string(),
  cycleEndAt: z.string().datetime(),
  validUntilAt: z.string().datetime(),
  awardedAt: z.string().datetime(),
  /** `validUntilAt > now` at serialization time. */
  active: z.boolean(),
});

export const RankingTitlesResponseSchema = z.array(RankingCycleTitleSchema);

export type GlorySignalDto = z.infer<typeof GlorySignalSchema>;
export type RankingCycleSnapshotEntry = z.infer<
  typeof RankingCycleSnapshotEntrySchema
>;
export type RankingCycleCurrent = z.infer<typeof RankingCycleCurrentSchema>;
export type RankingCyclesCurrentResponse = z.infer<
  typeof RankingCyclesCurrentResponseSchema
>;
export type RankingCycleTitle = z.infer<typeof RankingCycleTitleSchema>;
export type RankingTitlesResponse = z.infer<typeof RankingTitlesResponseSchema>;
