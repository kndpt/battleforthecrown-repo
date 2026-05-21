import { calculateTrainingTime } from '@battleforthecrown/shared/logic';
import { MS_PER_SECOND } from '@battleforthecrown/shared/time';
import { getBarracksTrainingSpeedMultiplier } from '@battleforthecrown/shared/village/buildings';
import { TempoService } from '@battleforthecrown/shared/world';

interface EffectiveTrainingDurationInput {
  unitTimeSeconds: number;
  worldTempo?: Parameters<typeof TempoService.applyDuration>[1] | null;
  barracksLevel: number;
}

export function getEffectiveUnitTrainingDurationSeconds({
  unitTimeSeconds,
  worldTempo,
  barracksLevel,
}: EffectiveTrainingDurationInput): number {
  const barracksMultiplier =
    getBarracksTrainingSpeedMultiplier(barracksLevel);
  const trainingDurationMs = calculateTrainingTime(
    unitTimeSeconds,
    1,
    barracksMultiplier,
  );

  const durationMs = worldTempo
    ? TempoService.applyDuration(
        trainingDurationMs,
        worldTempo,
        'unitTrainingSpeed',
      )
    : trainingDurationMs;
  const effectiveDurationMs = Math.max(MS_PER_SECOND, Math.round(durationMs));
  return effectiveDurationMs / MS_PER_SECOND;
}
