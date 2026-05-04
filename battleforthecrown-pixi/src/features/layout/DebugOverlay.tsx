import { useEffect, useState } from 'react';
import { useGameSocketStatus } from '@/lib/useGameSocketStatus';

const STATUS_COLOR: Record<string, string> = {
  idle: 'bg-parchment/40',
  connecting: 'bg-game-gold-light',
  connected: 'bg-game-green-light',
  disconnected: 'bg-game-red-light',
};

/**
 * Floating diagnostic panel — only mounted in dev. Reads `globalThis.__pixiApp`
 * if available so it can sample the renderer's FPS without coupling to a
 * specific scene.
 */
export function DebugOverlay() {
  const status = useGameSocketStatus();
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setInterval(() => {
      const candidate = (globalThis as { __pixiApp?: { ticker?: { FPS?: number } } }).__pixiApp;
      const value = candidate?.ticker?.FPS;
      setFps(typeof value === 'number' ? Math.round(value) : null);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-2 right-2 z-[60] rounded border border-game-gold-border/50 bg-black/70 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-parchment shadow-game-inset">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLOR[status] ?? STATUS_COLOR.idle}`} />
        <span>WS {status}</span>
        {fps !== null && <span className="ml-2">FPS {fps}</span>}
      </div>
    </div>
  );
}
