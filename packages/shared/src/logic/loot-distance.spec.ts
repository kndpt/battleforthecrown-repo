import { describe, expect, it } from "vitest";
import { lootDistanceFactor, type LootDistanceConfig } from "./loot-distance";

const CFG: LootDistanceConfig = { radius: 25, slope: 0.01, floor: 0.5 };
// Plateau atteint à radius + (1 - floor) / slope = 25 + 50 = 75.
const PLATEAU = CFG.radius + (1 - CFG.floor) / CFG.slope;

describe("lootDistanceFactor", () => {
  it("returns exactly 1 at and under the radius (aucun malus)", () => {
    expect(lootDistanceFactor(0, CFG)).toBe(1);
    expect(lootDistanceFactor(CFG.radius - 1, CFG)).toBe(1);
    expect(lootDistanceFactor(CFG.radius, CFG)).toBe(1);
  });

  it("returns the floor far beyond the radius, never below, never 0", () => {
    expect(lootDistanceFactor(PLATEAU, CFG)).toBeCloseTo(CFG.floor, 10);
    expect(lootDistanceFactor(1_000, CFG)).toBe(CFG.floor);
    expect(lootDistanceFactor(1_000_000, CFG)).toBe(CFG.floor);
    expect(lootDistanceFactor(1_000, CFG)).toBeGreaterThan(0);
    expect(lootDistanceFactor(1_000, CFG)).toBeGreaterThanOrEqual(CFG.floor);
  });

  it("decreases strictly and monotonically between radius and plateau", () => {
    let prev = lootDistanceFactor(CFG.radius, CFG);
    for (let d = CFG.radius + 1; d <= PLATEAU; d += 1) {
      const factor = lootDistanceFactor(d, CFG);
      expect(factor).toBeLessThan(prev);
      expect(factor).toBeGreaterThanOrEqual(CFG.floor);
      expect(factor).toBeLessThanOrEqual(1);
      prev = factor;
    }
  });

  it("stays clamped in [floor, 1] for any distance", () => {
    for (let d = 0; d <= 300; d += 7) {
      const factor = lootDistanceFactor(d, CFG);
      expect(factor).toBeGreaterThanOrEqual(CFG.floor);
      expect(factor).toBeLessThanOrEqual(1);
    }
  });

  it("is effectively disabled when slope is 0 (factor always 1)", () => {
    const flat: LootDistanceConfig = { radius: 10, slope: 0, floor: 0.5 };
    expect(lootDistanceFactor(999, flat)).toBe(1);
  });

  it("is effectively disabled when floor is 1 (factor always 1)", () => {
    const noMalus: LootDistanceConfig = { radius: 10, slope: 0.01, floor: 1 };
    expect(lootDistanceFactor(999, noMalus)).toBe(1);
  });
});
