export interface GridSize {
  gridWidth: number;
  gridHeight: number;
}

export interface RadiusBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Clamp a centred query window (`center ± radius`) to the world grid so the
 * resulting bounds never address coordinates outside `[0, grid - 1]`.
 *
 * Centralised here because four `world-entities-query` methods used to clamp
 * by hand — two against a hard-coded `499` (legacy 500×500 grid), two not
 * clamping `maxX/maxY` at all.
 */
export function computeRadiusBounds(
  grid: GridSize,
  centerX: number,
  centerY: number,
  radius: number,
): RadiusBounds {
  return {
    minX: Math.max(centerX - radius, 0),
    maxX: Math.min(centerX + radius, grid.gridWidth - 1),
    minY: Math.max(centerY - radius, 0),
    maxY: Math.min(centerY + radius, grid.gridHeight - 1),
  };
}

export interface PendingConquestRow {
  id: string;
  attackerVillageId: string;
  captureUntil: Date;
}

export interface OpenCaptureWindow {
  status: 'OPEN';
  pendingConquestId: string;
  attackerVillageId: string;
  captureUntil: string;
}

/**
 * Map the (optional) earliest open `PendingConquest` row attached to a village
 * into the wire shape consumed by both barbarian and player village DTOs.
 */
export function presentCaptureWindow(
  capture: PendingConquestRow | undefined,
): OpenCaptureWindow | undefined {
  if (!capture) return undefined;
  return {
    status: 'OPEN',
    pendingConquestId: capture.id,
    attackerVillageId: capture.attackerVillageId,
    captureUntil: capture.captureUntil.toISOString(),
  };
}
