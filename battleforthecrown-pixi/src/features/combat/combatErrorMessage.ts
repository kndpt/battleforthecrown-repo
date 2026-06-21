import { ApiError } from '@/api';

/**
 * Maps backend combat `ForbiddenException` codes to player-facing FR messages.
 * The backend throws bare codes (e.g. `POWER_RATIO_FORBIDDEN`); without this
 * mapping the raw code would leak into the UI.
 */
const COMBAT_ERROR_MESSAGES: Record<string, string> = {
  POWER_RATIO_FORBIDDEN: 'Puissance trop faible',
  NEWBIE_SHIELD_ACTIVE: 'Joueur protégé par le bouclier débutant',
};

/**
 * Returns a friendly message for a combat mutation error. Known guard codes are
 * translated; any other `ApiError` falls back to its server message; anything
 * else uses the provided fallback.
 */
export function combatErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return COMBAT_ERROR_MESSAGES[err.message] ?? err.message;
  }
  return fallback;
}
