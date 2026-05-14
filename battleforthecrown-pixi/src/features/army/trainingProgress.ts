import type { ArmyTrainingDto } from '@/api/queries';

export interface UnitTrainingProgress {
  currentUnitRemainingMs: number;
  displayedCompletedQty: number;
  finishedAtMs: number;
  percent: number;
  totalRemainingMs: number;
}

export function computeUnitTrainingProgress(
  training: Pick<ArmyTrainingDto, 'completedQty' | 'createdAt' | 'timePerUnitMs' | 'totalQty'>,
  nowMs: number,
): UnitTrainingProgress {
  const perUnitMs = Math.max(1, training.timePerUnitMs);
  const totalQty = Math.max(0, training.totalQty);
  const totalDurationMs = totalQty * perUnitMs;
  const startedAtMs = Date.parse(training.createdAt);

  if (!Number.isFinite(startedAtMs) || totalDurationMs <= 0) {
    return {
      currentUnitRemainingMs: 0,
      displayedCompletedQty: Math.max(0, training.completedQty),
      finishedAtMs: Number.isFinite(startedAtMs) ? startedAtMs : nowMs,
      percent: 0,
      totalRemainingMs: 0,
    };
  }

  const elapsedMs = Math.min(totalDurationMs, Math.max(0, nowMs - startedAtMs));
  const totalRemainingMs = totalDurationMs - elapsedMs;
  const elapsedUnits = Math.floor(elapsedMs / perUnitMs);

  return {
    currentUnitRemainingMs:
      totalRemainingMs === 0 ? 0 : perUnitMs - (elapsedMs % perUnitMs),
    displayedCompletedQty: Math.min(
      totalQty,
      Math.max(training.completedQty, elapsedUnits),
    ),
    finishedAtMs: startedAtMs + totalDurationMs,
    percent: Math.min(100, (elapsedMs / totalDurationMs) * 100),
    totalRemainingMs,
  };
}
