import { env } from '@/lib/env';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { ApiClient } from './client';
import { gameSocket } from './ws';

export const apiClient = new ApiClient({
  baseUrl: env.apiBaseUrl,
  auth: {
    getTokens: () => {
      const { accessToken, refreshToken } = useAuthStore.getState();
      return { accessToken, refreshToken };
    },
    setTokens: (tokens) => {
      useAuthStore.getState().setTokens(tokens);
      gameSocket.updateToken(tokens.accessToken);
    },
    clearTokens: () => {
      useAuthStore.getState().clearSession();
      useGameStore.getState().clear();
    },
  },
  gameContext: {
    getWorldId: () => useGameStore.getState().worldId,
    getVillageId: () => useGameStore.getState().villageId,
  },
});

export { ApiClient, ApiError } from './client';
export type {
  AuthSession,
  AuthTokens,
  AuthUser,
  BuildingDto,
  JoinedVillage,
  PopulationDto,
  QueueEntryDto,
  UpgradeResponseDto,
  World,
  WorldMembership,
} from './types';
