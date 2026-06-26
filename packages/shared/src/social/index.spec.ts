import { describe, expect, it } from "vitest";
import {
  CreateFriendshipSchema,
  DEFENSIVE_FRIENDS_CAP,
  FRIENDSHIP_ERROR_CODES,
} from "./index";

describe("social/friendship contract", () => {
  it("caps defensive friends at 5", () => {
    expect(DEFENSIVE_FRIENDS_CAP).toBe(5);
  });

  it("exposes distinct machine-readable error codes", () => {
    const codes = Object.values(FRIENDSHIP_ERROR_CODES);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain("FRIENDSHIP_ALREADY_ACTIVE");
    expect(codes).toContain("FRIENDSHIP_PENDING_AWAITING_ACCEPT");
    expect(codes).toContain("DEFENSIVE_FRIENDS_CAP_REACHED");
  });

  describe("CreateFriendshipSchema", () => {
    it("accepts exactly one recipient identifier", () => {
      expect(
        CreateFriendshipSchema.safeParse({ recipientUserId: "u1" }).success,
      ).toBe(true);
      expect(
        CreateFriendshipSchema.safeParse({ recipientDisplayName: "Bob" })
          .success,
      ).toBe(true);
    });

    it("rejects zero or both identifiers", () => {
      expect(CreateFriendshipSchema.safeParse({}).success).toBe(false);
      expect(
        CreateFriendshipSchema.safeParse({
          recipientUserId: "u1",
          recipientDisplayName: "Bob",
        }).success,
      ).toBe(false);
    });

    it("rejects empty strings", () => {
      expect(
        CreateFriendshipSchema.safeParse({ recipientUserId: "" }).success,
      ).toBe(false);
    });
  });
});
