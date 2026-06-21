import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import type { RenownStatus } from '@battleforthecrown/shared';
import { useAuthStore } from '@/stores/auth';
import { apiClient } from '@/api';
import { useRenownLevelUp } from './useRenownLevelUp';

const LS_PREFIX = 'bftc.renown.lastSeenLevel';

function status(level: number): RenownStatus {
  return {
    xp: level * 1000,
    level,
    currentLevelXp: 0,
    nextLevelXp: 1000,
    xpIntoLevel: 0,
    xpForNextLevel: 1000,
  };
}

let queryClient: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

function setUser(id: string | null) {
  useAuthStore.setState({ user: id ? { id, displayName: id } : null });
}

function mockRenown(level: number) {
  vi.spyOn(apiClient, 'get').mockResolvedValue(status(level));
}

beforeEach(() => {
  localStorage.clear();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  setUser('user-1');
});

afterEach(() => {
  vi.restoreAllMocks();
  setUser(null);
});

describe('useRenownLevelUp', () => {
  it('does not flag a level-up for a fresh account (no baseline)', async () => {
    mockRenown(3);
    const { result } = renderHook(() => useRenownLevelUp(), { wrapper });

    await waitFor(() => expect(result.current.renown?.level).toBe(3));
    expect(result.current.justLeveledUp).toBe(false);
  });

  it('flags a level-up when current level exceeds the persisted baseline', async () => {
    localStorage.setItem(`${LS_PREFIX}.user-1`, '3');
    mockRenown(4);
    const { result } = renderHook(() => useRenownLevelUp(), { wrapper });

    await waitFor(() => expect(result.current.renown?.level).toBe(4));
    expect(result.current.justLeveledUp).toBe(true);
  });

  it('does not flag a level-up when level equals the baseline', async () => {
    localStorage.setItem(`${LS_PREFIX}.user-1`, '4');
    mockRenown(4);
    const { result } = renderHook(() => useRenownLevelUp(), { wrapper });

    await waitFor(() => expect(result.current.renown?.level).toBe(4));
    expect(result.current.justLeveledUp).toBe(false);
  });

  it('clears the flag and persists the baseline on acknowledge', async () => {
    localStorage.setItem(`${LS_PREFIX}.user-1`, '3');
    mockRenown(4);
    const { result } = renderHook(() => useRenownLevelUp(), { wrapper });

    await waitFor(() => expect(result.current.justLeveledUp).toBe(true));

    act(() => result.current.acknowledge());

    expect(result.current.justLeveledUp).toBe(false);
    expect(localStorage.getItem(`${LS_PREFIX}.user-1`)).toBe('4');
  });

  it('scopes the baseline per account (no cross-account leak)', async () => {
    // user-1 a une baseline au niveau 3 ; user-2 n'en a pas.
    localStorage.setItem(`${LS_PREFIX}.user-1`, '3');
    setUser('user-2');
    mockRenown(5);
    const { result } = renderHook(() => useRenownLevelUp(), { wrapper });

    await waitFor(() => expect(result.current.renown?.level).toBe(5));
    // Pas de baseline pour user-2 → pas de faux level-up hérité de user-1.
    expect(result.current.justLeveledUp).toBe(false);
  });
});
