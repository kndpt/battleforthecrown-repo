import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  applyBattleResolved,
  applyBattleReturned,
  applyBuildingCompleted,
  applyCrownsChanged,
  applyResourcesChanged,
} from './ws-bindings';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { useUiStore } from '@/stores/ui';
import { useExpeditionsStore } from '@/stores/expeditions';
import {
  RESOLVED_TO_RETURNING_DELAY_MS,
  RETURNED_TO_CLEANUP_DELAY_MS,
} from '@/lib/expeditionTiming';

beforeEach(() => {
  useResourcesStore.getState().clear();
  useCrownsStore.getState().clear();
  useUiStore.getState().clearToasts();
  useExpeditionsStore.getState().clear();
});

describe('applyResourcesChanged', () => {
  it('writes the snapshot to the resources store keyed by villageId', () => {
    applyResourcesChanged({
      villageId: 'v1',
      wood: 500,
      stone: 200,
      iron: 100,
      maxPerType: 1000,
      productionRates: { wood: 60, stone: 60, iron: 60 },
      lastUpdateTs: '2026-05-04T22:00:00.000Z',
    });

    const stored = useResourcesStore.getState().byVillageId['v1'];
    expect(stored).toBeDefined();
    expect(stored.wood).toBe(500);
    expect(stored.lastUpdateTs).toBe(Date.parse('2026-05-04T22:00:00.000Z'));
  });

  it('overwrites the previous snapshot for the same villageId', () => {
    applyResourcesChanged({
      villageId: 'v1',
      wood: 100,
      stone: 100,
      iron: 100,
      maxPerType: 1000,
      productionRates: { wood: 0, stone: 0, iron: 0 },
      lastUpdateTs: '2026-05-04T22:00:00.000Z',
    });
    applyResourcesChanged({
      villageId: 'v1',
      wood: 999,
      stone: 100,
      iron: 100,
      maxPerType: 1000,
      productionRates: { wood: 0, stone: 0, iron: 0 },
      lastUpdateTs: '2026-05-04T22:00:01.000Z',
    });
    expect(useResourcesStore.getState().byVillageId['v1'].wood).toBe(999);
  });
});

describe('applyCrownsChanged', () => {
  it('writes the crowns snapshot keyed by userId+worldId', () => {
    applyCrownsChanged({
      userId: 'u1',
      worldId: 'default',
      balance: 7,
      productionRate: 3,
      lastUpdateTs: '2026-05-04T22:00:00.000Z',
    });
    const stored = useCrownsStore.getState().byKey['u1:default'];
    expect(stored).toEqual({
      userId: 'u1',
      worldId: 'default',
      balance: 7,
      productionRate: 3,
      lastUpdateTs: Date.parse('2026-05-04T22:00:00.000Z'),
    });
  });
});

describe('applyBuildingCompleted', () => {
  it('invalidates building queries and pushes a success toast', () => {
    const queryClient = new QueryClient();
    let invalidationCount = 0;
    const originalInvalidate = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = ((...args: Parameters<typeof originalInvalidate>) => {
      invalidationCount += 1;
      return originalInvalidate(...args);
    }) as typeof queryClient.invalidateQueries;

    applyBuildingCompleted(
      {
        buildingId: 'b1',
        villageId: 'v1',
        buildingType: 'WOOD',
        level: 3,
      },
      { queryClient },
    );

    expect(invalidationCount).toBe(4);
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].tone).toBe('success');
    expect(toasts[0].title).toContain('Construction');
  });
});

describe('applyBattleResolved', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('flips phase to RETURNING after the configured delay', () => {
    useExpeditionsStore.getState().add({
      expeditionId: 'e1',
      villageId: 'v1',
      origin: { x: 0, y: 0 },
      target: { x: 1, y: 1 },
      phase: 'EN_ROUTE',
      departAt: 0,
      arrivalAt: 1000,
    });

    applyBattleResolved(
      {
        expeditionId: 'e1',
        reportId: 'r1',
        villageId: 'v1',
        villageName: 'Capital',
        targetKind: 'BARBARIAN',
        targetName: 'Camp',
        targetX: 1,
        targetY: 1,
        isVictory: true,
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        lossesAttacker: {},
        casualtyRate: 0,
        survivingUnits: {},
        returnAt: '2026-05-04T22:00:01.000Z',
      },
      { queryClient: new QueryClient() },
    );

    expect(useExpeditionsStore.getState().byId['e1'].phase).toBe('RESOLVED');
    vi.advanceTimersByTime(RESOLVED_TO_RETURNING_DELAY_MS);
    expect(useExpeditionsStore.getState().byId['e1'].phase).toBe('RETURNING');
  });
});

describe('applyBattleReturned', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('removes the snapshot after the configured delay', () => {
    useExpeditionsStore.getState().add({
      expeditionId: 'e2',
      villageId: 'v1',
      origin: { x: 0, y: 0 },
      target: { x: 1, y: 1 },
      phase: 'RETURNING',
      departAt: 0,
      arrivalAt: 1000,
      returnAt: 2000,
    });

    applyBattleReturned(
      {
        expeditionId: 'e2',
        reportId: 'r1',
        villageId: 'v1',
        survivingUnits: {},
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
      },
      { queryClient: new QueryClient() },
    );

    expect(useExpeditionsStore.getState().byId['e2'].phase).toBe('RETURNED');
    vi.advanceTimersByTime(RETURNED_TO_CLEANUP_DELAY_MS);
    expect(useExpeditionsStore.getState().byId['e2']).toBeUndefined();
  });
});
