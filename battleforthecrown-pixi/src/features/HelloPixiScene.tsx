import { useCallback } from 'react';
import { Text, type Application } from 'pixi.js';
import { PixiCanvas } from '../pixi/PixiCanvas';

export function HelloPixiScene() {
  const onReady = useCallback((app: Application) => {
    const text = new Text({
      text: 'Hello Pixi',
      style: {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: 64,
        fill: 0xf1c40f,
        align: 'center',
        dropShadow: {
          alpha: 0.6,
          angle: Math.PI / 4,
          blur: 4,
          color: 0x000000,
          distance: 4,
        },
      },
    });
    text.anchor.set(0.5);

    const reposition = () => {
      text.position.set(app.screen.width / 2, app.screen.height / 2);
    };
    reposition();
    app.renderer.on('resize', reposition);

    app.stage.addChild(text);

    return () => {
      app.renderer.off('resize', reposition);
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-[#1a1a2e]">
      <PixiCanvas className="absolute inset-0" onReady={onReady} />
      <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-game-gold-light text-shadow-game text-sm tracking-widest uppercase">
        Battle for the Crown — Pixi Boot
      </div>
    </div>
  );
}
