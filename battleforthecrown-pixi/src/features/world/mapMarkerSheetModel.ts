import {
  MAP_MARKER_CAP,
  type MapMarkerDto,
  type MapMarkerKind,
} from "@battleforthecrown/shared/map-markers";

/** FR labels for each marker kind (player-facing, never sent to the backend). */
export const MAP_MARKER_KIND_LABELS: Record<MapMarkerKind, string> = {
  TO_SCOUT: "À scouter",
  TARGET: "Cible",
  DANGER: "Danger",
  FUTURE_VILLAGE: "Futur village",
  INTEREST: "Intérêt",
  NOTE: "Note",
};

export interface MapMarkerTileTarget {
  /** The caller's existing marker on this tile, if any (edit vs create). */
  existing: MapMarkerDto | null;
  /**
   * True when a NEW marker cannot be placed: the player is already at the cap
   * AND this tile is not already marked (editing an existing tile stays allowed
   * even at the cap, since it does not add a row).
   */
  atCap: boolean;
}

/**
 * Resolve, for a tile `(x, y)`, whether the caller already has a marker there
 * and whether a fresh marker would breach {@link MAP_MARKER_CAP}. Pure — drives
 * the sheet's create-vs-edit mode and the disabled state of the save action.
 */
export function resolveMarkerTileTarget(
  markers: readonly MapMarkerDto[],
  tile: { x: number; y: number },
  cap: number = MAP_MARKER_CAP,
): MapMarkerTileTarget {
  const existing =
    markers.find((m) => m.x === tile.x && m.y === tile.y) ?? null;
  return {
    existing,
    atCap: existing === null && markers.length >= cap,
  };
}

/** Convert a Pixi color number (0xRRGGBB) to a CSS hex string for swatches. */
export function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
