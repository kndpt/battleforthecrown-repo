import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from '@/stores/ui';
import { ToastStack } from './ToastStack';

describe('ToastStack', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUiStore.getState().clearToasts();
  });

  afterEach(() => {
    useUiStore.getState().clearToasts();
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
});
