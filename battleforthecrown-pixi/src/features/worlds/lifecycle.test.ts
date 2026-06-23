import { describe, expect, it } from "vitest";
import { isWorldReadOnly } from "./lifecycle";

describe("isWorldReadOnly", () => {
  it("is read-only only for ENDED worlds", () => {
    expect(isWorldReadOnly("ENDED")).toBe(true);
  });

  it("is writable for active world statuses", () => {
    expect(isWorldReadOnly("OPEN")).toBe(false);
    expect(isWorldReadOnly("LOCKED")).toBe(false);
    expect(isWorldReadOnly("PLANNED")).toBe(false);
  });

  it("defaults to writable when status is unknown", () => {
    expect(isWorldReadOnly(null)).toBe(false);
    expect(isWorldReadOnly(undefined)).toBe(false);
  });
});
