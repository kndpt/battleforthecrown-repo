import { describe, expect, it } from "vitest";
import {
  deriveNaturalTrait,
  NATURAL_TRAIT_PRODUCTION_BONUS,
  VILLAGE_NATURAL_TRAITS,
  type VillageNaturalTrait,
} from "./traits";

describe("deriveNaturalTrait", () => {
  it("is deterministic — same tile yields same trait on N calls", () => {
    const first = deriveNaturalTrait("world-abc", 123, 456);
    for (let i = 0; i < 50; i++) {
      expect(deriveNaturalTrait("world-abc", 123, 456)).toBe(first);
    }
  });

  it("only ever returns a known trait", () => {
    for (let x = 0; x < 40; x++) {
      for (let y = 0; y < 40; y++) {
        expect(VILLAGE_NATURAL_TRAITS).toContain(
          deriveNaturalTrait("world-1", x, y),
        );
      }
    }
  });

  it("uses worldId as a salt — same tile differs across worlds", () => {
    // Not every world flips a given tile, but across many worlds the same tile
    // must NOT be locked to a single trait (otherwise the salt does nothing).
    const traits = new Set<VillageNaturalTrait>();
    for (let w = 0; w < 100; w++) {
      traits.add(deriveNaturalTrait(`world-${w}`, 250, 250));
    }
    expect(traits.size).toBeGreaterThan(1);
  });

  it("produces a plausible weighted distribution (PLAINS is the plurality)", () => {
    const counts: Record<VillageNaturalTrait, number> = {
      DENSE_FOREST: 0,
      RICH_QUARRY: 0,
      IRON_VEIN: 0,
      PLAINS: 0,
    };
    for (let x = 0; x < 200; x++) {
      for (let y = 0; y < 200; y++) {
        counts[deriveNaturalTrait("world-dist", x, y)]++;
      }
    }
    // Every trait is reachable.
    for (const trait of VILLAGE_NATURAL_TRAITS) {
      expect(counts[trait]).toBeGreaterThan(0);
    }
    // PLAINS (~55 %) dominates each resource trait (~15 %).
    expect(counts.PLAINS).toBeGreaterThan(counts.DENSE_FOREST);
    expect(counts.PLAINS).toBeGreaterThan(counts.RICH_QUARRY);
    expect(counts.PLAINS).toBeGreaterThan(counts.IRON_VEIN);
  });
});

describe("NATURAL_TRAIT_PRODUCTION_BONUS", () => {
  it("boosts exactly the matching resource and PLAINS boosts nothing", () => {
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.DENSE_FOREST).toEqual({ WOOD: 1.1 });
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.RICH_QUARRY).toEqual({ STONE: 1.1 });
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.IRON_VEIN).toEqual({ IRON: 1.1 });
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.PLAINS).toEqual({});
  });
});
