import { describe, expect, it } from "vitest";
import {
  computeCycleBoundaries,
  computeFirstCycleStart,
  currentCycleIndex,
  formatRankingCycleTitleLabel,
  latestDueCycleIndex,
  resolveCycleChampions,
  MS_PER_WEEKLY_CYCLE,
} from "./cycle";

const MONDAY_RESET = { resetDayUtc: 1, resetHourUtc: 0 };

// 2026-06-01 is a Monday (UTC).
const MON_JUN_01 = new Date("2026-06-01T00:00:00.000Z");

describe("computeFirstCycleStart", () => {
  it("returns the same instant when created exactly on a reset boundary (inclusive)", () => {
    expect(computeFirstCycleStart(MON_JUN_01, MONDAY_RESET).toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
  });

  it("waits for the next Monday 00:00 UTC when created mid-week", () => {
    // Wednesday 2026-06-03 14:30 → next Monday 2026-06-08.
    const created = new Date("2026-06-03T14:30:00.000Z");
    expect(computeFirstCycleStart(created, MONDAY_RESET).toISOString()).toBe(
      "2026-06-08T00:00:00.000Z",
    );
  });

  it("bumps a week when created on the reset day but past the reset hour", () => {
    // Monday 12:00 → reset moment 00:00 already passed → next Monday.
    const created = new Date("2026-06-01T12:00:00.000Z");
    expect(computeFirstCycleStart(created, MONDAY_RESET).toISOString()).toBe(
      "2026-06-08T00:00:00.000Z",
    );
  });

  it("is invariant to DST since it operates purely in UTC", () => {
    // Late March, around EU DST switch — UTC math is unaffected.
    const created = new Date("2026-03-29T10:00:00.000Z"); // Sunday
    expect(computeFirstCycleStart(created, MONDAY_RESET).toISOString()).toBe(
      "2026-03-30T00:00:00.000Z",
    );
  });
});

describe("computeCycleBoundaries", () => {
  it("cycle 1 spans the first full week from the boundary", () => {
    const b = computeCycleBoundaries(MON_JUN_01, 1, MONDAY_RESET);
    expect(b.cycleStartAt.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(b.cycleEndAt.toISOString()).toBe("2026-06-08T00:00:00.000Z");
  });

  it("cycle N is offset by N-1 weeks", () => {
    const b = computeCycleBoundaries(MON_JUN_01, 3, MONDAY_RESET);
    expect(b.cycleStartAt.toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(b.cycleEndAt.toISOString()).toBe("2026-06-22T00:00:00.000Z");
  });

  it("end is exactly one week after start", () => {
    const b = computeCycleBoundaries(MON_JUN_01, 5, MONDAY_RESET);
    expect(b.cycleEndAt.getTime() - b.cycleStartAt.getTime()).toBe(
      MS_PER_WEEKLY_CYCLE,
    );
  });
});

describe("currentCycleIndex", () => {
  const created = new Date("2026-06-03T14:30:00.000Z"); // first start = Jun 08

  it("is 0 during the pre-cycle (before the first boundary)", () => {
    expect(
      currentCycleIndex(created, new Date("2026-06-05T00:00:00.000Z"), MONDAY_RESET),
    ).toBe(0);
  });

  it("is 1 right at the first boundary", () => {
    expect(
      currentCycleIndex(created, new Date("2026-06-08T00:00:00.000Z"), MONDAY_RESET),
    ).toBe(1);
  });

  it("advances each week", () => {
    expect(
      currentCycleIndex(created, new Date("2026-06-20T12:00:00.000Z"), MONDAY_RESET),
    ).toBe(2);
  });
});

describe("latestDueCycleIndex", () => {
  const created = new Date("2026-06-03T14:30:00.000Z"); // first start = Jun 08

  it("is 0 before any cycle has fully elapsed", () => {
    expect(
      latestDueCycleIndex(created, new Date("2026-06-10T00:00:00.000Z"), MONDAY_RESET),
    ).toBe(0);
  });

  it("is 1 once the first cycle has closed", () => {
    expect(
      latestDueCycleIndex(created, new Date("2026-06-15T00:00:00.000Z"), MONDAY_RESET),
    ).toBe(1);
  });

  it("catches up multiple missed cycles in one evaluation", () => {
    // 3 full weeks after the first boundary → cycles 1,2,3 all due.
    expect(
      latestDueCycleIndex(created, new Date("2026-06-29T00:05:00.000Z"), MONDAY_RESET),
    ).toBe(3);
  });
});

describe("resolveCycleChampions", () => {
  it("returns the single top scorer", () => {
    expect(
      resolveCycleChampions([
        { userId: "a", score: 50 },
        { userId: "b", score: 120 },
        { userId: "c", score: 10 },
      ]),
    ).toEqual(["b"]);
  });

  it("returns every user tied for rank 1", () => {
    expect(
      resolveCycleChampions([
        { userId: "a", score: 120 },
        { userId: "b", score: 120 },
        { userId: "c", score: 10 },
      ]),
    ).toEqual(["a", "b"]);
  });

  it("awards nobody when the top score is 0 (no PvP this cycle)", () => {
    expect(
      resolveCycleChampions([
        { userId: "a", score: 0 },
        { userId: "b", score: 0 },
      ]),
    ).toEqual([]);
  });

  it("awards nobody on an empty leaderboard", () => {
    expect(resolveCycleChampions([])).toEqual([]);
  });
});

describe("formatRankingCycleTitleLabel", () => {
  it("composes signal + week + world", () => {
    expect(formatRankingCycleTitleLabel("ASSAULT_GLORY", 3, "Avalon")).toBe(
      "Champion d'Assaut · Semaine 3 · Avalon",
    );
    expect(formatRankingCycleTitleLabel("RAMPART_GLORY", 1, "Aubeforge")).toBe(
      "Champion du Rempart · Semaine 1 · Aubeforge",
    );
  });
});
