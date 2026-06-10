import { describe, expect, it } from "vitest";
import {
  BATTLE_UNIT_VALUES,
  GLORY_OPPONENT_MULTIPLIER,
  GLORY_PAIR_24H_THRESHOLDS,
  applyPairDiminishingReturns,
  calculateOpponentMultiplier,
  splitPointsByWeights,
} from "./index";

describe("rankings formulas", () => {
  it("keeps the glory constants explicit", () => {
    expect(BATTLE_UNIT_VALUES.NOBLE).toBe(400);
    expect(GLORY_OPPONENT_MULTIPLIER).toEqual({ min: 0.35, max: 1.25 });
    expect(GLORY_PAIR_24H_THRESHOLDS).toEqual({ full: 2_000, half: 5_000 });
  });

  it("clamps opponent multiplier and applies 24h diminishing returns", () => {
    expect(calculateOpponentMultiplier(1_000, 100)).toBe(0.35);
    expect(calculateOpponentMultiplier(1_000, 1_100)).toBe(1.1);
    expect(calculateOpponentMultiplier(1_000, 2_000)).toBe(1.25);
    expect(applyPairDiminishingReturns(1_000, 0)).toBe(1_000);
    expect(applyPairDiminishingReturns(1_000, 1_500)).toBe(750);
    expect(applyPairDiminishingReturns(1_000, 4_500)).toBe(350);
    expect(applyPairDiminishingReturns(1_000, 5_000)).toBe(200);
  });

  it("splits weighted points once per scorer", () => {
    expect(
      splitPointsByWeights(3, [
        { id: "host", weight: 1 },
        { id: "host", weight: 1 },
        { id: "ally", weight: 1 },
      ]),
    ).toEqual([
      { id: "host", points: 2 },
      { id: "ally", points: 1 },
    ]);
  });
});
