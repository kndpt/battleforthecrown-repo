import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/api/queries';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import { WorldSessionGate } from './WorldSessionGate';

const joinMutateMock = vi.fn();

vi.mock('@/api/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/queries')>();
  return {
    ...actual,
    useJoinWorldMutation: () => ({
      mutate: joinMutateMock,
      isPending: false,
    }),
  };
});

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function seedEliminatedPlayerQueries(queryClient: QueryClient) {
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
}

function renderGate(queryClient: QueryClient) {
  const router = createMemoryRouter(
    [
      {
        path: '/game',
        element: (
          <WorldSessionGate>
            <div>game content</div>
          </WorldSessionGate>
        ),
      },
      { path: '/worlds', element: <div>worlds page</div> },
    ],
    { initialEntries: ['/game'] },
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

beforeEach(() => {
  joinMutateMock.mockReset();
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
    seedEliminatedPlayerQueries(queryClient);
    renderGate(queryClient);

    expect(screen.getByText('Ton village a été pris.')).toBeInTheDocument();
    expect(screen.queryByText('Impossible de charger ton royaume.')).not.toBeInTheDocument();
    expect(screen.getByText('Revenir sur ce monde')).toBeInTheDocument();
    expect(screen.getByText('Choisir un autre monde')).toBeInTheDocument();
  });

  it('affiche LostKingdomScreen même avec un villageId persisté obsolète', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', displayName: 'Alice' },
    });
    useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v-lost' });

    const queryClient = makeQueryClient();
    seedEliminatedPlayerQueries(queryClient);
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
    seedEliminatedPlayerQueries(queryClient);
    renderGate(queryClient);

    expect(screen.queryByText('game content')).not.toBeInTheDocument();
  });

  it('déclenche le rejoin avec worldId et villageName dérivé au clic sur Revenir', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', displayName: 'Alice' },
    });

    const queryClient = makeQueryClient();
    seedEliminatedPlayerQueries(queryClient);
    renderGate(queryClient);

    await user.click(screen.getByRole('button', { name: 'Revenir sur ce monde' }));

    expect(joinMutateMock).toHaveBeenCalledWith(
      { worldId: 'w1', villageName: 'Royaume de Alice' },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
  });

  it('utilise le nom générique quand displayName est absent', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', displayName: '' },
    });

    const queryClient = makeQueryClient();
    seedEliminatedPlayerQueries(queryClient);
    renderGate(queryClient);

    await user.click(screen.getByRole('button', { name: 'Revenir sur ce monde' }));

    expect(joinMutateMock).toHaveBeenCalledWith(
      { worldId: 'w1', villageName: 'Royaume du joueur' },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
  });

  it('efface le contexte jeu et navigue vers /worlds au clic sur Choisir un autre monde', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', displayName: 'Alice' },
    });
    useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v-lost' });

    const queryClient = makeQueryClient();
    seedEliminatedPlayerQueries(queryClient);
    const router = renderGate(queryClient);

    await user.click(screen.getByRole('button', { name: 'Choisir un autre monde' }));

    expect(useGameStore.getState().worldId).toBeNull();
    expect(useGameStore.getState().villageId).toBeNull();
    expect(router.state.location.pathname).toBe('/worlds');
  });
});
