import type { PublicWorld } from "@battleforthecrown/shared/world";
import { describe, expect, it } from "vitest";
import {
  buildWorldTabCounts,
  filterWorldsByTab,
  toWorldCardViewModel,
} from "./worldsViewModel";

const now = Date.parse("2026-05-25T12:00:00.000Z");

type MakeWorldOverrides = Partial<Omit<PublicWorld, "lifecycle">> & {
  lifecycle?: Partial<PublicWorld["lifecycle"]>;
};

function makeWorld(overrides: MakeWorldOverrides = {}): PublicWorld {
  const { lifecycle: lifecycleOverride, ...rest } = overrides;
  return {
    id: "world-open",
    identity: {
      displayName: "Aubeforge",
      sigil: "crown",
      tagline: "Où les vassaux bâtissent leur légende",
      themeColor: "green",
      tier: "DEBUTANTS",
    },
    joinedCount: 8420,
    lifecycle: {
      day: 5,
      endsAt: "2026-07-19T12:00:00.000Z",
      inscriptionLateDays: 3,
      inscriptionMainDays: 7,
      newbieShieldHours: 72,
      inscriptionPhase: "main",
      plannedOpenAt: null,
      startedAt: "2026-05-20T12:00:00.000Z",
      totalDays: 60,
      archiveAt: null,
      ...lifecycleOverride,
    },
    map: { width: 500, height: 500 },
    status: "OPEN",
    tempoProfile: "standard",
    ...rest,
  };
}

