/**
 * Pure geometry helpers for the cartographic mini-map — no DOM, no canvas, so
 * the screen → tile transform used for camera recentring stays unit-testable.
 */
import { clamp } from '@/lib/math';

export interface FitGeometry {
  /** Side of the square world plate (px) — `contain`-fitted into the panel. */
  drawSize: number;
  /** Left letterbox offset (px). */
  offX: number;
  /** Top letterbox offset (px). */
  offY: number;
}

/** Geometry of the (square) world drawn "contain"-fitted into a w×h panel. */
export function fitGeometry(w: number, h: number): FitGeometry {
  const drawSize = Math.min(w, h);
  return { drawSize, offX: (w - drawSize) / 2, offY: (h - drawSize) / 2 };
}

/**
 * Convert a pointer position already relative to the canvas top-left into world
 * tile coordinates, clamped to the grid. Inverse of the tx/ty projection used
 * when drawing the markers.
 */
export function screenToTile(
  localX: number,
  localY: number,
  box: { w: number; h: number },
  grid: { width: number; height: number },
): { tileX: number; tileY: number } {
  const { drawSize, offX, offY } = fitGeometry(box.w, box.h);
  const tileX = clamp(((localX - offX) / drawSize) * grid.width, 0, grid.width);
  const tileY = clamp(((localY - offY) / drawSize) * grid.height, 0, grid.height);
  return { tileX, tileY };
}
