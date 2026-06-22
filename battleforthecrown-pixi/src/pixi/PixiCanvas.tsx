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
        // Same reasoning as the unmount path below: never release the global
        // resources (TexturePool) shared with the other live canvas.
        created.destroy({ removeView: true }, { children: true, texture: true });
        return;
      }
      app = created;
      cleanupOnReady = onReady?.(created);
    });

    return () => {
      cancelled = true;
      cleanupOnReady?.();
      if (app) {
        // `removeView: true` (not the `true` shorthand) tears down THIS renderer
        // without `releaseGlobalResources`, which would call TexturePool.clear()
        // on the process-global singleton shared by every PixiJS Application
        // (Village + WorldMap canvases). Clearing it while another canvas still
        // holds a pooled cache-as-texture (the world-map fog) leaves a dangling
        // _poolKeyHash entry whose bucket is gone, so the next returnTexture()
        // crashes with "undefined (reading 'push')" on scene teardown.
        app.destroy({ removeView: true }, { children: true, texture: true });
      }
    };
  }, [onReady]);

  return <div ref={containerRef} className={className} />;
}
