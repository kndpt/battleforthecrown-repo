import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { createPixiApp } from './application';

export type PixiCanvasProps = {
  className?: string;
  onReady?: (app: Application) => undefined | (() => void);
};

export function PixiCanvas({ className, onReady }: PixiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let app: Application | null = null;
    let cleanupOnReady: (() => void) | undefined;

    void createPixiApp({ container }).then((created) => {
      if (cancelled) {
        created.destroy(true, { children: true, texture: true });
        return;
      }
      app = created;
      cleanupOnReady = onReady?.(created);
    });

    return () => {
      cancelled = true;
      cleanupOnReady?.();
      if (app) {
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, [onReady]);

  return <div ref={containerRef} className={className} />;
}
