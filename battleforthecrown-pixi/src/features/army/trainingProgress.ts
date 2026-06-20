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
  // Sequential queue (backend run 062): only the head row is actually training.
  // Waiting rows persist a placeholder `nextUnitEta` that would otherwise make
  // them appear to tick down immediately — so they are rendered as "not started"
  // (0%, full duration remaining) until the backend promotes them to head.
  isActive = true,
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

  if (!isActive && pendingQty > 0) {
    // Queued behind the head: hasn't started, full duration still ahead.
    const totalRemainingMs = pendingQty * perUnitMs;
    return {
      currentUnitRemainingMs: perUnitMs,
      displayedCompletedQty: completedQty,
      finishedAtMs: nowMs + totalRemainingMs,
      percent: 0,
      totalRemainingMs,
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
