import { describe, expect, it } from "vitest";
import type { UnitType } from "../army/types";
import {
  applyPairDiminishingReturns,
  calculateOpponentMultiplier,
  calculateRawBattleValue,
  getBattleUnitValue,
  splitPointsByWeights,
} from "./formulas";
import {
  BATTLE_UNIT_VALUES,
  GLORY_OPPONENT_MULTIPLIER,
  GLORY_PAIR_24H_THRESHOLDS,
} from "./consts";

describe("getBattleUnitValue", () => {
  it("returns the tabulated value for a known unit", () => {
    expect(getBattleUnitValue("MILITIA")).toBe(BATTLE_UNIT_VALUES.MILITIA);
    expect(getBattleUnitValue("NOBLE")).toBe(BATTLE_UNIT_VALUES.NOBLE);
  });

  it("falls back to 0 for an unknown unit type (defensive guard)", () => {
    expect(getBattleUnitValue("UNKNOWN" as UnitType)).toBe(0);
  });
});

describe("calculateRawBattleValue", () => {
  it("sums value × quantity across losses", () => {
    // 2 × 3 (MILITIA) + 12 × 2 (WARRIOR) = 6 + 24
    expect(calculateRawBattleValue({ MILITIA: 3, WARRIOR: 2 })).toBe(30);
  });

  it("ignores non-positive and non-finite quantities", () => {
    expect(
      calculateRawBattleValue({
        MILITIA: -1,
        WARRIOR: Number.NaN,
        ARCHER: 0,
        SQUIRE: 2,
      }),
    ).toBe(BATTLE_UNIT_VALUES.SQUIRE * 2);
  });

  it("returns 0 for empty losses", () => {
    expect(calculateRawBattleValue({})).toBe(0);
  });
});

describe("calculateOpponentMultiplier", () => {
  it("passes a mid-range power ratio through unclamped", () => {
    expect(calculateOpponentMultiplier(100, 80)).toBeCloseTo(0.8);
  });

  it("clamps to the max when the opponent is far stronger", () => {
    expect(calculateOpponentMultiplier(100, 500)).toBe(
      GLORY_OPPONENT_MULTIPLIER.max,
    );
  });

  it("clamps to the min when the opponent is far weaker", () => {
    expect(calculateOpponentMultiplier(500, 100)).toBe(
      GLORY_OPPONENT_MULTIPLIER.min,
    );
  });

  it("returns 1 for non-positive or non-finite powers", () => {
    expect(calculateOpponentMultiplier(0, 100)).toBe(1);
    expect(calculateOpponentMultiplier(100, 0)).toBe(1);
    expect(calculateOpponentMultiplier(-100, 100)).toBe(1);
    expect(calculateOpponentMultiplier(Number.NaN, 100)).toBe(1);
    expect(calculateOpponentMultiplier(100, Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("applyPairDiminishingReturns", () => {
  it("returns 0 for non-positive or non-finite raw points", () => {
    expect(applyPairDiminishingReturns(0, 0)).toBe(0);
    expect(applyPairDiminishingReturns(-100, 0)).toBe(0);
    expect(applyPairDiminishingReturns(Number.NaN, 0)).toBe(0);
  });

  it("credits points fully while inside the full tier", () => {
    expect(applyPairDiminishingReturns(1_000, 0)).toBe(1_000);
  });

  it("halves the fraction that spills into the half tier", () => {
    // 2000 @ 1.0 + 1000 @ 0.5
    expect(applyPairDiminishingReturns(3_000, 0)).toBe(2_500);
  });

  it("applies 0.2 to the fraction beyond the half threshold", () => {
    // full 2000 @1.0 + half room 3000 @0.5 + 1000 @0.2
    expect(applyPairDiminishingReturns(6_000, 0)).toBe(2_000 + 1_500 + 200);
  });

  it("uses the previous 24h total as the starting cursor", () => {
    // previous already fills the full tier → everything lands in the half tier
    expect(applyPairDiminishingReturns(1_000, GLORY_PAIR_24H_THRESHOLDS.full)).toBe(
      500,
    );
    // previous beyond the half threshold → everything at 0.2
    expect(applyPairDiminishingReturns(1_000, 6_000)).toBe(200);
  });

  it("floors the effective points", () => {
    // 2000 @1.0 + 1 @0.5 = 2000.5 → 2000
    expect(applyPairDiminishingReturns(2_001, 0)).toBe(2_000);
  });

  it("treats a negative previous total as zero", () => {
    expect(applyPairDiminishingReturns(1_000, -500)).toBe(1_000);
  });
});

describe("splitPointsByWeights", () => {
  it("splits proportionally to the weights", () => {
    expect(
      splitPointsByWeights(100, [
        { id: "a", weight: 1 },
        { id: "b", weight: 1 },
      ]),
    ).toEqual([
      { id: "a", points: 50 },
      { id: "b", points: 50 },
    ]);
  });

  it("distributes rounding remainders to the largest fractional parts first", () => {
    // 10 / 3 = 3.33 each → floors 3,3,3 (sum 9), the 1 leftover goes to the first tie
    const result = splitPointsByWeights(10, [
      { id: "a", weight: 1 },
      { id: "b", weight: 1 },
      { id: "c", weight: 1 },
    ]);
    expect(result).toEqual([
      { id: "a", points: 4 },
      { id: "b", points: 3 },
      { id: "c", points: 3 },
    ]);
  });

  it("conserves the floored total across all recipients", () => {
    const result = splitPointsByWeights(97, [
      { id: "a", weight: 3 },
      { id: "b", weight: 5 },
      { id: "c", weight: 2 },
    ]);
    const sum = result.reduce((acc, item) => acc + item.points, 0);
    expect(sum).toBe(97);
  });

  it("merges duplicate ids by summing their weights", () => {
    expect(
      splitPointsByWeights(100, [
        { id: "a", weight: 1 },
        { id: "a", weight: 1 },
        { id: "b", weight: 2 },
      ]),
    ).toEqual([
      { id: "a", points: 50 },
      { id: "b", points: 50 },
    ]);
  });

  it("ignores non-positive and non-finite weights", () => {
    expect(
      splitPointsByWeights(100, [
        { id: "a", weight: 1 },
        { id: "b", weight: 0 },
        { id: "c", weight: -5 },
        { id: "d", weight: Number.NaN },
      ]),
    ).toEqual([{ id: "a", points: 100 }]);
  });

  it("drops recipients that round down to zero points", () => {
    const result = splitPointsByWeights(3, [
      { id: "a", weight: 100 },
      { id: "b", weight: 1 },
    ]);
    expect(result).toEqual([{ id: "a", points: 3 }]);
  });

  it("floors the incoming total before splitting", () => {
    expect(
      splitPointsByWeights(10.9, [
        { id: "a", weight: 1 },
        { id: "b", weight: 1 },
      ]),
    ).toEqual([
      { id: "a", points: 5 },
      { id: "b", points: 5 },
    ]);
  });

  it("returns an empty list when the total or total weight is non-positive", () => {
    expect(splitPointsByWeights(0, [{ id: "a", weight: 1 }])).toEqual([]);
    expect(splitPointsByWeights(-10, [{ id: "a", weight: 1 }])).toEqual([]);
    expect(splitPointsByWeights(100, [{ id: "a", weight: 0 }])).toEqual([]);
  });
});
