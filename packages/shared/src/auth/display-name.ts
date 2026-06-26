import { z } from 'zod';

export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_PATTERN = /^[A-Za-z0-9 _'-]+$/;

export const DISPLAY_NAME_COLLISION_MESSAGE = 'Nom de joueur déjà pris';

const ANONYMOUS_PLAYER_ID_SUFFIX = 6;
const ANONYMOUS_PLAYER_MISSING_SUFFIX = '?';

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/**
 * Public-facing fallback when a user's real `displayName` is unavailable
 * (deleted account, snapshot row pointing at a purged user, defensive default).
 * Centralized so leaderboards, scout reports, rankings cycles and world maps
 * all surface the same anonymous label.
 */
export function formatAnonymousPlayerName(userId: string | null | undefined): string {
  if (!userId) return `Joueur ${ANONYMOUS_PLAYER_MISSING_SUFFIX}`;
  return `Joueur ${userId.slice(-ANONYMOUS_PLAYER_ID_SUFFIX)}`;
}

export const displayNameSchema = z
  .string()
  .transform(normalizeDisplayName)
  .pipe(
    z
      .string()
      .min(DISPLAY_NAME_MIN_LENGTH, `Nom : ${DISPLAY_NAME_MIN_LENGTH} caractères minimum`)
      .max(DISPLAY_NAME_MAX_LENGTH, `Nom : ${DISPLAY_NAME_MAX_LENGTH} caractères maximum`)
      .regex(
        DISPLAY_NAME_PATTERN,
        "Caractères autorisés : lettres, chiffres, espace, _ ' -",
      ),
  );
