import { TempoService, type WorldTempo } from '@battleforthecrown/shared/world';
import {
  BARBARIAN_CAPTURE_DURATIONS_MS,
  getPvpCaptureDurationMs,
  PVP_CAPTURE_DURATIONS_MS,
} from '@battleforthecrown/shared/combat';

// Source de vérité unique des courbes de capture (PvP + barbare) :
// `packages/shared/src/combat/capture-duration.ts`. Ré-exportées pour les
// consommateurs backend existants (worker, tests).
export { BARBARIAN_CAPTURE_DURATIONS_MS, PVP_CAPTURE_DURATIONS_MS };

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
