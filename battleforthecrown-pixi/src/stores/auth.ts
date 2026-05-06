import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession, AuthTokens, AuthUser } from '@/api/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (session: AuthSession) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
        }),
      setTokens: (tokens) =>
        set((state) => ({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken ?? state.refreshToken,
        })),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'bftc-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

export function selectIsAuthenticated(state: AuthState): boolean {
  return Boolean(state.accessToken && state.user);
}
