/**
 * Defensive-friends caps and machine-readable error codes.
 *
 * The cap is a MVP-hard constant (cf. `docs/gameplay/20-defensive-friends.md`).
 * Kept here — never inlined backend-side — so a future `WorldConfig` override
 * stays a single-source change (out of scope at MVP).
 */
export const DEFENSIVE_FRIENDS_CAP = 5;

/**
 * Machine-readable error codes returned by the friendship endpoints. The client
 * branches on these (never on the human message) to drive the correct UX flow.
 */
export const FRIENDSHIP_ERROR_CODES = {
  /** An ACTIVE friendship already links the two players on this world. */
  ALREADY_ACTIVE: "FRIENDSHIP_ALREADY_ACTIVE",
  /**
   * A symmetric PENDING request already exists (the other player asked first).
   * The caller must accept it via `pendingIn`, not create a mirror request.
   */
  PENDING_AWAITING_ACCEPT: "FRIENDSHIP_PENDING_AWAITING_ACCEPT",
  /** Either side already holds {@link DEFENSIVE_FRIENDS_CAP} ACTIVE friends. */
  CAP_REACHED: "DEFENSIVE_FRIENDS_CAP_REACHED",
} as const;

export type FriendshipErrorCode =
  (typeof FRIENDSHIP_ERROR_CODES)[keyof typeof FRIENDSHIP_ERROR_CODES];
