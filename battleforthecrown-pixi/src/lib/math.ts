/** Pure numeric clamping helpers shared across UI and Pixi math. */

/** Clamp a value to the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Clamp a value to the [0, 1] range. */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
