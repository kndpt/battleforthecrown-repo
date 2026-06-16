import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type UIEvent } from 'react';

const HERO_SCROLL_FADE_DISTANCE = 340;
export const HERO_EXPANDED_HEIGHT = 368;

export interface HeroParallaxStyles {
  shellStyle: CSSProperties;
  backgroundStyle: CSSProperties;
  glowStyle: CSSProperties;
  chromeStyle: CSSProperties;
  assetParallaxStyle: CSSProperties;
  identityParallaxStyle: CSSProperties;
}

export function useHeroParallax() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const pendingScrollTopRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    [],
  );

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    pendingScrollTopRef.current = event.currentTarget.scrollTop;
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const nextProgress = Math.min(
        1,
        Math.max(0, pendingScrollTopRef.current / HERO_SCROLL_FADE_DISTANCE),
      );
      const easedProgress = nextProgress ** 1.55;
      setScrollProgress((current) =>
        Math.abs(current - easedProgress) < 0.01 ? current : easedProgress,
      );
    });
  }, []);

  const styles = useMemo<HeroParallaxStyles>(
    () => ({
      shellStyle: { height: HERO_EXPANDED_HEIGHT },
      backgroundStyle: {
        filter: `brightness(${1 - scrollProgress * 0.2}) saturate(${1 - scrollProgress * 0.16})`,
        transform: `translate3d(0, ${scrollProgress * 42}px, 0) scale(${1 + scrollProgress * 0.22})`,
      },
      glowStyle: {
        opacity: 1 - scrollProgress * 0.65,
        transform: `translate3d(0, ${-scrollProgress * 42}px, 0) scale(${1 + scrollProgress * 0.22})`,
      },
      chromeStyle: {
        opacity: 1 - scrollProgress * 0.95,
        transform: `translate3d(0, ${-scrollProgress * 70}px, 0) scale(${1 - scrollProgress * 0.04})`,
      },
      assetParallaxStyle: {
        filter: `drop-shadow(0 ${4 + scrollProgress * 10}px ${16 + scrollProgress * 14}px rgba(0,0,0,.65)) brightness(${1 - scrollProgress * 0.08})`,
        opacity: 1 - scrollProgress * 0.82,
        transform: `translate3d(0, ${scrollProgress * 18}px, ${scrollProgress * 22}px) scale(${1 + scrollProgress * 0.2}) rotate(${-scrollProgress * 0.45}deg)`,
      },
      identityParallaxStyle: {
        opacity: 1 - scrollProgress * 0.96,
        transform: `translate3d(0, ${-scrollProgress * 26}px, ${scrollProgress * 20}px) scale(${1 - scrollProgress * 0.05})`,
      },
    }),
    [scrollProgress],
  );

  return { styles, handleScroll };
}
