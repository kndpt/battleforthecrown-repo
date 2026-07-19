import { describe, expect, it } from "vitest";
import {
  deriveNaturalTrait,
  NATURAL_TRAIT_POPULATION_BONUS,
  NATURAL_TRAIT_PRODUCTION_BONUS,
  VILLAGE_NATURAL_TRAITS,
  type VillageNaturalTrait,
} from "./traits";

/** Cibles de la distribution pondérée v2 (spec 27 § taxonomie v2). Somme = 1. */
const V2_TARGET_SHARE: Record<VillageNaturalTrait, number> = {
  DENSE_FOREST: 0.15,
  RICH_QUARRY: 0.15,
  IRON_VEIN: 0.15,
  FERTILE_SOIL: 0.15,
  HILL: 0.15,
  PLAINS: 0.25,
};
/** Seuil anti-snowball tranché : PLAINS (futur porteur army-speed) ≤ 30 %. */
const PLAINS_ANTI_SNOWBALL_CEILING = 0.3;

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

  it("hits each v2 target frequency (±tolérance) on a large sample", () => {
    const counts: Record<VillageNaturalTrait, number> = {
      DENSE_FOREST: 0,
      RICH_QUARRY: 0,
      IRON_VEIN: 0,
      PLAINS: 0,
      HILL: 0,
      FERTILE_SOIL: 0,
    };
    const side = 200;
    const total = side * side;
    for (let x = 0; x < side; x++) {
      for (let y = 0; y < side; y++) {
        counts[deriveNaturalTrait("world-dist", x, y)]++;
      }
    }
    // Every trait is reachable and within ±2 pts of its v2 target share.
    const TOLERANCE = 0.02;
    for (const trait of VILLAGE_NATURAL_TRAITS) {
      expect(counts[trait]).toBeGreaterThan(0);
      const share = counts[trait] / total;
      expect(share).toBeGreaterThanOrEqual(V2_TARGET_SHARE[trait] - TOLERANCE);
      expect(share).toBeLessThanOrEqual(V2_TARGET_SHARE[trait] + TOLERANCE);
    }
    // Anti-snowball : PLAINS (futur porteur army-speed) reste sous le plafond.
    expect(counts.PLAINS / total).toBeLessThanOrEqual(
      PLAINS_ANTI_SNOWBALL_CEILING,
    );
    // PLAINS reste la pluralité (25 % > 15 % de chaque autre trait).
    for (const trait of VILLAGE_NATURAL_TRAITS) {
      if (trait !== "PLAINS") {
        expect(counts.PLAINS).toBeGreaterThan(counts[trait]);
      }
    }
  });

  it("keeps the v2 target shares summing to exactly 100 %", () => {
    const sum = VILLAGE_NATURAL_TRAITS.reduce(
      (acc, trait) => acc + V2_TARGET_SHARE[trait],
      0,
    );
    expect(sum).toBeCloseTo(1, 10);
    expect(V2_TARGET_SHARE.PLAINS).toBeLessThanOrEqual(
      PLAINS_ANTI_SNOWBALL_CEILING,
    );
  });
});

describe("NATURAL_TRAIT_PRODUCTION_BONUS", () => {
  it("boosts exactly the matching resource; non-resource traits boost nothing", () => {
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.DENSE_FOREST).toEqual({ WOOD: 1.1 });
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.RICH_QUARRY).toEqual({ STONE: 1.1 });
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.IRON_VEIN).toEqual({ IRON: 1.1 });
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.PLAINS).toEqual({});
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.HILL).toEqual({});
    expect(NATURAL_TRAIT_PRODUCTION_BONUS.FERTILE_SOIL).toEqual({});
  });
});

describe("NATURAL_TRAIT_POPULATION_BONUS", () => {
  it("only FERTILE_SOIL carries a population bonus; all others are neutral", () => {
    expect(NATURAL_TRAIT_POPULATION_BONUS.FERTILE_SOIL).toBe(1.1);
    for (const trait of VILLAGE_NATURAL_TRAITS) {
      if (trait !== "FERTILE_SOIL") {
        expect(NATURAL_TRAIT_POPULATION_BONUS[trait]).toBe(1);
      }
    }
  });
});
