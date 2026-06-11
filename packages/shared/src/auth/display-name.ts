import { z } from 'zod';

export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_PATTERN = /^[A-Za-z0-9 _'-]+$/;

export const DISPLAY_NAME_COLLISION_MESSAGE = 'Nom de joueur déjà pris';

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
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
