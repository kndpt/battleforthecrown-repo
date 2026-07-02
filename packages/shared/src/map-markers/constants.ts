/**
 * Private map-markers caps and machine-readable error codes
 * (cf. `docs/gameplay/26-private-map-markers.md`).
 *
 * MVP-hard constants — never inlined backend-side so a future `WorldConfig`
 * override stays a single-source change (out of scope at MVP).
 */

/** Max markers a player can hold on a single world (`userId × worldId`). */
export const MAP_MARKER_CAP = 50;

/** Max length of the optional free-text note attached to a marker. */
export const MAP_MARKER_NOTE_MAX_LENGTH = 80;

/**
 * Machine-readable error codes returned by the map-marker endpoints. The client
 * branches on these (never on the human message) to drive the correct UX flow.
 */
export const MAP_MARKER_ERROR_CODES = {
  /** No marker owned by the caller matches the id on this world. */
  NOT_FOUND: "MAP_MARKER_NOT_FOUND",
  /** The caller already holds {@link MAP_MARKER_CAP} markers on this world. */
  CAP_REACHED: "MAP_MARKER_CAP_REACHED",
} as const;

export type MapMarkerErrorCode =
  (typeof MAP_MARKER_ERROR_CODES)[keyof typeof MAP_MARKER_ERROR_CODES];
