import { Container, Graphics } from 'pixi.js';

const BLIP_RADIUS = 9;
const BLIP_HALO_RADIUS = 14;
const COLOR_BLIP = 0x9aa3ad;
const COLOR_HALO = 0x2c333b;
const COLOR_RIM = 0x4a525c;

export interface BlipSpriteHandle {
  readonly container: Container;
  destroy: () => void;
}

export function createBlipSprite(): BlipSpriteHandle {
  const container = new Container();
  container.eventMode = 'none';
  container.cursor = 'default';

  const graphic = new Graphics();
  graphic
    .circle(0, 0, BLIP_HALO_RADIUS)
    .fill({ color: COLOR_HALO, alpha: 0.45 });
  graphic
    .circle(0, 0, BLIP_RADIUS + 1)
    .fill({ color: COLOR_RIM, alpha: 0.85 });
  graphic
    .circle(0, 0, BLIP_RADIUS)
    .fill({ color: COLOR_BLIP, alpha: 1 });
  container.addChild(graphic);

  return {
    container,
    destroy: () => {
      container.destroy({ children: true });
    },
  };
}
