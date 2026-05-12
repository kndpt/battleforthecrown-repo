import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface WorldEntityTooltipProps {
  /** Screen-space pixel anchor (returned by Pixi handle.worldToScreen). */
  screenPosition: { x: number; y: number };
  children: ReactNode;
}

const PADDING = 12;

/**
 * Floating panel anchored to a Pixi entity's current screen position. Picks the
 * best edge (above / below / left / right) so it stays inside the viewport.
 * Mirrors the legacy `WorldEntityTooltip` behaviour without canvas2d quirks.
 */
export function WorldEntityTooltip({ screenPosition, children }: WorldEntityTooltipProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = rect.width || 280;
    const h = rect.height || 200;

    // Default: right of the entity, vertically centred.
    let left = screenPosition.x + 24;
    let top = screenPosition.y - h / 2;

    // Flip to the left if it doesn't fit on the right.
    if (left + w + PADDING > vw) {
      left = screenPosition.x - w - 24;
    }
    // Clamp horizontally.
    left = Math.max(PADDING, Math.min(vw - w - PADDING, left));
    // Clamp vertically.
    top = Math.max(PADDING, Math.min(vh - h - PADDING, top));

    setPos({ left, top });
  }, [screenPosition.x, screenPosition.y]);

  return (
    <div
      ref={ref}
      className="pointer-events-auto fixed z-30 max-w-none"
      style={{ left: pos.left, top: pos.top }}
    >
      {children}
    </div>
  );
}
