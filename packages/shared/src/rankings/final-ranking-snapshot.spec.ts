import { describe, expect, it } from "vitest";
import { rankSnapshotEntries } from "./final-ranking-snapshot";

describe("rankSnapshotEntries", () => {
  it("(a) trie par score desc", () => {
    const result = rankSnapshotEntries([
      { userId: "user-b", score: 100 },
      { userId: "user-a", score: 500 },
      { userId: "user-c", score: 300 },
    ]);
    expect(result.map((e) => e.userId)).toEqual(["user-a", "user-c", "user-b"]);
    expect(result.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it("(b) tiebreaker userId asc sur scores égaux", () => {
    const result = rankSnapshotEntries([
      { userId: "user-z", score: 200 },
      { userId: "user-a", score: 200 },
      { userId: "user-m", score: 200 },
    ]);
    expect(result.map((e) => e.userId)).toEqual(["user-a", "user-m", "user-z"]);
    expect(result.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it("(c) membres score=0 inclus et classés derniers", () => {
    const result = rankSnapshotEntries([
      { userId: "user-b", score: 0 },
      { userId: "user-a", score: 100 },
      { userId: "user-c", score: 0 },
    ]);
    expect(result[0]).toEqual({ userId: "user-a", score: 100, rank: 1 });
    expect(result[1]).toEqual({ userId: "user-b", score: 0, rank: 2 });
    expect(result[2]).toEqual({ userId: "user-c", score: 0, rank: 3 });
  });

  it("(d) déterminisme — même résultat quel que soit l'ordre d'entrée", () => {
    const inputs = [
      { userId: "user-b", score: 50 },
      { userId: "user-a", score: 50 },
      { userId: "user-c", score: 100 },
    ];
    const reversed = [...inputs].reverse();
    expect(rankSnapshotEntries(inputs)).toEqual(rankSnapshotEntries(reversed));
  });

  it("(e) tableau vide → tableau vide", () => {
    expect(rankSnapshotEntries([])).toEqual([]);
  });
});
