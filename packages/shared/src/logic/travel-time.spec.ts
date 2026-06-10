import { describe, expect, it } from "vitest";
import {
  CARAVAN_CAPACITY_SHARE,
  getCaravanResourceCapacity,
} from "./travel-time";

describe("getCaravanResourceCapacity", () => {
  it("caps each resource at the caravan capacity share", () => {
    expect(CARAVAN_CAPACITY_SHARE).toBe(0.2);

    expect(
      getCaravanResourceCapacity({ wood: 1000, stone: 2000, iron: 3000 }),
    ).toEqual({ wood: 200, stone: 400, iron: 600 });
  });

  it("floors fractional per-resource capacity", () => {
    expect(
      getCaravanResourceCapacity({ wood: 999, stone: 1001, iron: 4 }),
    ).toEqual({ wood: 199, stone: 200, iron: 0 });
  });
});
