import { ApiError } from '@/api';
import {
  FRIENDSHIP_ERROR_CODES,
  type FriendshipErrorCode,
} from '@battleforthecrown/shared/social';

/**
 * Player-facing FR messages for the machine-readable friendship error codes.
 * The backend throws `ConflictException({ message, code })`; the client branches
 * on `code` (never the human message) so the copy stays UI-owned — notably to
 * steer the user toward `accept` on a symmetric PENDING request.
 */
const FRIENDSHIP_ERROR_MESSAGES: Record<FriendshipErrorCode, string> = {
  [FRIENDSHIP_ERROR_CODES.ALREADY_ACTIVE]:
    'Vous êtes déjà amis défensifs avec ce joueur.',
  [FRIENDSHIP_ERROR_CODES.PENDING_AWAITING_ACCEPT]:
    'Ce joueur vous a déjà envoyé une demande — acceptez-la dans « Reçues ».',
  [FRIENDSHIP_ERROR_CODES.CAP_REACHED]:
    'Limite de 5 amis défensifs atteinte.',
};

/** Reads the `code` field off a NestJS exception body, if present. */
function friendshipErrorCode(err: unknown): FriendshipErrorCode | null {
  if (!(err instanceof ApiError)) return null;
  const data = err.data;
  if (typeof data !== 'object' || data === null) return null;
  const code = (data as { code?: unknown }).code;
  const known = Object.values(FRIENDSHIP_ERROR_CODES) as string[];
  return typeof code === 'string' && known.includes(code)
    ? (code as FriendshipErrorCode)
    : null;
}

/**
 * Returns a friendly message for a friendship mutation error. Known guard codes
 * are translated to distinct FR copy; any other `ApiError` falls back to its
 * server message; anything else uses the provided fallback.
 */
export function friendshipErrorMessage(err: unknown, fallback: string): string {
  const code = friendshipErrorCode(err);
  if (code) return FRIENDSHIP_ERROR_MESSAGES[code];
  if (err instanceof ApiError) return err.message;
  return fallback;
}
