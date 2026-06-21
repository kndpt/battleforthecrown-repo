import { describe, expect, it } from 'vitest';
import { computeFocusCenter } from './focusCamera';

const FULL_CANVAS = { left: 0, top: 0, width: 1000, height: 800 };

describe('computeFocusCenter', () => {
  it('recentre sur le point monde quand aucune ancre n’est fournie', () => {
    const center = computeFocusCenter({
      worldX: 500,
      worldY: 400,
      scale: 1,
      screenWidth: 1000,
      screenHeight: 800,
      canvasRect: FULL_CANVAS,
    });
    expect(center).toEqual({ x: 500, y: 400 });
  });

  it('renvoie le point monde quand l’ancre est au centre de l’écran', () => {
    const center = computeFocusCenter({
      worldX: 500,
      worldY: 400,
      scale: 1,
      screenWidth: 1000,
      screenHeight: 800,
      canvasRect: FULL_CANVAS,
      screenAnchor: { x: 500, y: 400 },
    });
    expect(center).toEqual({ x: 500, y: 400 });
  });

  it('décale le centre vers le haut quand l’ancre est sous le centre (village descend à l’écran)', () => {
    // Ancre 100px sous le centre vertical → la caméra remonte de 100px en monde
    // (à scale 1) pour que le village apparaisse 100px plus bas.
    const center = computeFocusCenter({
      worldX: 500,
      worldY: 400,
      scale: 1,
      screenWidth: 1000,
      screenHeight: 800,
      canvasRect: FULL_CANVAS,
      screenAnchor: { x: 500, y: 500 },
    });
    expect(center).toEqual({ x: 500, y: 300 });
  });

  it('soustrait l’origine du canvas (chrome/marges) de l’ancre fenêtre', () => {
    // Canvas décalé de (200, 100) dans la fenêtre ; ancre fenêtre au coin =
    // centre du canvas → pas d’offset.
    const center = computeFocusCenter({
      worldX: 500,
      worldY: 400,
      scale: 1,
      screenWidth: 1000,
      screenHeight: 800,
      canvasRect: { left: 200, top: 100, width: 1000, height: 800 },
      screenAnchor: { x: 200 + 500, y: 100 + 400 },
    });
    expect(center).toEqual({ x: 500, y: 400 });
  });

  it('applique le ratio quand la taille DOM du canvas diffère de la résolution Pixi', () => {
    // Canvas CSS 500x400 mais résolution Pixi 1000x800 (ratio 2). Ancre fenêtre
    // à (250,200) = centre CSS → centre Pixi → pas d’offset.
    const center = computeFocusCenter({
      worldX: 500,
      worldY: 400,
      scale: 1,
      screenWidth: 1000,
      screenHeight: 800,
      canvasRect: { left: 0, top: 0, width: 500, height: 400 },
      screenAnchor: { x: 250, y: 200 },
    });
    expect(center).toEqual({ x: 500, y: 400 });
  });

  it('divise l’offset d’ancre par le scale (zoom)', () => {
    // Ancre 100px sous le centre, scale 2 → offset monde = 100/2 = 50.
    const center = computeFocusCenter({
      worldX: 500,
      worldY: 400,
      scale: 2,
      screenWidth: 1000,
      screenHeight: 800,
      canvasRect: FULL_CANVAS,
      screenAnchor: { x: 500, y: 500 },
    });
    expect(center).toEqual({ x: 500, y: 350 });
  });

  it('retombe sur scale 1 si scale vaut 0', () => {
    const center = computeFocusCenter({
      worldX: 0,
      worldY: 0,
      scale: 0,
      screenWidth: 1000,
      screenHeight: 800,
      canvasRect: FULL_CANVAS,
      screenAnchor: { x: 500, y: 500 },
    });
    expect(center).toEqual({ x: 0, y: -100 });
  });
});
