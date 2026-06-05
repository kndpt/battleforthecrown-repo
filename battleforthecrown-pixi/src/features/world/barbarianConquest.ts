import { MS_PER_HOUR } from '@battleforthecrown/shared/time';
import type { WorldTier } from '@battleforthecrown/shared/world';

export const BARBARIAN_CAPTURE_DURATION_HOURS: Record<WorldTier, number> = {
  T1: 2,
  T2: 4,
  T3: 6,
  T4: 9,
  T5: 12,
};

export function getBarbarianCaptureDurationMs(
  tier: WorldTier | null | undefined,
): number | null {
  if (!tier) return null;
  return BARBARIAN_CAPTURE_DURATION_HOURS[tier] * MS_PER_HOUR;
}

export function formatBarbarianCaptureDuration(ms: number | null): string | null {
  if (ms === null) return null;
  const hours = ms / MS_PER_HOUR;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export function getBarbarianCaptureDurationLabel(
  tier: WorldTier | null | undefined,
): string | null {
  return formatBarbarianCaptureDuration(getBarbarianCaptureDurationMs(tier));
}
