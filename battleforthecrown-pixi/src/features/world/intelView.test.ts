import { describe, expect, it } from "vitest";
import type { VillageIntelDto } from "@battleforthecrown/shared/world";
import { formatIntelAge, toIntelView } from "./intelView";

const NOW = new Date("2026-06-20T12:00:00.000Z");

function seenAtOffset(offsetMs: number): string {
  return new Date(NOW.getTime() - offsetMs).toISOString();
}

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe("formatIntelAge", () => {
  it.each([
    [0, "il y a 0mn"],
    [30 * MIN, "il y a 30mn"],
    [59 * MIN, "il y a 59mn"],
    [60 * MIN, "il y a 1h"],
    [5 * HOUR, "il y a 5h"],
    [23 * HOUR, "il y a 23h"],
    [24 * HOUR, "il y a 1j"],
    [3 * DAY, "il y a 3j"],
  ])("âge %ims → %s", (offsetMs, expected) => {
    expect(formatIntelAge(seenAtOffset(offsetMs), NOW)).toBe(expected);
  });
});

const baseDto: VillageIntelDto = {
  targetVillageId: "v-target",
  worldId: "w-1",
  sourceKind: "SCOUT",
  sourceReportId: "report-abc",
  units: { MILITIA: 5, ARCHER: 0, WARRIOR: 3 },
  resources: { wood: 100, stone: 50, iron: 25 },
  wallLevel: 4,
  strategy: "FORTRESS",
  targetName: "Roc-d-Acier",
  targetX: 12,
  targetY: 34,
  targetTier: null,
  seenAt: "2026-06-20T10:00:00.000Z",
};

describe("toIntelView", () => {
  it("filters zero-quantity units and keeps non-zero ones", () => {
    const view = toIntelView(baseDto);
    // ARCHER quantity is 0 → filtered out
    expect(view.units).toHaveLength(2);
    expect(view.units).toEqual(
      expect.arrayContaining([
        { unitType: "MILITIA", quantity: 5 },
        { unitType: "WARRIOR", quantity: 3 },
      ]),
    );
  });

  it("builds wallLabel from wallLevel when present", () => {
    const view = toIntelView(baseDto);
    expect(view.wallLabel).toBe("Rempart niv. 4");
  });

  it("returns fallback wallLabel when wallLevel is null", () => {
    const view = toIntelView({ ...baseDto, wallLevel: null });
    expect(view.wallLabel).toBe("—");
  });

  it('maps FORTRESS strategy to "Forteresse"', () => {
    const view = toIntelView(baseDto);
    expect(view.styleLabel).toBe("Forteresse");
  });

  it("returns fallback styleLabel when strategy is null", () => {
    const view = toIntelView({ ...baseDto, strategy: null });
    expect(view.styleLabel).toBe("—");
  });

  it("passes through sourceKind and sourceReportId", () => {
    const view = toIntelView(baseDto);
    expect(view.sourceKind).toBe("SCOUT");
    expect(view.sourceReportId).toBe("report-abc");
  });

  it("passes through resources", () => {
    const view = toIntelView(baseDto);
    expect(view.resources).toEqual({ wood: 100, stone: 50, iron: 25 });
  });
});
