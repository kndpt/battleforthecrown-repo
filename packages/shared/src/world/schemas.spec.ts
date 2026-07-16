import { describe, expect, it } from "vitest";
import { DEFAULT_WORLD_CONFIG } from "./world";
import { DEFAULT_LOOT_DISTANCE_CONFIG, WorldConfigSchema } from "./schemas";

describe("WorldConfigSchema — rétrocompat des configs persistées", () => {
  it("accepte un combat sans lootDistance et applique le défaut", () => {
    const legacy = structuredClone(DEFAULT_WORLD_CONFIG) as Record<
      string,
      unknown
    > & { combat: Record<string, unknown> };
    delete legacy.combat.lootDistance;

    const parsed = WorldConfigSchema.parse(legacy);

    expect(parsed.combat.lootDistance).toEqual(DEFAULT_LOOT_DISTANCE_CONFIG);
  });

  it("préserve un lootDistance explicite", () => {
    const tuned = structuredClone(DEFAULT_WORLD_CONFIG);
    tuned.combat.lootDistance = { radius: 10, slope: 0.02, floor: 0.25 };

    const parsed = WorldConfigSchema.parse(tuned);

    expect(parsed.combat.lootDistance).toEqual({
      radius: 10,
      slope: 0.02,
      floor: 0.25,
    });
  });
});
