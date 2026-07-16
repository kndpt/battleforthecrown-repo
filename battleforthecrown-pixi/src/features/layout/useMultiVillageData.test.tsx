/**
 * Integration test (run 101, acceptance C6): the full incoming-attack wiring,
 * not just the pure derivation.
 *
 * Exercises the real chain end-to-end with a real `QueryClient` (no mocked
 * TanStack internals — only the HTTP boundary `apiClient.get` is spied):
 *   `attack.incoming` WS binding → `invalidateQueries(incomingAttacks(v))`
 *   → real refetch → `combine` Map → `useMemo` → `deriveVillageStateAlert`
 *   → `kind: 'attack'` pill on the targeted village only.
 *
 * The invalidation half is also unit-covered in `ws-bindings.test.ts`; here we
 * assert it actually recomputes the selector item, and that the pill lands on
 * the targeted village exclusively (inter-village isolation).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/api';
import type { JoinedVillage } from '@/api';
import { applyAttackIncoming } from '@/api/ws-bindings';
import type { IncomingAttackDto } from '@battleforthecrown/shared/events';
import { useMultiVillageData } from './useMultiVillageData';

const WORLD_ID = 'world-1';

function village(id: string, name: string): JoinedVillage {
  return { id, name, x: 0, y: 0, worldId: WORLD_ID };
}

function futureAttack(villageId: string, minutesAhead = 10): IncomingAttackDto {
  return {
    arrivalAt: new Date(Date.now() + minutesAhead * 60_000).toISOString(),
    expeditionId: `exp-${villageId}`,
    targetVillageId: villageId,
    targetX: 0,
    targetY: 0,
  };
}

// Mutable per-village incoming snapshot the HTTP spy reads, so a WS-triggered
// refetch can return fresh data mid-test.
let incomingByPath: Record<string, IncomingAttackDto[]>;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  incomingByPath = {};
  vi.spyOn(apiClient, 'get').mockImplementation(async (path: string) => {
    const incomingMatch = /^\/combat\/(.+)\/incoming$/.exec(path);
    if (incomingMatch) return incomingByPath[incomingMatch[1]] ?? [];
    // A non-empty construction queue keeps every village out of the "idle queue"
    // warning, so the ONLY alert that can appear is the incoming-attack one we
    // drive — isolating the assertion to the attack path.
    if (path === '/village/queue') {
      return [
        {
          endTime: '2026-01-01T01:00:00.000Z',
          id: 'q1',
          level: 2,
          startTime: '2026-01-01T00:00:00.000Z',
          type: 'CASTLE',
        },
      ];
    }
    // Other fan-outs (resources, population, buildings, strategy, training,
    // kingdom power) are irrelevant here — empty payload, no state warning.
    return [];
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMultiVillageData — incoming attack wiring', () => {
  it('recomputes the attack pill on the targeted village when attack.incoming fires', async () => {
    const queryClient = makeQueryClient();
    const villages = [village('v1', 'Fort'), village('v2', 'Guet')];

    const { result } = renderHook(
      () =>
        useMultiVillageData(villages, {
          villageSheetOpen: true,
          profileVillagesActive: false,
          activeVillageId: 'v1',
          sortAscending: true,
        }),
      { wrapper: wrapperFor(queryClient) },
    );

    // Initial fetch settles with no incoming attacks → no attack pill anywhere.
    await waitFor(() => {
      const items = result.current.villageSheetItems;
      expect(items).toHaveLength(2);
      expect(items.every((item) => item.alert?.kind !== 'attack')).toBe(true);
    });

    // A real attack now targets v1: the next refetch will surface it.
    incomingByPath.v1 = [futureAttack('v1')];

    // The WS event invalidates ONLY v1's incoming key (real binding, real client).
    act(() => {
      applyAttackIncoming(futureAttack('v1'), { queryClient });
    });

    // The selector recomputes: v1 gets the red attack pill, v2 stays clean.
    await waitFor(() => {
      const items = result.current.villageSheetItems;
      const v1 = items.find((item) => item.id === 'v1');
      const v2 = items.find((item) => item.id === 'v2');
      expect(v1?.alert?.kind).toBe('attack');
      expect(v1?.alert?.eta).not.toBe('—');
      expect(v2?.alert).toBeNull();
    });
  });
});
