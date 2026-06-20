import { Container, Graphics } from 'pixi.js';

/**
 * Glassy protection dome drawn over a protected (newbie-shield) village on the
 * world map. Pure Pixi Graphics so the village sprite stays visible through the
 * translucent glass. Built once per `setSize`, animated cheaply in `tick`
 * (no per-frame redraw — only child alphas / sheen offset are tweened).
 *
 * Anchoring convention: the dome's base ellipse sits at the container origin
 * (y = 0) and the glass rises upward (negative y), so the caller positions the
 * container at the village "feet" (slightly below the sprite center).
 */
export interface ShieldDomeHandle {
  container: Container;
  /** Fit the dome around a village sprite of `spriteSize` pixels. */
  setSize: (spriteSize: number) => void;
  /** Subtle shimmer/pulse; pass epoch ms. */
  tick: (nowMs: number) => void;
  destroy: () => void;
}

const COLOR = {
  base: 0x0e2a66,
  glassDeep: 0x1c63c4,
  glassLight: 0x6ab2ef,
  rimLight: 0x9fd6ff,
  rimDark: 0x0a1b4a,
  sheen: 0xffffff,
};

export function createShieldDome(): ShieldDomeHandle {
  const container = new Container();
  container.eventMode = 'none';

  const base = new Graphics();
  const glass = new Graphics();
  const sheen = new Graphics();
  const rim = new Graphics();
  container.addChild(base, glass, sheen, rim);

  let rx = 30;
  let ryTop = 30;
  let ryBase = 7;

  const drawDomePath = (g: Graphics, scaleX = 1, scaleY = 1, baseY = 0) => {
    const sx = rx * scaleX;
    const top = -ryTop * 1.12 * scaleY;
    g.moveTo(-sx, baseY);
    g.bezierCurveTo(-sx, top, sx, top, sx, baseY);
    g.bezierCurveTo(sx, baseY + ryBase, -sx, baseY + ryBase, -sx, baseY);
  };

  const redraw = () => {
    base.clear();
    glass.clear();
    sheen.clear();
    rim.clear();

    // Ground footprint — where the dome meets the soil.
    base
      .ellipse(0, 0, rx, ryBase)
      .fill({ color: COLOR.base, alpha: 0.16 })
      .stroke({ color: COLOR.rimLight, width: 1.5, alpha: 0.45 });

    // Deep glass body (full dome).
    drawDomePath(glass);
    glass.fill({ color: COLOR.glassDeep, alpha: 0.17 });
    // Lighter inner dome → fakes a top-lit vertical gradient.
    drawDomePath(glass, 0.82, 0.86, -ryTop * 0.16);
    glass.fill({ color: COLOR.glassLight, alpha: 0.14 });

    // Bright glass rim (double stroke for a beveled edge).
    drawDomePath(rim);
    rim.stroke({ color: COLOR.rimLight, width: 2.5, alpha: 0.7 });
    drawDomePath(rim);
    rim.stroke({ color: COLOR.rimDark, width: 1, alpha: 0.5 });

    // Specular sheen (top-left reflection).
    sheen
      .ellipse(-rx * 0.32, -ryTop * 0.62, rx * 0.26, ryTop * 0.2)
      .fill({ color: COLOR.sheen, alpha: 0.42 });
    sheen
      .ellipse(rx * 0.28, -ryTop * 0.32, rx * 0.08, ryTop * 0.12)
      .fill({ color: COLOR.sheen, alpha: 0.22 });
  };

  const setSize = (spriteSize: number) => {
    rx = spriteSize * 1.32;
    ryTop = spriteSize * 2.0;
    ryBase = spriteSize * 0.28;
    redraw();
  };

  const tick = (nowMs: number) => {
    const pulse = (Math.sin(nowMs / 620) + 1) / 2;
    rim.alpha = 0.7 + pulse * 0.3;
    sheen.alpha = 0.75 + pulse * 0.25;
    glass.alpha = 0.92 + pulse * 0.08;
  };

  redraw();

  return {
    container,
    setSize,
    tick,
    destroy: () => container.destroy({ children: true }),
  };
}
