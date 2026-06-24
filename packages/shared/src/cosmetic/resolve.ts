import { SIGNAL_TO_COSMETIC_AWARD_KIND } from "./consts";
import type { CosmeticAwardKind, CosmeticSourceSignal } from "./types";

/** One row of a world's final ranking snapshot, restricted to what resolution needs. */
export interface FinalRankingSnapshotRow {
  userId: string;
  signal: CosmeticSourceSignal;
  rank: number;
  score: number;
}

export interface ResolvedCosmeticAward {
  userId: string;
  kind: CosmeticAwardKind;
}

/**
 * Pure resolution of the cosmetic championship awards from a world's final
 * ranking snapshot. One award per signal, given to the rank-1 player.
 *
 * Rules (spec 19 § Wipe / 24 § Rewards):
 * - Only `rank === 1` rows yield an award. The snapshot (run 061) breaks ties
 *   deterministically (rank = index + 1, tie-break by userId), so there is at
 *   most one rank-1 row per signal; a "shared rank 1" never occurs and the
 *   "all ties rewarded" rule is vacuously satisfied.
 * - A glory champion with `score === 0` (no PvP at all this world) gets NO
 *   title — an empty triumph is not a triumph. POWER is exempt: a rank-1
 *   kingdom always has `score > 0` (≥ 1 Castle), so the guard is a no-op there.
 */
export function resolveCosmeticAwards(
  rows: ReadonlyArray<FinalRankingSnapshotRow>,
): ResolvedCosmeticAward[] {
  return rows
    .filter((row) => row.rank === 1)
    .filter((row) => row.signal === "POWER" || row.score > 0)
    .map((row) => ({
      userId: row.userId,
      kind: SIGNAL_TO_COSMETIC_AWARD_KIND[row.signal],
    }));
}
