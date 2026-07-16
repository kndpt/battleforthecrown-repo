import type { ResourceType } from './types';

/**
 * Royal resource exchange — intra-village conversion of wood ↔ stone ↔ iron at a
 * deliberately unfavorable rate, with a daily cap. No crown conversion, no
 * inter-village or inter-player transfer (see `docs/gameplay/lab/tickets/12`).
 *
 * The rate is an unfavorable source:destination ratio: spend `RATE` units of the
 * source to receive 1 unit of the destination. Floor rounding on the credited
 * amount guarantees no free resource is ever minted on small amounts.
 */
export const RESOURCE_CONVERSION_RATE = 2;

/**
 * Maximum amount of a single **source** resource type that one village may
 * convert away per Paris day (reset 04:00 Europe/Paris). Tracked per resource
 * type, per village, per `dayKey`. Anti-snowball guardrail: caps the throughput
 * of the exchange so it unblocks stock imbalances without becoming an economy.
 */
export const RESOURCE_CONVERSION_DAILY_CAP = 5000;

/**
 * The three convertible resource types — never crowns. Declared as a `const`
 * tuple so it can seed both runtime checks and a Zod enum (single source of
 * truth for the whitelist).
 */
export const CONVERTIBLE_RESOURCE_TYPES = [
  'WOOD',
  'STONE',
  'IRON',
] as const satisfies readonly ResourceType[];

/**
 * Pure formula: destination amount credited when spending `sourceAmount` of a
 * source resource at `RESOURCE_CONVERSION_RATE`. Floor rounding — spending an
 * amount below the rate credits 0 (callers must reject that as wasteful).
 */
export function convertResourceAmount(sourceAmount: number): number {
  if (!Number.isFinite(sourceAmount) || sourceAmount <= 0) return 0;
  return Math.floor(sourceAmount / RESOURCE_CONVERSION_RATE);
}

/** Maps a `ResourceType` to its lowercase stock/amount key (`WOOD` → `wood`). */
export function resourceTypeToKey(
  type: ResourceType,
): 'wood' | 'stone' | 'iron' {
  switch (type) {
    case 'WOOD':
      return 'wood';
    case 'STONE':
      return 'stone';
    case 'IRON':
      return 'iron';
  }
}
