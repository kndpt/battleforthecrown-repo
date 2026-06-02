import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from '@/stores/ui';
import { ToastStack } from './ToastStack';

describe('ToastStack', () => {
  const play = vi.fn().mockResolvedValue(undefined);
  const AudioMock = vi.fn(function Audio(this: { play: typeof play; volume: number }) {
    this.play = play;
    this.volume = 0;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    play.mockClear();
    AudioMock.mockClear();
    vi.stubGlobal('Audio', AudioMock);
    window.Audio = AudioMock as unknown as typeof Audio;
    useUiStore.getState().clearToasts();
  });

  afterEach(() => {
    useUiStore.getState().clearToasts();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders runtime toasts through the design-system toast and keeps close behavior', () => {
    useUiStore.getState().pushToast({
      description: 'Conquête échouée',
      tone: 'error',
      title: 'Seigneur perdu',
      ttlMs: 0,
    });

    render(<ToastStack />);

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Seigneur perdu');
    expect(toast).toHaveTextContent('Conquête échouée');
    expect(toast.innerHTML).toContain('border-[#a93226]');

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it('renders refund rows with ResourceIcon and hides zero values', () => {
    useUiStore.getState().pushToast({
      refundItems: [
        { resource: 'wood', amount: 235 },
        { resource: 'stone', amount: 0 },
        { resource: 'population', amount: 6 },
        { resource: 'crowns', amount: 50 },
      ],
      tone: 'success',
      title: 'Construction annulée',
      ttlMs: 0,
    });

    render(<ToastStack />);

    expect(screen.getByLabelText('Ressources remboursées')).toHaveTextContent(
      '+235',
    );
    expect(
      screen.getByLabelText('Population et couronnes remboursées'),
    ).toHaveTextContent('+6');
    expect(
      screen.getByLabelText('Population et couronnes remboursées'),
    ).toHaveTextContent('+50');
    expect(screen.getByAltText('Bois')).toBeInTheDocument();
    expect(screen.getByAltText('Population')).toBeInTheDocument();
    expect(screen.getByAltText('Couronnes')).toBeInTheDocument();
    expect(screen.queryByAltText('Pierre')).not.toBeInTheDocument();
  });

  it('dismisses runtime toasts after their ttl', () => {
    useUiStore.getState().pushToast({
      tone: 'success',
      title: 'Construction terminée',
      ttlMs: 1000,
    });

    render(<ToastStack />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it('plays the notification sound once for a new toast', () => {
    const { rerender } = render(<ToastStack />);

    act(() => {
      useUiStore.getState().pushToast({
        tone: 'info',
        title: 'Nouveau rapport',
        ttlMs: 0,
      });
    });
    rerender(<ToastStack />);
    rerender(<ToastStack />);

    expect(AudioMock).toHaveBeenCalledWith('/assets/sounds/notification-received.mp3');
    expect(play).toHaveBeenCalledTimes(1);
  });
});
