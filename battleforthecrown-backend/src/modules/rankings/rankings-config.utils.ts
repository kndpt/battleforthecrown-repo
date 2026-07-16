import { RankingSignal } from '@prisma/client';
import {
  DEFAULT_WORLD_RANKINGS_CONFIG,
  WorldConfigSchema,
} from '@battleforthecrown/shared/world';
import type { CycleResetConfig } from '@battleforthecrown/shared/rankings';

/**
 * Ordered pair of Glory ranking signals, in leaderboard display order
 * (assault before rampart). Shared by the cycle worker and the summary
 * builder so a new Glory signal is wired in exactly one place.
 */
export const GLORY_SIGNALS: RankingSignal[] = [
  RankingSignal.ASSAULT_GLORY,
  RankingSignal.RAMPART_GLORY,
];

/** Reset config + snapshot size resolved from a world's (possibly partial) config. */
export function resolveRankingsConfig(config: unknown): {
  reset: CycleResetConfig;
  snapshotEntries: number;
} {
  const parsed = WorldConfigSchema.safeParse(config);
  const rankings = parsed.success
    ? parsed.data.rankings
    : DEFAULT_WORLD_RANKINGS_CONFIG;
  return {
    reset: {
      resetDayUtc: rankings.weeklyCycleResetDayUtc,
      resetHourUtc: rankings.weeklyCycleResetHourUtc,
    },
    snapshotEntries: rankings.snapshotEntriesPerCycle,
  };
}
