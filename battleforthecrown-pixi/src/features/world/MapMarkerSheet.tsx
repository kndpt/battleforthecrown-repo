import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { BottomSheet, Button, Textarea } from "@/ui";
import { GameBottomSheetPanel } from "@/features/design-system/components";
import {
  MAP_MARKER_CAP,
  MAP_MARKER_KINDS,
  MAP_MARKER_NOTE_MAX_LENGTH,
  type MapMarkerKind,
} from "@battleforthecrown/shared/map-markers";
import {
  useDeleteMapMarkerMutation,
  useUpsertMapMarkerMutation,
} from "@/api/queries";
import { useMapMarkersStore } from "./mapMarkersStore";
import {
  MAP_MARKER_KIND_LABELS,
  colorToHex,
  resolveMarkerTileTarget,
} from "./mapMarkerSheetModel";
import { markerStyleFor } from "@/pixi/scenes/worldMapEntityStyle";

interface MapMarkerSheetProps {
  worldId: string;
  tile: { x: number; y: number };
  onClose: () => void;
}

/**
 * Mobile sheet to create / edit / delete a private map marker on a free tile
 * (cf. docs/gameplay/26-private-map-markers.md). Re-posting on a marked tile
 * upserts it server-side, so "save" covers both create and edit.
 */
export function MapMarkerSheet({ worldId, tile, onClose }: MapMarkerSheetProps) {
  const markers = useMapMarkersStore((state) => state.markers);
  const { existing, atCap } = useMemo(
    () => resolveMarkerTileTarget(markers, tile),
    [markers, tile],
  );

  const [kind, setKind] = useState<MapMarkerKind>(existing?.kind ?? "TARGET");
  const [note, setNote] = useState(existing?.note ?? "");

  const upsert = useUpsertMapMarkerMutation(worldId);
  const remove = useDeleteMapMarkerMutation(worldId);

  const busy = upsert.isPending || remove.isPending;
  const saveDisabled = busy || atCap;

  const handleSave = () => {
    upsert.mutate(
      { x: tile.x, y: tile.y, kind, note: note.trim() || null },
      { onSuccess: () => onClose() },
    );
  };

  const handleDelete = () => {
    if (!existing) return;
    remove.mutate({ id: existing.id }, { onSuccess: () => onClose() });
  };

  return (
    <BottomSheet
      className="mx-auto max-w-[32rem]"
      isOpen
      onClose={onClose}
      maxHeight="70vh"
    >
      <GameBottomSheetPanel
        bodyClassName="px-4 pb-4 pt-3"
        className="max-h-[70vh]"
        closeLabel="Fermer"
        eyebrow={`${tile.x} | ${tile.y} · ${markers.length}/${MAP_MARKER_CAP}`}
        onClose={onClose}
        title={existing ? "Modifier le marqueur" : "Marquer ce lieu"}
      >
        <div className="flex flex-col gap-4">
          {atCap && (
            <p className="rounded-md border border-game-red-border bg-game-red-dark/30 px-3 py-2 text-xs text-game-red-light">
              Cap atteint ({MAP_MARKER_CAP} marqueurs). Supprime-en un pour en
              poser un nouveau.
            </p>
          )}

          <div>
            <p className="mb-2 font-game text-xs uppercase tracking-wide text-game-stone-light">
              Type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MAP_MARKER_KINDS.map((k) => {
                const selected = k === kind;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 rounded-lg border-2 px-2 py-2 text-left text-xs font-bold transition ${
                      selected
                        ? "border-game-gold-border bg-game-gold-dark/30 text-game-gold-light"
                        : "border-game-stone-border bg-game-stone-dark/20 text-game-stone-light hover:brightness-110"
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-black/40"
                      style={{
                        backgroundColor: colorToHex(markerStyleFor(k).color),
                      }}
                    />
                    {MAP_MARKER_KIND_LABELS[k]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label
                htmlFor="map-marker-note"
                className="font-game text-xs uppercase tracking-wide text-game-stone-light"
              >
                Note (optionnel)
              </label>
              <span className="text-[10px] text-game-stone-light">
                {note.length}/{MAP_MARKER_NOTE_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="map-marker-note"
              rows={2}
              maxLength={MAP_MARKER_NOTE_MAX_LENGTH}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. : voisin agressif, à scouter avant samedi…"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="md"
              className="flex-1"
              disabled={saveDisabled}
              onClick={handleSave}
            >
              {existing ? "Enregistrer" : "Marquer"}
            </Button>
            {existing && (
              <Button
                variant="danger"
                size="md"
                disabled={busy}
                onClick={handleDelete}
                aria-label="Supprimer le marqueur"
              >
                <Trash2 size={18} strokeWidth={2.5} />
              </Button>
            )}
          </div>
        </div>
      </GameBottomSheetPanel>
    </BottomSheet>
  );
}
