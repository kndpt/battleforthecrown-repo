import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  applyBattleResolved,
  applyBattleReturned,
  applyBuildingCompleted,
  applyCrownsChanged,
  applyExpeditionRecalled,
  applyGarrisonAdded,
  applyReinforcementRecalled,
  applyReinforcementReturned,
  applyReinforcementSent,
  applyResourcesChanged,
} from './ws-bindings';
import { queryKeys } from './queries';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { useUiStore } from '@/stores/ui';
import { useExpeditionsStore } from '@/stores/expeditions';
import { useWorldMapStore } from '@/stores/worldMap';
import {
  RESOLVED_TO_RETURNING_DELAY_MS,
  RETURNED_TO_CLEANUP_DELAY_MS,
} from '@/lib/expeditionTiming';

beforeEach(() => {
  useResourcesStore.getState().clear();
  useCrownsStore.getState().clear();
  useUiStore.getState().clearToasts();
  useExpeditionsStore.getState().clear();
  useWorldMapStore.getState().clear();
});

function createQueryClientWithReinforcementData(villageIds: string[]): QueryClient {
  const queryClient = new QueryClient();
  for (const villageId of villageIds) {
    queryClient.setQueryData(queryKeys.activeExpeditions(villageId), []);
    queryClient.setQueryData(queryKeys.garrison(villageId), []);
    queryClient.setQueryData(queryKeys.armyInventory(villageId), []);
  }
  return queryClient;
}

function expectReinforcementQueriesInvalidated(queryClient: QueryClient, villageId: string): void {
  expect(queryClient.getQueryState(queryKeys.garrison(villageId))?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(queryKeys.armyInventory(villageId))?.isInvalidated).toBe(true);
}

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

describe('applyExpeditionRecalled', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T22:00:05.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('keeps the expedition visible as a RETURNING trip from its current outbound position', () => {
    useExpeditionsStore.getState().add({
      expeditionId: 'recall-attack-1',
      kind: 'ATTACK',
      villageId: 'v1',
      origin: { x: 0, y: 0 },
      target: { x: 10, y: 0 },
      phase: 'EN_ROUTE',
      departAt: Date.parse('2026-05-04T22:00:00.000Z'),
      arrivalAt: Date.parse('2026-05-04T22:00:10.000Z'),
    });

    applyExpeditionRecalled(
      {
        expeditionId: 'recall-attack-1',
        villageId: 'v1',
        returnAt: '2026-05-04T22:00:10.000Z',
      },
      { queryClient: new QueryClient() },
    );

    const recalled = useExpeditionsStore.getState().byId['recall-attack-1'];
    expect(recalled).toMatchObject({
      phase: 'RETURNING',
      arrivalAt: Date.parse('2026-05-04T22:00:05.000Z'),
      returnAt: Date.parse('2026-05-04T22:00:10.000Z'),
    });
    expect(recalled.target).not.toEqual({ x: 10, y: 0 });
    expect(recalled.target.x).toBeGreaterThan(0);
    expect(recalled.target.x).toBeLessThan(10);
  });
});

describe('applyReinforcementSent', () => {
  it('adds an EN_ROUTE REINFORCE snapshot with target resolved from the world map store', () => {
    useWorldMapStore.getState().setEntities([
      {
        id: 'origin-village',
        kind: 'PLAYER_VILLAGE',
        isMine: true,
        x: 3,
        y: 4,
        name: 'Origin',
        tier: null,
      },
      {
        id: 'target-village',
        kind: 'PLAYER_VILLAGE',
        isMine: false,
        x: 9,
        y: 11,
        name: 'Target',
        tier: null,
      },
    ]);

    applyReinforcementSent(
      {
        expeditionId: 'reinforce-1',
        villageId: 'origin-village',
        targetVillageId: 'target-village',
        arrivalAt: '2026-05-04T22:05:00.000Z',
      },
      { queryClient: createQueryClientWithReinforcementData(['origin-village', 'target-village']) },
    );

    expect(useExpeditionsStore.getState().byId['reinforce-1']).toMatchObject({
      expeditionId: 'reinforce-1',
      kind: 'REINFORCE',
      villageId: 'origin-village',
      originVillageId: 'origin-village',
      targetVillageId: 'target-village',
      origin: { x: 3, y: 4 },
      target: { x: 9, y: 11 },
      targetKind: 'PLAYER_VILLAGE',
      phase: 'EN_ROUTE',
      arrivalAt: Date.parse('2026-05-04T22:05:00.000Z'),
    });
  });
});

describe('applyReinforcementRecalled', () => {
  it('adds or updates a REINFORCE snapshot from the host village back to the origin', () => {
    useWorldMapStore.getState().setEntities([
      {
        id: 'origin-village',
        kind: 'PLAYER_VILLAGE',
        isMine: true,
        x: 3,
        y: 4,
        name: 'Origin',
        tier: null,
      },
      {
        id: 'host-village',
        kind: 'PLAYER_VILLAGE',
        isMine: false,
        x: 9,
        y: 11,
        name: 'Host',
        tier: null,
      },
    ]);

    applyReinforcementRecalled(
      {
        expeditionId: 'recall-1',
        villageId: 'host-village',
        originVillageId: 'origin-village',
        arrivalAt: '2026-05-04T22:10:00.000Z',
      },
      { queryClient: createQueryClientWithReinforcementData(['host-village', 'origin-village']) },
    );

    expect(useExpeditionsStore.getState().byId['recall-1']).toMatchObject({
      expeditionId: 'recall-1',
      kind: 'REINFORCE',
      villageId: 'host-village',
      originVillageId: 'origin-village',
      targetVillageId: 'origin-village',
      origin: { x: 9, y: 11 },
      target: { x: 3, y: 4 },
      targetKind: 'PLAYER_VILLAGE',
      phase: 'EN_ROUTE',
      arrivalAt: Date.parse('2026-05-04T22:10:00.000Z'),
    });
  });
});

describe('applyGarrisonAdded', () => {
  it('invalidates the host village garrison query and the concerned inventory query', () => {
    const queryClient = createQueryClientWithReinforcementData(['host-village', 'origin-village']);

    applyGarrisonAdded(
      {
        villageId: 'host-village',
        originVillageId: 'origin-village',
        units: { MILITIA: 5 },
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.garrison('host-village'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.armyInventory('origin-village'))?.isInvalidated).toBe(true);
  });
});

describe('applyReinforcementReturned', () => {
  it('marks the returned expedition and invalidates inventory and garrison for the village and origin', () => {
    const queryClient = createQueryClientWithReinforcementData(['host-village', 'origin-village']);
    useExpeditionsStore.getState().add({
      expeditionId: 'return-1',
      kind: 'REINFORCE',
      villageId: 'host-village',
      originVillageId: 'origin-village',
      targetVillageId: 'origin-village',
      origin: { x: 9, y: 11 },
      target: { x: 3, y: 4 },
      phase: 'EN_ROUTE',
      departAt: 0,
      arrivalAt: 1000,
    });

    applyReinforcementReturned(
      {
        expeditionId: 'return-1',
        villageId: 'host-village',
        originVillageId: 'origin-village',
        units: { MILITIA: 5 },
      },
      { queryClient },
    );

    expect(useExpeditionsStore.getState().byId['return-1'].phase).toBe('RETURNED');
    expectReinforcementQueriesInvalidated(queryClient, 'host-village');
    expectReinforcementQueriesInvalidated(queryClient, 'origin-village');
  });
});
