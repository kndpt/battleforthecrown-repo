import { describe, expect, it } from "vitest";
import {
  applyPairDiminishingReturns,
  calculateOpponentMultiplier,
  splitPointsByWeights,
} from "./index";

describe("rankings formulas", () => {
  it("clamps opponent multiplier and applies 24h diminishing returns", () => {
    expect(calculateOpponentMultiplier(1_000, 100)).toBe(0.35);
    expect(calculateOpponentMultiplier(1_000, 2_000)).toBe(1.25);
    expect(applyPairDiminishingReturns(1_000, 4_500)).toBe(350);
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
