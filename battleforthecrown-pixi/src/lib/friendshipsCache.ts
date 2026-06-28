import {
  DEFENSIVE_FRIENDS_CAP,
  type FriendshipDto,
  type MyFriendshipsResponse,
} from "@battleforthecrown/shared/social";

/** Empty buckets — used while no world is selected / before the first fetch. */
export const EMPTY_FRIENDSHIPS: MyFriendshipsResponse = {
  active: [],
  pendingOut: [],
  pendingIn: [],
};

/** True once the caller holds the hard cap of ACTIVE defensive friends. */
export function isDefensiveFriendsCapReached(
  response: MyFriendshipsResponse | undefined,
): boolean {
  return (response?.active.length ?? 0) >= DEFENSIVE_FRIENDS_CAP;
}

/** Owner ids of the caller's ACTIVE defensive friends (for reinforce targeting). */
export function activeFriendOwnerIds(
  response: MyFriendshipsResponse | undefined,
): Set<string> {
  return new Set((response?.active ?? []).map((f) => f.otherUserId));
}

/**
 * Optimistic removal of a friendship (any bucket) by id. Pure — returns a new
 * response so the previous snapshot can roll the cache back on error.
 */
export function removeFriendshipLocal(
  response: MyFriendshipsResponse,
  id: string,
): MyFriendshipsResponse {
  return {
    active: response.active.filter((f) => f.id !== id),
    pendingOut: response.pendingOut.filter((f) => f.id !== id),
    pendingIn: response.pendingIn.filter((f) => f.id !== id),
  };
}

/**
 * Optimistic accept: move a `pendingIn` request to `active`. Pure. `acceptedAt`
 * stays as-is (null) — the server's value lands on the next invalidation. A
 * no-op if the id is not a pending-in request.
 */
export function acceptFriendshipLocal(
  response: MyFriendshipsResponse,
  id: string,
): MyFriendshipsResponse {
  const target = response.pendingIn.find((f) => f.id === id);
  if (!target) return response;
  const accepted: FriendshipDto = { ...target, status: "ACTIVE" };
  return {
    active: [accepted, ...response.active],
    pendingOut: response.pendingOut,
    pendingIn: response.pendingIn.filter((f) => f.id !== id),
  };
}
