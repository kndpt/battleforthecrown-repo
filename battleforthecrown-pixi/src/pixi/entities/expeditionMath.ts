import type { ExpeditionPhase } from '@/stores/expeditions';
import { clamp01 } from '@/lib/math';
import { pathControl, pathPointAt, type Point2 } from '@/lib/pathGeometry';

export { pathControl, pathPointAt, type Point2 };

export interface ExpeditionTimeline {
  departAt: number;
  arrivalAt: number;
  returnAt?: number;
  phase: ExpeditionPhase;
}

export interface UnitProgress {
  /** Position along the path: 0 = origin, 1 = target. */
  t: number;
  /** Whether the unit is currently moving (drives sprite visibility). */
  moving: boolean;
  /** Whether the sprite is travelling back (target → origin). */
  returning: boolean;
}

export function computeProgress(timeline: ExpeditionTimeline, nowMs: number): UnitProgress {
  const phase = timeline.phase;
  if (phase === 'RETURNED') {
    return { t: 0, moving: false, returning: false };
  }

  if (phase === 'EN_ROUTE') {
    const total = timeline.arrivalAt - timeline.departAt;
    if (total <= 0) return { t: 1, moving: false, returning: false };
    const elapsed = nowMs - timeline.departAt;
    const t = clamp01(elapsed / total);
    return { t, moving: t < 1, returning: false };
  }

  if (phase === 'RESOLVED') {
    return { t: 1, moving: false, returning: false };
  }

  // RETURNING: unit slides back from target to origin between arrivalAt and returnAt
  const start = timeline.arrivalAt;
  const end = timeline.returnAt ?? timeline.arrivalAt;
  if (end <= start) {
    return { t: 0, moving: false, returning: true };
  }
  const elapsed = nowMs - start;
  const tBack = clamp01(elapsed / (end - start));
  return { t: 1 - tBack, moving: tBack < 1, returning: true };
}
