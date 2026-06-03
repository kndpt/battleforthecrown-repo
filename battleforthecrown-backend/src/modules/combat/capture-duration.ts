import { TempoService, type WorldTempo } from '@battleforthecrown/shared/world';

const HOUR_MS = 60 * 60 * 1000;

export const BARBARIAN_CAPTURE_DURATIONS_MS: Record<string, number> = {
  T1: 0.5 * HOUR_MS,
  T2: 1 * HOUR_MS,
  T3: 1.5 * HOUR_MS,
  T4: 2.25 * HOUR_MS,
  T5: 3 * HOUR_MS,
};

export const PVP_CAPTURE_DURATIONS_MS = [
  { minCastleLevel: 9, durationMs: 4.5 * HOUR_MS },
  { minCastleLevel: 7, durationMs: 3 * HOUR_MS },
  { minCastleLevel: 5, durationMs: 2.25 * HOUR_MS },
  { minCastleLevel: 3, durationMs: 1.5 * HOUR_MS },
  { minCastleLevel: 1, durationMs: 1 * HOUR_MS },
] as const;

const MIN_CAPTURE_DURATION_MS = 1000;

export function getCaptureDurationMs({
  castleLevel,
  isBarbarian,
  tempo,
  tier,
}: {
  castleLevel?: number | null;
  isBarbarian: boolean;
  tempo: WorldTempo;
  tier?: string | null;
}): number {
  const baseDurationMs = isBarbarian
    ? (BARBARIAN_CAPTURE_DURATIONS_MS[tier ?? ''] ??
      BARBARIAN_CAPTURE_DURATIONS_MS.T1)
    : (PVP_CAPTURE_DURATIONS_MS.find(
        (entry) => (castleLevel ?? 1) >= entry.minCastleLevel,
      )?.durationMs ?? PVP_CAPTURE_DURATIONS_MS.at(-1)!.durationMs);

  return Math.max(
    MIN_CAPTURE_DURATION_MS,
    Math.round(
      TempoService.applyDuration(baseDurationMs, tempo, 'captureWindow'),
    ),
  );
}
