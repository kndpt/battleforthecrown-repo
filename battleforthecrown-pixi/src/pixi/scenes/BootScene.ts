import { Container, Text, type Application } from 'pixi.js';
import type { PixiScene } from './SceneManager';

export function createBootScene(app: Application): PixiScene {
  const view = new Container();
  const label = new Text({
    text: 'Chargement…',
    style: {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: 32,
      fill: 0xf1c40f,
      align: 'center',
      dropShadow: { alpha: 0.5, color: 0x000000, distance: 3, blur: 4, angle: Math.PI / 4 },
    },
  });
  label.anchor.set(0.5);

  const reposition = () => {
    label.position.set(app.screen.width / 2, app.screen.height / 2);
  };

  return {
    view,
    enter: () => {
      view.addChild(label);
      reposition();
      app.renderer.on('resize', reposition);
    },
    exit: () => {
      app.renderer.off('resize', reposition);
    },
  };
}