describe("worldsViewModel", () => {
  it("maps OPEN worlds to the inscription tab with a join CTA", () => {
    const model = toWorldCardViewModel(makeWorld(), new Set<string>(), now);

    expect(model.tab).toBe("open");
    expect(model.statusLabel).toBe("INSCRIPTIONS OUVERTES");
    expect(model.ctaKind).toBe("join");
    expect(model.ctaLabel).toBe("S'inscrire");
    expect(model.dayLabel).toBe("J. 5 / 60");
    expect(model.joinedCountLabel).toBe("8 420");
    expect(model.lifecycleInscriptionMainDays).toBe(7);
    expect(model.lifecycleInscriptionLateDays).toBe(3);
    expect(model.mapSizeLabel).toBe("500 × 500");
    expect(model.shieldLabel).toBe("72 h");
    expect(model.personalStats).toBeNull();
    expect(model.tempoLabel).toBe("STANDARD");
    expect(model.tierLabel).toBe("DÉBUTANTS");
  });

  it("maps PLANNED worlds to the bientôt tab with countdown and notify CTA", () => {
    const model = toWorldCardViewModel(
      makeWorld({
        id: "world-planned",
        lifecycle: {
          day: null,
          endsAt: null,
          inscriptionLateDays: 3,
          inscriptionMainDays: 7,
          newbieShieldHours: 48,
          inscriptionPhase: "closed",
          plannedOpenAt: "2026-05-27T02:00:00.000Z",
          startedAt: null,
          totalDays: 60,
        },
        status: "PLANNED",
      }),
      new Set<string>(),
      now,
    );

    expect(model.tab).toBe("planned");
    expect(model.statusLabel).toBe("PLANIFIÉ");
    expect(model.ctaKind).toBe("notify");
    expect(model.dayLabel).toBe("Ouvre dans 1j 14h");
    expect(model.lifecycleDay).toBeNull();
  });

  it("maps LOCKED worlds to the locked tab with uniform wording", () => {
    const model = toWorldCardViewModel(
      makeWorld({
        lifecycle: {
          day: 28,
          endsAt: "2026-06-26T12:00:00.000Z",
          inscriptionLateDays: 3,
          inscriptionMainDays: 7,
          newbieShieldHours: 48,
          inscriptionPhase: "closed",
          plannedOpenAt: null,
          startedAt: "2026-04-27T12:00:00.000Z",
          totalDays: 60,
        },
        status: "LOCKED",
      }),
      new Set<string>(),
      now,
    );

    expect(model.tab).toBe("locked");
    expect(model.statusLabel).toBe("INSCRIPTIONS CLOSES");
    expect(model.ctaKind).toBe("locked");
    expect(model.ctaLabel).toBe("Inscriptions closes");
  });

  it("marks already joined worlds without changing tab counts", () => {
    const model = toWorldCardViewModel(
      makeWorld({ id: "joined-world" }),
      new Set(["joined-world"]),
      now,
    );

    expect(model.tab).toBe("open");
    expect(model.isJoined).toBe(true);
    expect(model.ctaKind).toBe("joined");
    expect(model.ctaLabel).toBe("Entrer");
  });

  it("keeps joined CTA for a LOCKED world the player has already joined", () => {
    // Real gameplay case: inscriptions close while players are already in the world.
    // ctaFor() checks isJoined first so status=LOCKED must not override.
    const model = toWorldCardViewModel(
      makeWorld({ id: "joined-locked-world", status: "LOCKED" }),
      new Set(["joined-locked-world"]),
      now,
    );

    expect(model.isJoined).toBe(true);
    expect(model.ctaKind).toBe("joined");
    expect(model.ctaLabel).toBe("Entrer");
    expect(model.statusLabel).toBe("INSCRIPTIONS CLOSES");
  });

  it("maps an ENDED world (not joined) to a non-engaging consult CTA", () => {
    const model = toWorldCardViewModel(
      makeWorld({
        id: "world-ended",
        status: "ENDED",
        lifecycle: {
          day: 60,
          endsAt: "2026-05-22T12:00:00.000Z",
          inscriptionLateDays: 3,
          inscriptionMainDays: 7,
          newbieShieldHours: 48,
          inscriptionPhase: "closed",
          plannedOpenAt: null,
          startedAt: "2026-03-23T12:00:00.000Z",
          totalDays: 60,
          archiveAt: "2026-05-29T12:00:00.000Z",
        },
      }),
      new Set<string>(),
      now,
    );

    expect(model.tab).toBe("locked");
    expect(model.statusLabel).toBe("TERMINÉ");
    expect(model.ctaKind).toBe("ended");
    expect(model.ctaLabel).toBe("Terminé · consulter");
    expect(model.dayLabel).toBe("Terminé il y a 3j · archivé dans 4j");
  });

  it("keeps the ended CTA for an eliminated member (no « Revenir »)", () => {
    // ENDED must win over the rejoin branch: a member with 0 village on an
    // ended world consults the final state, it never offers to come back.
    const model = toWorldCardViewModel(
      makeWorld({ id: "world-ended", status: "ENDED" }),
      new Set(["world-ended"]),
      now,
      undefined,
      new Map([["world-ended", 0]]),
    );

    expect(model.isJoined).toBe(true);
    expect(model.ctaKind).toBe("ended");
    expect(model.ctaLabel).toBe("Terminé · consulter");
  });

  it("flags imminent archival on an ENDED world past its archive deadline", () => {
    const model = toWorldCardViewModel(
      makeWorld({
        id: "world-ended-archiving",
        status: "ENDED",
        lifecycle: {
          day: 60,
          endsAt: "2026-05-22T12:00:00.000Z",
          inscriptionLateDays: 3,
          inscriptionMainDays: 7,
          newbieShieldHours: 48,
          inscriptionPhase: "closed",
          plannedOpenAt: null,
          startedAt: "2026-03-23T12:00:00.000Z",
          totalDays: 60,
          archiveAt: "2026-05-25T12:00:00.000Z",
        },
      }),
      new Set<string>(),
      now,
    );

    expect(model.dayLabel).toBe("Terminé il y a 3j · archivage imminent");
  });

  it("formats personal stats only for joined worlds with loaded stats", () => {
    const stats = new Map([
      ["joined-world", { kingdomPower: 1234567, villageCount: 2 }],
      ["other-world", { kingdomPower: 999, villageCount: 1 }],
    ]);

    const joined = toWorldCardViewModel(
      makeWorld({ id: "joined-world" }),
      new Set(["joined-world"]),
      now,
      stats,
    );
    const notJoined = toWorldCardViewModel(
      makeWorld({ id: "other-world" }),
      new Set(["joined-world"]),
      now,
      stats,
    );
    const loading = toWorldCardViewModel(
      makeWorld({ id: "loading-world" }),
      new Set(["loading-world"]),
      now,
      stats,
    );

    expect(joined.personalStats).toEqual({
      kingdomPowerLabel: "1 234 567",
      villageCountLabel: "2 villages",
    });
    expect(notJoined.personalStats).toBeNull();
    expect(loading.personalStats).toBeNull();
  });

  it("shows 'Revenir' CTA for joined world with 0 villages", () => {
    const villageCountByWorldId = new Map([["joined-world", 0]]);
    const model = toWorldCardViewModel(
      makeWorld({ id: "joined-world" }),
      new Set(["joined-world"]),
      now,
      new Map(),
      villageCountByWorldId,
    );

    expect(model.isJoined).toBe(true);
    expect(model.ctaKind).toBe("rejoin");
    expect(model.ctaLabel).toBe("Revenir");
  });

  it("shows 'Entrer' CTA for joined world with at least 1 village", () => {
    const villageCountByWorldId = new Map([["joined-world", 2]]);
    const model = toWorldCardViewModel(
      makeWorld({ id: "joined-world" }),
      new Set(["joined-world"]),
      now,
      new Map(),
      villageCountByWorldId,
    );

    expect(model.isJoined).toBe(true);
    expect(model.ctaKind).toBe("joined");
    expect(model.ctaLabel).toBe("Entrer");
  });

  it("shows 'Revenir' CTA for eliminated member on a LOCKED world", () => {
    const villageCountByWorldId = new Map([["joined-locked", 0]]);
    const model = toWorldCardViewModel(
      makeWorld({ id: "joined-locked", status: "LOCKED" }),
      new Set(["joined-locked"]),
      now,
      new Map(),
      villageCountByWorldId,
    );

    expect(model.isJoined).toBe(true);
    expect(model.ctaKind).toBe("rejoin");
    expect(model.ctaLabel).toBe("Revenir");
    expect(model.statusLabel).toBe("INSCRIPTIONS CLOSES");
  });

  it("exposes a launch-age banner and a fresh alternative for a late world", () => {
    const lateWorld = makeWorld({
      id: "late-world",
      lifecycle: {
        day: 9,
        endsAt: "2026-07-15T12:00:00.000Z",
        inscriptionLateDays: 3,
        inscriptionMainDays: 7,
        newbieShieldHours: 72,
        inscriptionPhase: "late",
        plannedOpenAt: null,
        startedAt: "2026-05-17T12:00:00.000Z", // 8 days before now
        totalDays: 60,
      },
    });
    const freshMainWorld = makeWorld({
      id: "fresh-main",
      lifecycle: {
        day: 2,
        endsAt: "2026-07-22T12:00:00.000Z",
        inscriptionLateDays: 3,
        inscriptionMainDays: 7,
        newbieShieldHours: 72,
        inscriptionPhase: "main",
        plannedOpenAt: null,
        startedAt: "2026-05-23T12:00:00.000Z",
        totalDays: 60,
      },
    });

    const model = toWorldCardViewModel(
      lateWorld,
      new Set<string>(),
      now,
      new Map(),
      new Map(),
      [lateWorld, freshMainWorld],
    );

    expect(model.inscriptionPhase).toBe("late");
    expect(model.launchAgeLabel).toBe("Lancé il y a 8 j");
    expect(model.freshAlternativeWorldId).toBe("fresh-main");
  });

  it("hides the launch-age banner and fresh alternative outside the late phase", () => {
    const freshMainWorld = makeWorld({
      id: "fresh-main",
      lifecycle: {
        day: 2,
        endsAt: "2026-07-22T12:00:00.000Z",
        inscriptionLateDays: 3,
        inscriptionMainDays: 7,
        newbieShieldHours: 72,
        inscriptionPhase: "main",
        plannedOpenAt: null,
        startedAt: "2026-05-23T12:00:00.000Z",
        totalDays: 60,
      },
    });

    const mainModel = toWorldCardViewModel(
      makeWorld({ id: "main-world" }),
      new Set<string>(),
      now,
      new Map(),
      new Map(),
      [freshMainWorld],
    );

    expect(mainModel.inscriptionPhase).toBe("main");
    expect(mainModel.launchAgeLabel).toBeNull();
    expect(mainModel.freshAlternativeWorldId).toBeNull();
  });

  it("shows the banner but no alternative when every other world is also late", () => {
    const lateWorld = makeWorld({
      id: "late-world",
      lifecycle: {
        day: 9,
        endsAt: "2026-07-15T12:00:00.000Z",
        inscriptionLateDays: 3,
        inscriptionMainDays: 7,
        newbieShieldHours: 72,
        inscriptionPhase: "late",
        plannedOpenAt: null,
        startedAt: "2026-05-17T12:00:00.000Z",
        totalDays: 60,
      },
    });
    const otherLate = makeWorld({
      id: "other-late",
      lifecycle: {
        day: 8,
        endsAt: "2026-07-16T12:00:00.000Z",
        inscriptionLateDays: 3,
        inscriptionMainDays: 7,
        newbieShieldHours: 72,
        inscriptionPhase: "late",
        plannedOpenAt: null,
        startedAt: "2026-05-18T12:00:00.000Z",
        totalDays: 60,
      },
    });

    const model = toWorldCardViewModel(
      lateWorld,
      new Set<string>(),
      now,
      new Map(),
      new Map(),
      [lateWorld, otherLate],
    );

    expect(model.launchAgeLabel).toBe("Lancé il y a 8 j");
    expect(model.freshAlternativeWorldId).toBeNull();
  });

  it("keeps legacy OPEN worlds explicit when lifecycle start dates are missing", () => {
    const model = toWorldCardViewModel(
      makeWorld({
        lifecycle: {
          day: null,
          endsAt: null,
          inscriptionLateDays: 3,
          inscriptionMainDays: 7,
          newbieShieldHours: 48,
          inscriptionPhase: "closed",
          plannedOpenAt: null,
          startedAt: null,
          totalDays: 60,
        },
      }),
      new Set<string>(),
      now,
    );

    expect(model.dayLabel).toBe("J. ? / 60");
    expect(model.lifecycleDay).toBeNull();
  });

  it("builds tab counts and filters from client-side derived status groups", () => {
    const models = [
      toWorldCardViewModel(makeWorld({ id: "open-1" }), new Set<string>(), now),
      toWorldCardViewModel(
        makeWorld({ id: "planned-1", status: "PLANNED" }),
        new Set<string>(),
        now,
      ),
      toWorldCardViewModel(
        makeWorld({ id: "locked-1", status: "LOCKED" }),
        new Set<string>(),
        now,
      ),
      toWorldCardViewModel(makeWorld({ id: "open-2" }), new Set<string>(), now),
    ];

    expect(buildWorldTabCounts(models)).toEqual({
      locked: 1,
      open: 2,
      planned: 1,
    });
    expect(filterWorldsByTab(models, "open").map((world) => world.id)).toEqual([
      "open-1",
      "open-2",
    ]);
    expect(
      filterWorldsByTab(models, "planned").map((world) => world.id),
    ).toEqual(["planned-1"]);
    expect(
      filterWorldsByTab(models, "locked").map((world) => world.id),
    ).toEqual(["locked-1"]);
  });
});
