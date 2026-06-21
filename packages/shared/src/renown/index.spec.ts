import { describe, expect, it } from "vitest";
import {
  RENOWN_BARBARIAN_CONQUEST_FACTOR,
  RENOWN_CONQUEST_BASE,
  RENOWN_LEVEL_BASE,
  RENOWN_RANKING_BONUS,
  renownCombatXp,
  renownConquestXp,
  renownConstructionXp,
  renownLevelForXp,
  renownRankingBonus,
  renownStatusForXp,
  xpForLevel,
} from "./index";

describe("renown constants", () => {
  it("keeps the balancing constants explicit", () => {
    expect(RENOWN_LEVEL_BASE).toBe(250);
    expect(RENOWN_CONQUEST_BASE).toBe(500);
    expect(RENOWN_BARBARIAN_CONQUEST_FACTOR).toBeCloseTo(1 / 3);
    expect(RENOWN_RANKING_BONUS).toEqual({
      top1: 5_000,
      top10: 2_000,
      top100: 500,
      participation: 100,
    });
  });
});

describe("renown level curve", () => {
  it("computes cumulative xp thresholds", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(500);
    expect(xpForLevel(3)).toBe(1_500);
    expect(xpForLevel(4)).toBe(3_000);
    expect(xpForLevel(5)).toBe(5_000);
  });

  it("inverts the curve (level for xp)", () => {
    expect(renownLevelForXp(0)).toBe(1);
    expect(renownLevelForXp(-100)).toBe(1);
    expect(renownLevelForXp(499)).toBe(1);
    expect(renownLevelForXp(500)).toBe(2);
    expect(renownLevelForXp(1_499)).toBe(2);
    expect(renownLevelForXp(1_500)).toBe(3);
    expect(renownLevelForXp(5_000)).toBe(5);
  });

  it("round-trips xpForLevel ∘ renownLevelForXp on threshold values", () => {
    for (let level = 1; level <= 50; level += 1) {
      const threshold = xpForLevel(level);
      expect(renownLevelForXp(threshold)).toBe(level);
      // one xp below the threshold is still the previous level
      if (level > 1) expect(renownLevelForXp(threshold - 1)).toBe(level - 1);
    }
  });

  it("derives a full status with progress within the level", () => {
    expect(renownStatusForXp(1_750)).toEqual({
      xp: 1_750,
      level: 3,
      currentLevelXp: 1_500,
      nextLevelXp: 3_000,
      xpIntoLevel: 250,
      xpForNextLevel: 1_500,
    });
    expect(renownStatusForXp(0)).toEqual({
      xp: 0,
      level: 1,
      currentLevelXp: 0,
      nextLevelXp: 500,
      xpIntoLevel: 0,
      xpForNextLevel: 500,
    });
  });
});

describe("renown xp sources", () => {
  it("weights construction xp by building power weight × level", () => {
    // CASTLE weight = 40
    expect(renownConstructionXp("CASTLE", 3)).toBe(120);
    // unknown type falls back to default weight (5)
    expect(renownConstructionXp("UNKNOWN", 2)).toBe(10);
    expect(renownConstructionXp("CASTLE", 0)).toBe(0);
  });

  it("applies the barbarian factor on conquest xp", () => {
    expect(renownConquestXp(false)).toBe(500);
    expect(renownConquestXp(true)).toBe(167); // round(500 / 3)
  });

  it("derives combat xp from glory points without recalculation", () => {
    expect(renownCombatXp(340)).toBe(340);
    expect(renownCombatXp(-5)).toBe(0);
  });
});

describe("renown ranking bonus", () => {
  it("maps a final rank to its tier bonus", () => {
    expect(renownRankingBonus(1)).toBe(5_000);
    expect(renownRankingBonus(2)).toBe(2_000);
    expect(renownRankingBonus(10)).toBe(2_000);
    expect(renownRankingBonus(11)).toBe(500);
    expect(renownRankingBonus(100)).toBe(500);
    expect(renownRankingBonus(101)).toBe(100);
    expect(renownRankingBonus(0)).toBe(0);
  });
});
