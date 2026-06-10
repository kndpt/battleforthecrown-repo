import { describe, expect, it } from "vitest";
import { formatScore, periodLabel } from "./rankingsFormat";

describe("RankingsScreen helpers", () => {
  it("formats scores for French readability", () => {
    expect(formatScore(1234567)).toBe(
      (1234567).toLocaleString("fr-FR"),
    );
  });

  it("labels ranking periods", () => {
    expect(periodLabel("LIVE")).toBe("Live");
    expect(periodLabel("WEEKLY")).toBe("Hebdomadaire");
    expect(periodLabel("ALL_TIME")).toBe("Monde entier");
  });
});
