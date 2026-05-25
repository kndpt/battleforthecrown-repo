import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  vi.useRealTimers();
  useGameStore.getState().clear();
  vi.unstubAllGlobals();
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

  it('plays the world entry sound when the animation completes', () => {
    vi.useFakeTimers();
    const play = vi.fn().mockResolvedValue(undefined);
    const AudioMock = vi.fn(function Audio(this: { play: typeof play; volume: number }) {
      this.play = play;
      this.volume = 0;
    });
    vi.stubGlobal('Audio', AudioMock);
    window.Audio = AudioMock as unknown as typeof Audio;

    renderTransition('/game');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).toHaveBeenCalledWith('/assets/sounds/world-entry-complete.mp3');
    expect(play).toHaveBeenCalledTimes(1);
  });
});
