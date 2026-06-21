/**
 * Isometric (2:1 diamond) projection — PURE module (no Pixi import).
 *
 * Converts between world TILE coordinates (the gameplay/server space, integers)
 * and ISO SCENE pixel coordinates (what the Pixi viewport renders). All scene
 * coordinate helpers route through here, so the rest of WorldMapScene — and
 * every external caller using tile coords — stays projection-agnostic.
 *
 * Diamond geometry, per tile:
 *   top    = (cx, cy)
 *   right  = (cx + halfW, cy + halfH)
 *   bottom = (cx, cy + 2*halfH)
 *   left   = (cx - halfW, cy + halfH)
 *
 * `offsetX` shifts the whole map right so the leftmost tile lands at x = 0
 * (raw (tx - ty) goes negative for the bottom-left half of the map).
 */

export interface IsoConfig {
  /** Half the diamond width (px). Diamond width = 2*halfW. */
  halfW: number;
  /** Half the diamond height (px). 2:1 ratio → halfH = halfW / 2. */
  halfH: number;
  /** Horizontal shift so all projected x are ≥ 0. */
  offsetX: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

// `_gridWidth` ne participe pas au calcul (seul `gridHeight` décale `offsetX`),
// mais reste dans la signature pour rester homogène avec les autres helpers iso
// qui prennent la paire (gridWidth, gridHeight). Préfixe `_` = inutilisé assumé.
export function makeIsoConfig(_gridWidth: number, gridHeight: number, tileSize: number): IsoConfig {
  const halfW = tileSize;
  const halfH = tileSize / 2;
  return { halfW, halfH, offsetX: gridHeight * halfW };
}

/** Tile (tx, ty) → iso scene pixel (top vertex of the tile's diamond). */
export function tileToIso(tx: number, ty: number, cfg: IsoConfig): Vec2 {
  return {
    x: (tx - ty) * cfg.halfW + cfg.offsetX,
    y: (tx + ty) * cfg.halfH,
  };
}

/** Iso scene pixel → tile (inverse of tileToIso). */
export function isoToTile(x: number, y: number, cfg: IsoConfig): Vec2 {
  const a = (x - cfg.offsetX) / cfg.halfW; // tx - ty
  const b = y / cfg.halfH; // tx + ty
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

/** Bounding-box size of the full iso world diamond, in scene pixels. */
export function isoWorldSize(gridWidth: number, gridHeight: number, cfg: IsoConfig): {
  width: number;
  height: number;
} {
  return {
    width: (gridWidth + gridHeight) * cfg.halfW,
    height: (gridWidth + gridHeight) * cfg.halfH,
  };
}

/**
 * A circle of `radiusTiles` in tile space projects to an axis-aligned ellipse
 * in iso scene space (M·Mᵀ is diagonal for the iso matrix). Returns the ellipse
 * semi-axes — used for vision disks, halos, and rings.
 */
export function isoEllipseRadii(radiusTiles: number, cfg: IsoConfig): { rx: number; ry: number } {
  const k = Math.SQRT2 * radiusTiles;
  return { rx: k * cfg.halfW, ry: k * cfg.halfH };
}

export interface TileBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Project an axis-aligned scene-pixel rectangle (e.g. the viewport's visible
 * world bounds) to the tile-space bounding box it covers. A screen rectangle
 * maps to a diamond in tile space, so we project its four corners and take the
 * tile bbox — an over-estimate that fully contains the visible diamond, which
 * is exactly what viewport virtualization needs (no visible tile is missed).
 */
export function isoBoundsToTileBox(
  left: number,
  top: number,
  right: number,
  bottom: number,
  cfg: IsoConfig,
): TileBox {
  const corners = [
    isoToTile(left, top, cfg),
    isoToTile(right, top, cfg),
    isoToTile(left, bottom, cfg),
    isoToTile(right, bottom, cfg),
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }
  return { minX, minY, maxX, maxY };
}
