import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { queryKeys } from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { WorldSessionGate } from './WorldSessionGate';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function renderGate(queryClient: QueryClient) {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <WorldSessionGate>
          <div>game content</div>
        </WorldSessionGate>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clearSession();
  useGameStore.getState().clear();
});

afterEach(() => {
  useAuthStore.getState().clearSession();
  useGameStore.getState().clear();
});

describe('WorldSessionGate — village conquis (joueur sans village)', () => {
  it('affiche LostKingdomScreen et pas le panneau erreur quand memberships OK mais villages vide', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', displayName: 'Alice' },
    });

    const queryClient = makeQueryClient();
    queryClient.setQueryData(queryKeys.myMemberships('u1'), [
      {
        worldId: 'w1',
        worldName: 'Monde Test',
        role: 'PLAYER',
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: '2026-06-01T00:00:00.000Z',
        villageCount: 0,
      },
    ]);
    queryClient.setQueryData(queryKeys.myVillages('u1', 'w1'), []);

    renderGate(queryClient);

    expect(screen.getByText('Ton village a été pris.')).toBeInTheDocument();
    expect(screen.queryByText('Impossible de charger ton royaume.')).not.toBeInTheDocument();
    expect(screen.getByText('Revenir sur ce monde')).toBeInTheDocument();
  });

  it('affiche LostKingdomScreen même avec un villageId persisté obsolète', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', displayName: 'Alice' },
    });
    useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v-lost' });

    const queryClient = makeQueryClient();
    queryClient.setQueryData(queryKeys.myMemberships('u1'), [
      {
        worldId: 'w1',
        worldName: 'Monde Test',
        role: 'PLAYER',
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: '2026-06-01T00:00:00.000Z',
        villageCount: 0,
      },
    ]);
    queryClient.setQueryData(queryKeys.myVillages('u1', 'w1'), []);

    renderGate(queryClient);

    expect(screen.getByText('Ton village a été pris.')).toBeInTheDocument();
    expect(screen.queryByText('game content')).not.toBeInTheDocument();
  });

  it("n'affiche pas le game content quand le joueur n'a plus de village", () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', displayName: 'Alice' },
    });

    const queryClient = makeQueryClient();
    queryClient.setQueryData(queryKeys.myMemberships('u1'), [
      {
        worldId: 'w1',
        worldName: 'Monde Test',
        role: 'PLAYER',
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: null,
        villageCount: 0,
      },
    ]);
    queryClient.setQueryData(queryKeys.myVillages('u1', 'w1'), []);

    renderGate(queryClient);

    expect(screen.queryByText('game content')).not.toBeInTheDocument();
  });
});
