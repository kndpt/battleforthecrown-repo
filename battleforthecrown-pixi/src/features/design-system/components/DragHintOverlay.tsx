import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '@/lib/cn';

export interface DragHintOverlayProps {
  /**
   * CSS selector for the source element, resolved within the overlay's
   * positioned parent (the nearest ancestor with `position: relative`).
   */
  fromSelector: string;
  /** Ref to the target/drop element the ghost travels toward. */
  toRef: RefObject<HTMLElement | null>;
  /** Moving ghost visual (e.g. a troop chip). Centered on the animated point. */
  children: ReactNode;
  /** Render a trailing finger halo under the ghost. */
  showHalo?: boolean;
  /** Loop duration in ms. */
  durationMs?: number;
  className?: string;
}

interface HintPath {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

/**
 * Generic onboarding coachmark: animates `children` in a loop from a source
 * element to a target element to teach a drag gesture.
 *
 * Robustness: the path is measured relative to the overlay's *own* node, which
 * React attaches before this component's layout effect runs — unlike an
 * ancestor ref, which is attached only after descendant effects (so an
 * ancestor-based origin reads null on first mount and the hint never appears
 * until a resize). See docs/ui-onboarding-hints.md.
 */
export function DragHintOverlay({
  children,
  className,
  durationMs = 2400,
  fromSelector,
  showHalo = false,
  toRef,
}: DragHintOverlayProps) {
  const selfRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<HintPath | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const self = selfRef.current;
      const to = toRef.current;
      const from = self?.parentElement?.querySelector<HTMLElement>(fromSelector);
      if (!self || !to || !from) return;
      const origin = self.getBoundingClientRect();
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      setPath({
        fromX: fromRect.left + fromRect.width / 2 - origin.left,
        fromY: fromRect.top + fromRect.height / 2 - origin.top,
        toX: toRect.left + toRect.width / 2 - origin.left,
        toY: toRect.top + toRect.height / 2 - origin.top,
      });
    };

    // Synchronous measure works (self node is already attached). The rAF pass
    // re-measures after late layout shifts (images/fonts loading).
    measure();
    const raf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(measure)
        : 0;
    window.addEventListener('resize', measure);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [fromSelector, toRef]);

  const pathStyle = path
    ? ({
        '--bftc-hint-from-x': `${path.fromX}px`,
        '--bftc-hint-from-y': `${path.fromY}px`,
        '--bftc-hint-to-x': `${path.toX}px`,
        '--bftc-hint-to-y': `${path.toY}px`,
        animationDuration: `${durationMs}ms`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-[34] overflow-hidden',
        className,
      )}
      data-drag-hint="true"
      ref={selfRef}
    >
      {path ? (
        <div
          className="absolute left-0 top-0 animate-[bftc-hint-drag_2400ms_ease-in-out_infinite]"
          style={pathStyle}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2">{children}</div>
          {showHalo ? (
            <div
              className="absolute size-[52px] rounded-full border-2 border-[rgba(255,255,255,.65)] bg-[radial-gradient(circle,rgba(255,255,255,.55)_0%,rgba(255,255,255,.18)_45%,rgba(255,255,255,0)_75%)] shadow-[0_0_24px_rgba(255,255,255,.45)]"
              style={{ transform: 'translate(calc(-50% + 14px), calc(-50% + 18px))' }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
