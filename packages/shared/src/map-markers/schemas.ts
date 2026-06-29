import { z } from "zod";
import { MAP_MARKER_KINDS } from "./types";
import { MAP_MARKER_NOTE_MAX_LENGTH } from "./constants";

/** Server-authoritative coordinate bound — markers live on integer tiles. */
const tileCoordinate = z.number().int();

/**
 * A non-empty note (trimmed, ≤ MAP_MARKER_NOTE_MAX_LENGTH) or null. An empty /
 * whitespace-only string collapses to null so "blank note" always means "no
 * note", never a row carrying `""`.
 */
const noteValue = z
  .union([
    z.string().trim().max(MAP_MARKER_NOTE_MAX_LENGTH),
    z.null(),
  ])
  .transform((value) =>
    value === null || value.length === 0 ? null : value,
  );

export const MapMarkerKindSchema = z.enum(MAP_MARKER_KINDS);

/**
 * Body of `POST /worlds/:worldId/map-markers`. Create-or-upsert on the
 * `(userId, worldId, x, y)` tile — re-posting on a marked tile edits it. An
 * absent note defaults to null.
 */
export const CreateMapMarkerSchema = z.object({
  x: tileCoordinate,
  y: tileCoordinate,
  kind: MapMarkerKindSchema,
  note: noteValue.optional().transform((value) => value ?? null),
});

export type CreateMapMarkerBody = z.infer<typeof CreateMapMarkerSchema>;

/**
 * Body of `PATCH /worlds/:worldId/map-markers/:id`. Both fields optional, but at
 * least one is required. `note` keeps the absent-vs-clear distinction: absent →
 * leave untouched, explicit `null` (or empty string) → clear. The tile `(x, y)`
 * is immutable (move = delete + recreate) so it is not editable here.
 */
export const UpdateMapMarkerSchema = z
  .object({
    kind: MapMarkerKindSchema.optional(),
    note: noteValue.optional(),
  })
  .refine((body) => body.kind !== undefined || body.note !== undefined, {
    message: "Provide at least one of kind or note",
  });

export type UpdateMapMarkerBody = z.infer<typeof UpdateMapMarkerSchema>;
