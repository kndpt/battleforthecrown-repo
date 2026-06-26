/**
 * Defensive-friends contract shared between backend and frontends.
 *
 * Server-authoritative: the backend owns the {@link FriendshipStatus} lifecycle
 * (PENDING → ACTIVE) and the {@link DEFENSIVE_FRIENDS_CAP} enforcement. The
 * frontend only renders the three buckets returned by `GET …/friendships/me`.
 */

/** A friendship is PENDING until the recipient accepts it; only ACTIVE links grant reinforcement rights. */
export type FriendshipStatus = "PENDING" | "ACTIVE";

/**
 * One friendship row as seen by the caller. `otherUserId`/`otherDisplayName`
 * always describe the *other* player (never the caller), whichever side the
 * caller sits on.
 */
export interface FriendshipDto {
  id: string;
  worldId: string;
  status: FriendshipStatus;
  otherUserId: string;
  otherDisplayName: string;
  /** True when the caller is the requester (matters for the PENDING buckets). */
  isRequester: boolean;
  createdAt: string;
  acceptedAt: string | null;
}

/**
 * Response of `GET /worlds/:worldId/friendships/me`, split into the three
 * buckets the management sheet renders.
 */
export interface MyFriendshipsResponse {
  /** ACTIVE friendships — reinforcement allowed both ways. */
  active: FriendshipDto[];
  /** PENDING requests the caller sent and awaits acceptance on. */
  pendingOut: FriendshipDto[];
  /** PENDING requests the caller received and can accept/refuse. */
  pendingIn: FriendshipDto[];
}
