import { describe, expect, it } from "vitest";
import type { MapEntity } from "@/api/world-types";
import {
  aliasFor,
  BASE_BARBARIAN_SIZE,
  BASE_PLAYER_SIZE,
  COLOR,
  ownedHaloRxFactor,
  spriteSizeFor,
  styleFor,
} from "./worldMapEntityStyle";

const player = (overrides: Partial<MapEntity> = {}): MapEntity => ({
  id: "v1",
  kind: "PLAYER_VILLAGE",
  isMine: true,
  x: 10,
  y: 20,
  name: "Hamlet",
  tier: null,
  castleLevel: 1,
  ...overrides,
});

const barbarian = (
  tier: "T1" | "T2" | "T3" | "T4" | "T5" = "T1",
  overrides: Partial<MapEntity> = {},
): MapEntity => ({
  id: "b1",
  kind: "BARBARIAN_VILLAGE",
  isMine: false,
  x: 5,
  y: 5,
  name: "Camp",
  tier,
  ...overrides,
});

const other = (overrides: Partial<MapEntity> = {}): MapEntity => ({
  id: "o1",
  kind: "OTHER",
  isMine: false,
  x: 3,
  y: 3,
  name: "Unknown",
  tier: null,
  ...overrides,
});

describe("spriteSizeFor", () => {
  it("scales player villages by castle tier", () => {
    const s1 = spriteSizeFor(player({ castleLevel: 1 }));
    const s5 = spriteSizeFor(player({ castleLevel: 5 }));
    expect(s1).toBe(BASE_PLAYER_SIZE);
    expect(s5).toBeGreaterThan(s1);
  });

  it("scales barbarians by tier", () => {
    const t1 = spriteSizeFor(barbarian("T1"));
    const t3 = spriteSizeFor(barbarian("T3"));
    expect(t1).toBe(BASE_BARBARIAN_SIZE);
    expect(t3).toBeGreaterThan(t1);
  });

  it("grows strictly monotonically across all five barbarian tiers", () => {
    const sizes = (["T1", "T2", "T3", "T4", "T5"] as const).map((t) =>
      spriteSizeFor(barbarian(t)),
    );
    expect(sizes[0]).toBe(BASE_BARBARIAN_SIZE);
    for (let i = 1; i < sizes.length; i += 1) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
    }
  });

  it("falls back to BASE_BARBARIAN_SIZE for OTHER entities", () => {
    expect(spriteSizeFor(other())).toBe(BASE_BARBARIAN_SIZE);
  });
});

describe("ownedHaloRxFactor", () => {
  it("grows with castle tier", () => {
    const f1 = ownedHaloRxFactor(player({ castleLevel: 1 }));
    const f6 = ownedHaloRxFactor(player({ castleLevel: 10 }));
    expect(f1).toBe(0.44);
    expect(f6).toBe(0.6);
  });

  it("defaults to 0.6 for unknown tiers", () => {
    expect(ownedHaloRxFactor(player({ castleLevel: 99 }))).toBe(0.6);
  });
});

describe("styleFor", () => {
  it("returns myVillage color for own player village", () => {
    const s = styleFor(player({ isMine: true }));
    expect(s.color).toBe(COLOR.myVillage);
    expect(s.zIndex).toBe(10);
  });

  it("gives lower zIndex to other players' villages", () => {
    const s = styleFor(player({ isMine: false }));
    expect(s.zIndex).toBe(9);
  });

  it("returns tier-specific colors for barbarians", () => {
    expect(styleFor(barbarian("T1")).color).toBe(COLOR.barbarianT1);
    expect(styleFor(barbarian("T2")).color).toBe(COLOR.barbarianT2);
    expect(styleFor(barbarian("T3")).color).toBe(COLOR.barbarianT3);
  });

  it("increases barbarian radius with tier", () => {
    const r1 = styleFor(barbarian("T1")).radius;
    const r3 = styleFor(barbarian("T3")).radius;
    expect(r3).toBeGreaterThan(r1);
  });

  it("gives T4/T5 distinct color, ring and radius from T1", () => {
    const t1 = styleFor(barbarian("T1"));
    const t4 = styleFor(barbarian("T4"));
    const t5 = styleFor(barbarian("T5"));
    expect(t4.color).toBe(COLOR.barbarianT4);
    expect(t4.ringColor).toBe(COLOR.barbarianRingT4);
    expect(t5.color).toBe(COLOR.barbarianT5);
    expect(t5.ringColor).toBe(COLOR.barbarianRingT5);
    for (const s of [t4, t5]) {
      expect(s.color).not.toBe(t1.color);
      expect(s.ringColor).not.toBe(t1.ringColor);
      expect(s.radius).toBeGreaterThan(t1.radius);
    }
    expect(t5.radius).toBeGreaterThan(t4.radius);
  });

  it("returns fallback style for OTHER entities", () => {
    const s = styleFor(other());
    expect(s.color).toBe(COLOR.other);
    expect(s.zIndex).toBe(3);
  });
});

describe("aliasFor", () => {
  it("returns village sprite alias for player village", () => {
    const alias = aliasFor(player({ castleLevel: 1 }));
    expect(alias).toBe("world.village.t1");
  });

  it("returns tier-specific alias for barbarians", () => {
    expect(aliasFor(barbarian("T1"))).toBe("world.barbarian.t1");
    expect(aliasFor(barbarian("T2"))).toBe("world.barbarian.t2");
    expect(aliasFor(barbarian("T3"))).toBe("world.barbarian.t3");
  });

  it("returns null for OTHER entities", () => {
    expect(aliasFor(other())).toBeNull();
  });

  it("returns village alias for non-own player villages", () => {
    const alias = aliasFor(player({ isMine: false, castleLevel: 3 }));
    expect(alias).toBe("world.village.t2");
  });
});
