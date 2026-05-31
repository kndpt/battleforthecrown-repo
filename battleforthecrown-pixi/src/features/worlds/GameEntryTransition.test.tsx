import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
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

function renderTransition(initialPath: string, options: { withGameContext?: boolean } = {}) {
  if (options.withGameContext !== false) {
    useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v1' });
  }

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

  let navigateTo: (path: string) => void | Promise<void> = (_path: string) => {
    throw new Error('navigateTo called before router initialization');
  };

  function Harness() {
    const navigate = useNavigate();
    navigateTo = (path: string) => navigate(path);
    return <GameEntryTransition />;
  }

  const view = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>
    </MemoryRouter>,
  );

  return {
    ...view,
    navigateTo: (path: string) => {
      act(() => {
        navigateTo(path);
      });
    },
  };
}

function stubAudio() {
  vi.useFakeTimers();
  const play = vi.fn().mockResolvedValue(undefined);
  const AudioMock = vi.fn(function Audio(this: { play: typeof play; volume: number }) {
    this.play = play;
    this.volume = 0;
  });
  vi.stubGlobal('Audio', AudioMock);
  window.Audio = AudioMock as unknown as typeof Audio;
  return { AudioMock, play };
}

beforeEach(() => {
  useGameStore.getState().clear();
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
    const { AudioMock, play } = stubAudio();

    renderTransition('/game/world');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).toHaveBeenCalledWith('/assets/sounds/world-entry-complete.mp3');
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('plays the transition once when entering game routes from outside the game', () => {
    const { AudioMock } = stubAudio();
    const { navigateTo } = renderTransition('/worlds');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    navigateTo('/game');

    expect(screen.getByRole('status')).toHaveTextContent('Solstice');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('waits for game context before starting the entry animation on direct game loads', () => {
    const { AudioMock } = stubAudio();

    renderTransition('/game', { withGameContext: false });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).not.toHaveBeenCalled();

    act(() => {
      useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v1' });
    });

    expect(screen.getByRole('status')).toHaveTextContent('Solstice');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not replay the transition on intra-game navigation', () => {
    const { AudioMock } = stubAudio();
    const { navigateTo } = renderTransition('/game');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    navigateTo('/game/world');
    navigateTo('/game/army');
    navigateTo('/game/messages');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).toHaveBeenCalledTimes(1);
  });

  it('clears the active transition when navigating inside the game before it completes', () => {
    const { AudioMock } = stubAudio();
    const { navigateTo } = renderTransition('/game');

    expect(screen.getByRole('status')).toHaveTextContent('Solstice');

    navigateTo('/game/world');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(AudioMock).not.toHaveBeenCalled();
  });
});
