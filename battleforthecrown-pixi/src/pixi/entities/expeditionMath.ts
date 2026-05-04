import type { ExpeditionPhase } from '@/stores/expeditions';

export interface Point2 {
  x: number;
  y: number;
}

export interface ExpeditionTimeline {
  departAt: number;
  arrivalAt: number;
  returnAt?: number;
  phase: ExpeditionPhase;
}

/** Quadratic Bézier control point at 25% perpendicular offset from the midpoint. */
export function pathControl(origin: Point2, target: Point2): Point2 {
  const mid = { x: (origin.x + target.x) / 2, y: (origin.y + target.y) / 2 };
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return mid;
  const nx = -dy / length;
  const ny = dx / length;
  const offset = length * 0.25;
  return { x: mid.x + nx * offset, y: mid.y + ny * offset };
}

/** Quadratic Bézier point at parameter t ∈ [0,1]. */
export function pathPointAt(origin: Point2, control: Point2, target: Point2, t: number): Point2 {
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * origin.x + 2 * oneMinusT * t * control.x + t * t * target.x,
    y: oneMinusT * oneMinusT * origin.y + 2 * oneMinusT * t * control.y + t * t * target.y,
  };
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

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
