/**
 * Pure 2D path geometry helpers shared by expedition math and recall logic.
 * Pixi-agnostic so both `pixi/entities` and `lib` consumers can depend on it
 * without inverting the `pixi → lib` layering.
 */

export interface Point2 {
  x: number;
  y: number;
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
