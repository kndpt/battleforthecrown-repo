/**
 * Math pure de pan caméra, isolée de Pixi/DOM pour être unit-testable.
 *
 * `focusOn` veut placer un point monde précis sous une ancre écran donnée (ex.
 * le bec du panneau de sélection), au lieu de simplement centrer. L'ancre arrive
 * en coordonnées **fenêtre** (`getBoundingClientRect`) alors que le repère de
 * `viewport.toScreen` / `app.screen` est **local au canvas** : on convertit en
 * soustrayant l'origine du canvas et en appliquant le ratio résolution/CSS.
 */
export interface FocusCenterInput {
  /** Coordonnées monde (px) de la cible. */
  worldX: number;
  worldY: number;
  /** Échelle (zoom) courante du viewport. */
  scale: number;
  /** Taille de la surface de rendu Pixi (px CSS). */
  screenWidth: number;
  screenHeight: number;
  /** Rect du canvas dans la fenêtre (coords window). */
  canvasRect: { left: number; top: number; width: number; height: number };
  /** Ancre en coords fenêtre ; centre de l'écran si absent. */
  screenAnchor?: { x: number; y: number };
}

/**
 * Renvoie le centre de viewport (en monde) tel que `world` tombe pile sous
 * `screenAnchor`. Sans ancre, recentre simplement sur le point monde.
 */
export function computeFocusCenter(input: FocusCenterInput): {
  x: number;
  y: number;
} {
  const {
    worldX,
    worldY,
    scale,
    screenWidth,
    screenHeight,
    canvasRect,
    screenAnchor,
  } = input;
  const s = scale || 1;
  const ratioX = canvasRect.width ? screenWidth / canvasRect.width : 1;
  const ratioY = canvasRect.height ? screenHeight / canvasRect.height : 1;
  const anchorX = screenAnchor
    ? (screenAnchor.x - canvasRect.left) * ratioX
    : screenWidth / 2;
  const anchorY = screenAnchor
    ? (screenAnchor.y - canvasRect.top) * ratioY
    : screenHeight / 2;
  return {
    x: worldX + (screenWidth / 2 - anchorX) / s,
    y: worldY + (screenHeight / 2 - anchorY) / s,
  };
}
