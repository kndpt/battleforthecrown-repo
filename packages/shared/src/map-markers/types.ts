/**
 * Private map-markers contract shared between backend and frontends
 * (cf. `docs/gameplay/26-private-map-markers.md`).
 *
 * A marker is private to its owner: it is strategic memory, never a public
 * reveal. It sits on a free tile `(worldId, x, y)`, independent of whatever
 * entity (if any) occupies that tile — so it survives the entity disappearing.
 */

/**
 * Every marker kind, in display order (UI kind picker). Single source for the
 * {@link MapMarkerKind} union and the Zod schema (`z.enum(MAP_MARKER_KINDS)`).
 *
 * Kept an enum (not free tags) so each maps to a single legible icon + colour.
 * The free-text {@link MapMarkerDto.note} carries the per-marker context.
 */
export const MAP_MARKER_KINDS = [
  "TO_SCOUT",
  "TARGET",
  "DANGER",
  "FUTURE_VILLAGE",
  "INTEREST",
  "NOTE",
] as const;

/** Fixed kind of a marker. */
export type MapMarkerKind = (typeof MAP_MARKER_KINDS)[number];
