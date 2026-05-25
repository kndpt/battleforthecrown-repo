import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { queryKeys } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { GameEntryTransition } from './GameEntryTransition';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderTransition(initialPath: string) {
  const queryClient = makeQueryClient();
  queryClient.setQueryData(queryKeys.publicWorlds(), [
    {
      id: 'w1',
      identity: {
        displayName: 'Solstice',
        sigil: 'star',
        tagline: 'Le royaume vient d’ouvrir ses portes.',
        themeColor: 'azure',
        tier: 'DEBUTANTS',
      },
      joinedCount: 1,
      lifecycle: {
        day: 1,
        endsAt: '2026-07-24T12:00:00.000Z',
        inscriptionPhase: 'main',
        plannedOpenAt: null,
        startedAt: '2026-05-25T12:00:00.000Z',
        totalDays: 60,
      },
      status: 'OPEN',
      tempoProfile: 'standard',
    },
  ]);

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={queryClient}>
        <GameEntryTransition />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v1' });
});

afterEach(() => {
  useGameStore.getState().clear();
});

describe('GameEntryTransition', () => {
  it('shows the two-second world entry animation on game arrival', () => {
    renderTransition('/game');

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Solstice');
    expect(status).toHaveClass('animate-[bftc-world-entry-overlay_2000ms_ease-in-out_forwards]');
  });

  it('does not show the game entry animation outside game routes', () => {
    renderTransition('/worlds');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
