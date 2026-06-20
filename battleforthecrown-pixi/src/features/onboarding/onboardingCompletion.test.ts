import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';
import { apiClient } from '@/api';
import {
  isOnboardingCompletionAcknowledged,
  useOnboardingCompletionAck,
} from './onboardingCompletion';

const KEY = 'bftc:onboarding:completion-ack:user-1:world-1';

const queryClient = new QueryClient();
function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

function setUser(id: string | null) {
  useAuthStore.setState({
    user: id ? { id, displayName: id } : null,
  });
}

beforeEach(() => {
  sessionStorage.clear();
  setUser('user-1');
  // Default: the completion-reward claim succeeds so the optimistic ack sticks.
  vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  setUser(null);
});

describe('isOnboardingCompletionAcknowledged', () => {
  it('returns false when nothing has been acknowledged', () => {
    expect(isOnboardingCompletionAcknowledged('user-1', 'world-1')).toBe(false);
  });

  it('returns true once the key is present', () => {
    sessionStorage.setItem(KEY, '1');
    expect(isOnboardingCompletionAcknowledged('user-1', 'world-1')).toBe(true);
  });

  it('returns false when userId or worldId is null', () => {
    sessionStorage.setItem(KEY, '1');
    expect(isOnboardingCompletionAcknowledged(null, 'world-1')).toBe(false);
    expect(isOnboardingCompletionAcknowledged('user-1', null)).toBe(false);
  });
});

describe('useOnboardingCompletionAck', () => {
  it('starts un-acknowledged then persists the acknowledgement', () => {
    const { result } = renderHook(() => useOnboardingCompletionAck('world-1'), { wrapper });

    expect(result.current.acknowledged).toBe(false);

    act(() => result.current.acknowledge());

    expect(result.current.acknowledged).toBe(true);
    expect(sessionStorage.getItem(KEY)).toBe('1');
  });

  it('reflects a pre-existing acknowledgement from sessionStorage', () => {
    sessionStorage.setItem(KEY, '1');
    const { result } = renderHook(() => useOnboardingCompletionAck('world-1'), { wrapper });

    expect(result.current.acknowledged).toBe(true);
  });

  it('falls back to in-memory state when sessionStorage write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { result } = renderHook(() => useOnboardingCompletionAck('world-1'), { wrapper });
    act(() => result.current.acknowledge());

    // Write threw, so nothing persisted — but the modal still dismisses.
    expect(result.current.acknowledged).toBe(true);
  });

  it('re-derives per world when the identity changes', () => {
    sessionStorage.setItem(KEY, '1');
    const { result, rerender } = renderHook(
      ({ worldId }) => useOnboardingCompletionAck(worldId),
      { initialProps: { worldId: 'world-1' }, wrapper },
    );

    expect(result.current.acknowledged).toBe(true);

    rerender({ worldId: 'world-2' });
    expect(result.current.acknowledged).toBe(false);
  });

  it('does nothing when there is no authenticated user', () => {
    setUser(null);
    const { result } = renderHook(() => useOnboardingCompletionAck('world-1'), { wrapper });

    act(() => result.current.acknowledge());

    expect(result.current.acknowledged).toBe(false);
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('rolls back the acknowledgement when the reward claim fails', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('network'));
    const { result } = renderHook(
      () => useOnboardingCompletionAck('world-1', 'village-1'),
      { wrapper },
    );

    act(() => result.current.acknowledge());
    // Optimistic ack is written synchronously…
    expect(sessionStorage.getItem(KEY)).toBe('1');

    // …then rolled back once the claim rejects, so the screen can re-show.
    await waitFor(() => expect(sessionStorage.getItem(KEY)).toBeNull());
    expect(result.current.acknowledged).toBe(false);
  });
});
