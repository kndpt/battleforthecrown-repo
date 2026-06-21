import { MS_PER_HOUR } from '@battleforthecrown/shared/time';
import { TempoService, type WorldTempo } from '@battleforthecrown/shared/world';
import {
  getPvpCaptureDurationMs,
  PVP_CAPTURE_DURATIONS_MS,
} from '@battleforthecrown/shared/combat';

// Source de vérité unique de la courbe PvP : `packages/shared/src/combat/capture-duration.ts`.
// Ré-exportée pour les consommateurs backend existants (worker, tests).
export { PVP_CAPTURE_DURATIONS_MS };

export const BARBARIAN_CAPTURE_DURATIONS_MS: Record<string, number> = {
  T1: 0.5 * MS_PER_HOUR,
  T2: 1 * MS_PER_HOUR,
  T3: 1.5 * MS_PER_HOUR,
  T4: 2.25 * MS_PER_HOUR,
  T5: 3 * MS_PER_HOUR,
};

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
    : getPvpCaptureDurationMs(castleLevel);

  return Math.max(
    MIN_CAPTURE_DURATION_MS,
    Math.round(
      TempoService.applyDuration(baseDurationMs, tempo, 'captureWindow'),
    ),
  );
}
