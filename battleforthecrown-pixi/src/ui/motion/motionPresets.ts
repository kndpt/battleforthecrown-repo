/**
 * Animation presets for the {@link Motion} primitive.
 *
 * Each value is a CSS `animation` shorthand that references a `@keyframes bftc-*`
 * defined in `src/index.css`. To add a preset:
 *   1. Declare `@keyframes bftc-<name>` in `src/index.css` (always `bftc-` prefixed).
 *   2. Add an entry below.
 *   3. Use it: `<Motion preset="<name>" />`.
 *
 * See `docs/ui-motion.md`.
 */
export const MOTION_PRESETS = {
  /** Periodic attention "wizz": a short shake burst, then idle, looping (~every 3s). */
  wizz: 'bftc-wizz 3.2s ease-in-out infinite',
  /** Gentle breathing scale, looping. */
  pulse: 'bftc-pulse 1.8s ease-in-out infinite',
  /** Quick continuous horizontal shake. */
  shake: 'bftc-shake 0.5s ease-in-out infinite',
} as const;

export type MotionPreset = keyof typeof MOTION_PRESETS;
