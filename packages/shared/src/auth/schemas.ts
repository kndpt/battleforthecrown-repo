import { z } from 'zod';
import { displayNameSchema } from './display-name';
import type { AuthSessionResponse } from './types';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
  displayName: displayNameSchema,
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

/** POST /auth/login | /auth/register — client parse strips wire-only fields (e.g. email). */
export const authSessionResponseSchema = z
  .object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    userId: z.string().min(1),
    displayName: displayNameSchema.optional(),
    villageId: z.string().optional(),
  })
  .transform(
    (data): AuthSessionResponse => ({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userId: data.userId,
      displayName: data.displayName ?? 'Joueur',
      villageId: data.villageId,
    }),
  );

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type RefreshRequest = z.infer<typeof refreshSchema>;
