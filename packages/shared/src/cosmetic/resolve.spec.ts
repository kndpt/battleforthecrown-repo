import { describe, expect, it } from "vitest";
import { resolveCosmeticAwards } from "./resolve";
import type { FinalRankingSnapshotRow } from "./resolve";

/** Build a full 3-signal × N-member snapshot the way run 061 writes it. */
function snapshot(
  members: ReadonlyArray<{
    userId: string;
    power: number;
    assault: number;
    rampart: number;
  }>,
): FinalRankingSnapshotRow[] {
  const rank = (
    signal: FinalRankingSnapshotRow["signal"],
    pick: (m: (typeof members)[number]) => number,
  ): FinalRankingSnapshotRow[] =>
    [...members]
      .sort((a, b) => pick(b) - pick(a) || (a.userId < b.userId ? -1 : 1))
      .map((m, i) => ({ userId: m.userId, signal, rank: i + 1, score: pick(m) }));

  return [
    ...rank("POWER", (m) => m.power),
    ...rank("ASSAULT_GLORY", (m) => m.assault),
    ...rank("RAMPART_GLORY", (m) => m.rampart),
  ];
}

describe("resolveCosmeticAwards", () => {
  it("(a) attribue les 3 titres au top 1 de chaque signal", () => {
    const rows = snapshot([
      { userId: "alice", power: 500, assault: 300, rampart: 200 },
      { userId: "bob", power: 100, assault: 50, rampart: 10 },
    ]);

    const awards = resolveCosmeticAwards(rows);

    expect(awards).toEqual([
      { userId: "alice", kind: "POWER_CHAMPION_TITLE" },
      { userId: "alice", kind: "ASSAULT_CHAMPION_TITLE" },
      { userId: "alice", kind: "RAMPART_CHAMPION_TITLE" },
    ]);
  });

  it("(b) score 0 sur Assaut/Rempart → pas de titre, POWER reste attribué", () => {
    // No PvP at all this world: glory champions sit at rank 1 with score 0.
    const rows = snapshot([
      { userId: "alice", power: 500, assault: 0, rampart: 0 },
      { userId: "bob", power: 100, assault: 0, rampart: 0 },
    ]);

    const awards = resolveCosmeticAwards(rows);

    expect(awards).toEqual([{ userId: "alice", kind: "POWER_CHAMPION_TITLE" }]);
  });

  it("(c) tiebreaker: le snapshot casse les ex æquo → un seul rank 1 par signal", () => {
    // Equal scores → run 061 ranks deterministically by userId asc; only the
    // first gets rank 1, so resolveCosmeticAwards yields exactly one champion.
    const rows = snapshot([
      { userId: "bob", power: 200, assault: 100, rampart: 100 },
      { userId: "alice", power: 200, assault: 100, rampart: 100 },
    ]);

    const awards = resolveCosmeticAwards(rows);

    expect(awards).toEqual([
      { userId: "alice", kind: "POWER_CHAMPION_TITLE" },
      { userId: "alice", kind: "ASSAULT_CHAMPION_TITLE" },
      { userId: "alice", kind: "RAMPART_CHAMPION_TITLE" },
    ]);
  });

  it("(d) snapshot vide → aucun award", () => {
    expect(resolveCosmeticAwards([])).toEqual([]);
  });

  it("(e) un champion POWER différent du champion gloire → awards répartis", () => {
    const rows = snapshot([
      { userId: "alice", power: 900, assault: 10, rampart: 5 },
      { userId: "bob", power: 100, assault: 400, rampart: 300 },
    ]);

    const awards = resolveCosmeticAwards(rows);

    expect(awards).toContainEqual({ userId: "alice", kind: "POWER_CHAMPION_TITLE" });
    expect(awards).toContainEqual({ userId: "bob", kind: "ASSAULT_CHAMPION_TITLE" });
    expect(awards).toContainEqual({ userId: "bob", kind: "RAMPART_CHAMPION_TITLE" });
    expect(awards).toHaveLength(3);
  });
});
