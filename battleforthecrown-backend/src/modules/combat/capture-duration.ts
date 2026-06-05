import { MS_PER_HOUR } from '@battleforthecrown/shared/time';
import { TempoService, type WorldTempo } from '@battleforthecrown/shared/world';

export const BARBARIAN_CAPTURE_DURATIONS_MS: Record<string, number> = {
  T1: 0.5 * MS_PER_HOUR,
  T2: 1 * MS_PER_HOUR,
  T3: 1.5 * MS_PER_HOUR,
  T4: 2.25 * MS_PER_HOUR,
  T5: 3 * MS_PER_HOUR,
};

export const PVP_CAPTURE_DURATIONS_MS = [
  { minCastleLevel: 9, durationMs: 4.5 * MS_PER_HOUR },
  { minCastleLevel: 7, durationMs: 3 * MS_PER_HOUR },
  { minCastleLevel: 5, durationMs: 2.25 * MS_PER_HOUR },
  { minCastleLevel: 3, durationMs: 1.5 * MS_PER_HOUR },
  { minCastleLevel: 1, durationMs: 1 * MS_PER_HOUR },
] as const;

const MIN_CAPTURE_DURATION_MS = 1000;

function getPvpCaptureDurationMs(castleLevel?: number | null): number {
  if (castleLevel == null) {
    throw new Error(
      'castleLevel is required for player-village capture duration',
    );
  }

  return (
    PVP_CAPTURE_DURATIONS_MS.find(
      (entry) => castleLevel >= entry.minCastleLevel,
    )?.durationMs ?? PVP_CAPTURE_DURATIONS_MS.at(-1)!.durationMs
  );
}

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
    : getPvpCaptureDurationMs(castleLevel);

  return Math.max(
    MIN_CAPTURE_DURATION_MS,
    Math.round(
      TempoService.applyDuration(baseDurationMs, tempo, 'captureWindow'),
    ),
  );
}
