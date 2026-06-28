import { describe, expect, it } from "vitest";
import type {
  FriendshipDto,
  MyFriendshipsResponse,
} from "@battleforthecrown/shared/social";
import {
  acceptFriendshipLocal,
  activeFriendOwnerIds,
  isDefensiveFriendsCapReached,
  removeFriendshipLocal,
} from "./friendshipsCache";

function friend(overrides: Partial<FriendshipDto>): FriendshipDto {
  return {
    id: "f1",
    worldId: "w1",
    status: "ACTIVE",
    otherUserId: "u-other",
    otherDisplayName: "Other",
    isRequester: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    acceptedAt: null,
    ...overrides,
  };
}

function response(
  overrides: Partial<MyFriendshipsResponse>,
): MyFriendshipsResponse {
  return { active: [], pendingOut: [], pendingIn: [], ...overrides };
}

describe("isDefensiveFriendsCapReached", () => {
  it("is false below the cap and for undefined", () => {
    expect(isDefensiveFriendsCapReached(undefined)).toBe(false);
    expect(
      isDefensiveFriendsCapReached(
        response({ active: [friend({ id: "a" }), friend({ id: "b" })] }),
      ),
    ).toBe(false);
  });

  it("is true once five ACTIVE friends are held", () => {
    const active = Array.from({ length: 5 }, (_, i) =>
      friend({ id: `a${i}` }),
    );
    expect(isDefensiveFriendsCapReached(response({ active }))).toBe(true);
  });
});

describe("activeFriendOwnerIds", () => {
  it("collects the otherUserId of every ACTIVE friend", () => {
    const ids = activeFriendOwnerIds(
      response({
        active: [
          friend({ id: "a", otherUserId: "owner-1" }),
          friend({ id: "b", otherUserId: "owner-2" }),
        ],
      }),
    );
    expect(ids).toEqual(new Set(["owner-1", "owner-2"]));
  });

  it("is empty for undefined", () => {
    expect(activeFriendOwnerIds(undefined).size).toBe(0);
  });
});

describe("removeFriendshipLocal", () => {
  it("drops the id from whichever bucket holds it, leaving others intact", () => {
    const before = response({
      active: [friend({ id: "a" })],
      pendingOut: [friend({ id: "out", status: "PENDING", isRequester: true })],
      pendingIn: [friend({ id: "in", status: "PENDING" })],
    });
    const after = removeFriendshipLocal(before, "out");
    expect(after.pendingOut).toHaveLength(0);
    expect(after.active).toHaveLength(1);
    expect(after.pendingIn).toHaveLength(1);
    // pure: original untouched
    expect(before.pendingOut).toHaveLength(1);
  });
});

describe("acceptFriendshipLocal", () => {
  it("moves a pendingIn request into active as ACTIVE", () => {
    const before = response({
      active: [friend({ id: "a" })],
      pendingIn: [friend({ id: "in", status: "PENDING", otherUserId: "u2" })],
    });
    const after = acceptFriendshipLocal(before, "in");
    expect(after.pendingIn).toHaveLength(0);
    expect(after.active.map((f) => f.id)).toContain("in");
    expect(after.active.find((f) => f.id === "in")?.status).toBe("ACTIVE");
    // pure: original untouched
    expect(before.pendingIn).toHaveLength(1);
  });

  it("is a no-op when the id is not a received request", () => {
    const before = response({
      pendingOut: [friend({ id: "out", status: "PENDING", isRequester: true })],
    });
    expect(acceptFriendshipLocal(before, "out")).toBe(before);
  });
});
