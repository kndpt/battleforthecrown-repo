import { useCallback, useRef, type PointerEvent } from 'react';

const HERO_INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, [role="button"], [data-bftc-hero-no-swipe]';

type SwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
};

export function useHeroSwipe(
  villageCount: number,
  switchVillage: (direction: -1 | 1) => void,
) {
  const swipeRef = useRef<SwipeState | null>(null);
  const suppressClickRef = useRef(false);

  const releaseCapture = useCallback(
    (element: HTMLDivElement, pointerId: number) => {
      if (
        typeof element.hasPointerCapture === 'function' &&
        element.hasPointerCapture(pointerId)
      ) {
        element.releasePointerCapture(pointerId);
      }
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (villageCount <= 1) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(HERO_INTERACTIVE_SELECTOR)) return;

      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
      if (typeof event.currentTarget.setPointerCapture === 'function') {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [villageCount],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      if (swipe?.pointerId === event.pointerId) {
        releaseCapture(event.currentTarget, event.pointerId);
      }
      swipeRef.current = null;
      if (!swipe || swipe.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - swipe.startX;
      const deltaY = event.clientY - swipe.startY;
      const isHorizontalSwipe = Math.abs(deltaX) >= 52 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35;
      if (!isHorizontalSwipe) return;

      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      switchVillage(deltaX < 0 ? 1 : -1);
    },
    [releaseCapture, switchVillage],
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (swipeRef.current?.pointerId === event.pointerId) {
        releaseCapture(event.currentTarget, event.pointerId);
        swipeRef.current = null;
      }
    },
    [releaseCapture],
  );

  const handleClickCapture = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleClickCapture,
  };
}
