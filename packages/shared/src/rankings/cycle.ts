import { MS_PER_DAY } from "../time";
import type { GlorySignal } from "./consts";

/** Milliseconds in a weekly Glory cycle. */
export const MS_PER_WEEKLY_CYCLE = 7 * MS_PER_DAY;

/** Default weekly cycle reset boundary: Monday 00:00 UTC (run 068). */
export const WEEKLY_CYCLE_DEFAULT_RESET_DAY_UTC = 1; // 0=Sun … 1=Mon … 6=Sat
export const WEEKLY_CYCLE_DEFAULT_RESET_HOUR_UTC = 0;
/** Default number of top entries persisted in a cycle snapshot. */
export const DEFAULT_SNAPSHOT_ENTRIES_PER_CYCLE = 20;

/** Reset-boundary configuration for a world's weekly Glory cycle. */
export interface CycleResetConfig {
  /** UTC day of week the cycle resets on (0=Sun … 6=Sat). */
  resetDayUtc: number;
  /** UTC hour the cycle resets at (0..23). */
  resetHourUtc: number;
}

export const DEFAULT_CYCLE_RESET_CONFIG: CycleResetConfig = {
  resetDayUtc: WEEKLY_CYCLE_DEFAULT_RESET_DAY_UTC,
  resetHourUtc: WEEKLY_CYCLE_DEFAULT_RESET_HOUR_UTC,
};

export interface CycleBoundaries {
  /** Inclusive start of the cycle window. */
  cycleStartAt: Date;
  /** Exclusive end of the cycle window (= next cycle's start). */
  cycleEndAt: Date;
}

/**
 * First reset boundary on or after `worldCreatedAt` — the start of `cycleIndex 1`.
 *
 * The boundary is **inclusive**: a world created exactly at the reset instant
 * (e.g. Monday 00:00 UTC) opens its first cycle immediately. A world created at
 * any other time waits for the next reset; the gap before it (0 to <7 days) is
 * the "pre-cycle" and is never snapshotted.
 */
export function computeFirstCycleStart(
  worldCreatedAt: Date,
  config: CycleResetConfig = DEFAULT_CYCLE_RESET_CONFIG,
): Date {
  const base = new Date(
    Date.UTC(
      worldCreatedAt.getUTCFullYear(),
      worldCreatedAt.getUTCMonth(),
      worldCreatedAt.getUTCDate(),
      config.resetHourUtc,
      0,
      0,
      0,
    ),
  );
  const deltaDays = (config.resetDayUtc - base.getUTCDay() + 7) % 7;
  let candidate = new Date(base.getTime() + deltaDays * MS_PER_DAY);
  // The reset moment on the created-at day may already be in the past relative
  // to creation (e.g. created Monday 12:00, reset Monday 00:00) → next week.
  if (candidate.getTime() < worldCreatedAt.getTime()) {
    candidate = new Date(candidate.getTime() + MS_PER_WEEKLY_CYCLE);
  }
  return candidate;
}

/**
 * Boundaries of a given 1-based `cycleIndex` for a world. `cycleIndex 1` is the
 * window `[firstCycleStart, firstCycleStart + 1 week)`.
 */
export function computeCycleBoundaries(
  worldCreatedAt: Date,
  cycleIndex: number,
  config: CycleResetConfig = DEFAULT_CYCLE_RESET_CONFIG,
): CycleBoundaries {
  const first = computeFirstCycleStart(worldCreatedAt, config);
  const cycleStartAt = new Date(
    first.getTime() + (cycleIndex - 1) * MS_PER_WEEKLY_CYCLE,
  );
  const cycleEndAt = new Date(cycleStartAt.getTime() + MS_PER_WEEKLY_CYCLE);
  return { cycleStartAt, cycleEndAt };
}

/**
 * 1-based index of the cycle that contains `now`, or `0` if `now` is still in
 * the pre-cycle (before the first reset boundary).
 */
export function currentCycleIndex(
  worldCreatedAt: Date,
  now: Date,
  config: CycleResetConfig = DEFAULT_CYCLE_RESET_CONFIG,
): number {
  const first = computeFirstCycleStart(worldCreatedAt, config).getTime();
  if (now.getTime() < first) return 0;
  return Math.floor((now.getTime() - first) / MS_PER_WEEKLY_CYCLE) + 1;
}

/**
 * Index of the latest cycle that has fully elapsed (`cycleEndAt <= now`) and is
 * therefore due for closing — or `0` if none has closed yet. A single tick can
 * thus catch up an arbitrary number of missed cycles by closing every index in
 * `[lastSnapshotted + 1, latestDueCycleIndex]`.
 */
export function latestDueCycleIndex(
  worldCreatedAt: Date,
  now: Date,
  config: CycleResetConfig = DEFAULT_CYCLE_RESET_CONFIG,
): number {
  const first = computeFirstCycleStart(worldCreatedAt, config).getTime();
  if (now.getTime() < first) return 0;
  return Math.floor((now.getTime() - first) / MS_PER_WEEKLY_CYCLE);
}

/** One player's aggregated score over a cycle window. */
export interface CycleScoreEntry {
  userId: string;
  score: number;
}

/**
 * Rank-1 champions of a cycle. Returns every user tied for the top score
 * (shared rank 1 ⇒ all rewarded). A top score of `0` (no PvP this cycle) yields
 * no champion — an empty triumph is not a triumph (spec 24 § Rewards).
 */
export function resolveCycleChampions(
  entries: ReadonlyArray<CycleScoreEntry>,
): string[] {
  let max = 0;
  for (const entry of entries) {
    if (entry.score > max) max = entry.score;
  }
  if (max <= 0) return [];
  return entries.filter((entry) => entry.score === max).map((e) => e.userId);
}

/** FR title prefix per Glory signal. */
export const RANKING_CYCLE_TITLE_LABELS: Record<GlorySignal, string> = {
  ASSAULT_GLORY: "Champion d'Assaut",
  RAMPART_GLORY: "Champion du Rempart",
};

/** `Champion d'Assaut · Semaine 3 · Avalon`. */
export function formatRankingCycleTitleLabel(
  signal: GlorySignal,
  cycleIndex: number,
  worldDisplayName: string,
): string {
  return `${RANKING_CYCLE_TITLE_LABELS[signal]} · Semaine ${cycleIndex} · ${worldDisplayName}`;
}
