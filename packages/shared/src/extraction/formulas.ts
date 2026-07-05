import { EXTRACTION_RATE_PER_VILLAGER_PER_HOUR } from './constants';

const MS_PER_HOUR = 3_600_000;

export interface ComputeExtractedAmountParams {
  villagers: number;
  elapsedMs: number;
  remainingCapacity: number;
}

/**
 * Pure formula: resources extracted by a team of `villagers` over `elapsedMs`,
 * at `EXTRACTION_RATE_PER_VILLAGER_PER_HOUR`, clamped to `[0, remainingCapacity]`
 * so a site can never yield more than what is left.
 */
export function computeExtractedAmount({
  villagers,
  elapsedMs,
  remainingCapacity,
}: ComputeExtractedAmountParams): number {
  const raw = Math.floor(
    (villagers * EXTRACTION_RATE_PER_VILLAGER_PER_HOUR * elapsedMs) /
      MS_PER_HOUR,
  );
  return Math.min(Math.max(raw, 0), remainingCapacity);
}
