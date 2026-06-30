import { describe, expect, it } from "vitest";
import type { MapMarkerDto } from "@battleforthecrown/shared/map-markers";
import { MAP_MARKER_KINDS } from "@battleforthecrown/shared/map-markers";
import {
  MAP_MARKER_KIND_LABELS,
  colorToHex,
  resolveMarkerTileTarget,
} from "./mapMarkerSheetModel";
import { markerStyleFor } from "@/pixi/scenes/worldMapEntityStyle";

const marker = (over: Partial<MapMarkerDto>): MapMarkerDto => ({
  id: "m1",
  worldId: "w",
  x: 0,
  y: 0,
  kind: "TARGET",
  note: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("resolveMarkerTileTarget", () => {
  it("finds the existing marker on a tile (edit mode)", () => {
    const markers = [marker({ id: "a", x: 3, y: 4, kind: "DANGER" })];
    const { existing, atCap } = resolveMarkerTileTarget(markers, { x: 3, y: 4 });
    expect(existing?.id).toBe("a");
    expect(atCap).toBe(false);
  });

  it("returns null existing for a free tile (create mode)", () => {
    const markers = [marker({ id: "a", x: 1, y: 1 })];
    const { existing } = resolveMarkerTileTarget(markers, { x: 9, y: 9 });
    expect(existing).toBeNull();
  });

  it("flags atCap for a NEW tile once the cap is reached", () => {
    const markers = Array.from({ length: 3 }, (_, i) =>
      marker({ id: `m${i}`, x: i, y: 0 }),
    );
    const target = resolveMarkerTileTarget(markers, { x: 99, y: 99 }, 3);
    expect(target.existing).toBeNull();
    expect(target.atCap).toBe(true);
  });

  it("never flags atCap when editing an already-marked tile at the cap", () => {
    const markers = Array.from({ length: 3 }, (_, i) =>
      marker({ id: `m${i}`, x: i, y: 0 }),
    );
    const target = resolveMarkerTileTarget(markers, { x: 1, y: 0 }, 3);
    expect(target.existing?.id).toBe("m1");
    expect(target.atCap).toBe(false);
  });
});

describe("marker kind metadata", () => {
  it("maps every kind to a distinct colour and a non-empty FR label", () => {
    const colors = new Set<number>();
    for (const kind of MAP_MARKER_KINDS) {
      const style = markerStyleFor(kind);
      expect(typeof style.color).toBe("number");
      colors.add(style.color);
      expect(MAP_MARKER_KIND_LABELS[kind].length).toBeGreaterThan(0);
    }
    expect(colors.size).toBe(MAP_MARKER_KINDS.length);
  });
});

describe("colorToHex", () => {
  it("renders a zero-padded #RRGGBB string", () => {
    expect(colorToHex(0xff0000)).toBe("#ff0000");
    expect(colorToHex(0x0000ff)).toBe("#0000ff");
    expect(colorToHex(0x00ff00)).toBe("#00ff00");
  });
});
