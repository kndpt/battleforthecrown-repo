import type { ArmyTrainingDto } from '@/api/queries';

export interface UnitTrainingProgress {
  currentUnitRemainingMs: number;
  displayedCompletedQty: number;
  finishedAtMs: number;
  percent: number;
  totalRemainingMs: number;
}

export function computeUnitTrainingProgress(
  training: Pick<
    ArmyTrainingDto,
    'completedQty' | 'createdAt' | 'nextUnitEta' | 'timePerUnitMs' | 'totalQty'
  >,
  nowMs: number,
): UnitTrainingProgress {
  const perUnitMs = Math.max(1, training.timePerUnitMs);
  const totalQty = Math.max(0, training.totalQty);
  const completedQty = Math.min(totalQty, Math.max(0, training.completedQty));
  const pendingQty = Math.max(0, totalQty - completedQty);
  const startedAtMs = Date.parse(training.createdAt);
  const nextUnitEtaMs = Date.parse(training.nextUnitEta);

  if (!Number.isFinite(startedAtMs) || totalQty <= 0) {
    return {
      currentUnitRemainingMs: 0,
      displayedCompletedQty: completedQty,
      finishedAtMs: Number.isFinite(startedAtMs) ? startedAtMs : nowMs,
      percent: 0,
      totalRemainingMs: 0,
    };
  }

  if (pendingQty === 0) {
    const finishedAtMs = Number.isFinite(nextUnitEtaMs)
      ? nextUnitEtaMs
      : startedAtMs + totalQty * perUnitMs;
    return {
      currentUnitRemainingMs: 0,
      displayedCompletedQty: completedQty,
      finishedAtMs,
      percent: 100,
      totalRemainingMs: 0,
    };
  }

  const elapsedSinceStartMs = Math.max(0, nowMs - startedAtMs);
  const fallbackCurrentUnitElapsedMs =
    elapsedSinceStartMs === 0 ? 0 : elapsedSinceStartMs % perUnitMs;
  const currentUnitRemainingMs = Number.isFinite(nextUnitEtaMs)
    ? Math.max(0, nextUnitEtaMs - nowMs)
    : perUnitMs - fallbackCurrentUnitElapsedMs;
  const currentUnitElapsedMs = perUnitMs - Math.min(perUnitMs, currentUnitRemainingMs);
  const totalRemainingMs = currentUnitRemainingMs + (pendingQty - 1) * perUnitMs;
  const finishedAtMs = Number.isFinite(nextUnitEtaMs)
    ? nextUnitEtaMs + (pendingQty - 1) * perUnitMs
    : startedAtMs + totalQty * perUnitMs;
  const progressUnits = completedQty + currentUnitElapsedMs / perUnitMs;

  return {
    currentUnitRemainingMs,
    displayedCompletedQty: completedQty,
    finishedAtMs,
    percent: Math.min(99.5, (progressUnits / totalQty) * 100),
    totalRemainingMs,
  };
}
