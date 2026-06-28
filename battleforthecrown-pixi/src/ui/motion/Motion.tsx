import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { MOTION_PRESETS, type MotionPreset } from './motionPresets';

export interface MotionProps {
  /** Which animation to play. See {@link MOTION_PRESETS}. */
  preset: MotionPreset;
  /** When false, no animation is applied. Defaults to true. */
  active?: boolean;
  /** Element to render. Defaults to `span`. */
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Generic, plug-and-play animation wrapper. Pick an effect with `preset` and
 * gate it with `active`. Honors `prefers-reduced-motion` via the `bftc-motion`
 * class (see `src/index.css`).
 *
 * ```tsx
 * <Motion preset="wizz" active={hasPendingTasks}>
 *   <CrownIcon />
 * </Motion>
 * ```
 */
export function Motion({
  preset,
  active = true,
  as: Tag = 'span',
  children,
  className,
  style,
}: MotionProps) {
  return (
    <Tag
      className={cn('bftc-motion inline-flex', className)}
      style={{ ...style, animation: active ? MOTION_PRESETS[preset] : undefined }}
    >
      {children}
    </Tag>
  );
}
