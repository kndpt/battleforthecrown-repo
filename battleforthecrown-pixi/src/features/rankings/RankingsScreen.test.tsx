import { describe, expect, it } from "vitest";
import { formatScore } from "./rankingsFormat";

describe("RankingsScreen helpers", () => {
  it("formats scores for French readability", () => {
    expect(formatScore(1234567)).toBe(
      (1234567).toLocaleString("fr-FR"),
    );
  });
});
