import { ApiError } from "@/api";
import {
  DEFENSIVE_FRIENDS_CAP,
  FRIENDSHIP_ERROR_CODES,
} from "@battleforthecrown/shared/social";

/** Machine-readable `code` carried by a friendship `ApiError` payload, if any. */
export function friendshipErrorCode(err: unknown): string | null {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const code = (err.data as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

// Branch on the backend `code` (never the human message) so each conflict drives
// a distinct, actionable FR message — notably steering the player toward
// `accept` when a symmetric request already exists.
const FRIENDSHIP_ERROR_MESSAGES: Record<string, string> = {
  [FRIENDSHIP_ERROR_CODES.ALREADY_ACTIVE]: "Vous êtes déjà amis défensifs.",
  [FRIENDSHIP_ERROR_CODES.PENDING_AWAITING_ACCEPT]:
    "Ce joueur vous a déjà invité — acceptez sa demande dans « Reçues ».",
  [FRIENDSHIP_ERROR_CODES.CAP_REACHED]: `Cap de ${DEFENSIVE_FRIENDS_CAP} amis défensifs atteint.`,
};

/**
 * Friendly FR message for a friendship mutation error. Known conflict codes map
 * to distinct hints; a 404 means the pseudo is unknown on this world; any other
 * `ApiError` falls back to its server message; anything else uses `fallback`.
 */
export function friendshipErrorMessage(err: unknown, fallback: string): string {
  const code = friendshipErrorCode(err);
  if (code && FRIENDSHIP_ERROR_MESSAGES[code]) {
    return FRIENDSHIP_ERROR_MESSAGES[code];
  }
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return "Aucun joueur trouvé avec ce pseudo sur ce monde.";
    }
    if (err.message) return err.message;
  }
  return fallback;
}
