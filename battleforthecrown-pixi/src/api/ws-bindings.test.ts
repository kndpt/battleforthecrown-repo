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
  applyNobleKilled,
  applyUnitTrainingCompleted,
  applyUnitTrained,
  applyVillageCaptureWindowCompleted,
  applyVillageCaptureWindowInterrupted,
  applyVillageCaptureWindowOpened,
  applyVillageAttacked,
  applyVillageConquered,
  applyWorldStatusChanged,
} from './ws-bindings';
import { queryKeys } from './queries';
import { useResourcesStore } from '@/stores/resources';
import { useCrownsStore } from '@/stores/crowns';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useExpeditionsStore } from '@/stores/expeditions';
import { useGameStore } from '@/stores/game';
import { useWorldMapStore } from '@/stores/worldMap';
import {
  RESOLVED_TO_RETURNING_DELAY_MS,
  RETURNED_TO_CLEANUP_DELAY_MS,
} from '@/lib/expeditionTiming';

beforeEach(() => {
  useResourcesStore.getState().clear();
  useCrownsStore.getState().clear();
  useUiStore.getState().clearToasts();
  useUiStore.getState().clearVictoryModals();
  useAuthStore.getState().clearSession();
  useExpeditionsStore.getState().clear();
  useGameStore.getState().clear();
  useWorldMapStore.getState().clear();
});

function setCurrentWorldSession(): void {
  useAuthStore.getState().setSession({
    accessToken: 'access',
    refreshToken: 'refresh',
    user: { id: 'user-1', email: 'user@example.test' },
  });
  useGameStore.getState().setContext({ worldId: 'world-1', villageId: 'v-att' });
}

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

function seedPowerQueries(
  queryClient: QueryClient,
  villageId: string,
  userId = 'user-1',
  worldId = 'world-1',
): void {
  queryClient.setQueryData(queryKeys.villagePower(villageId), { total: 1 });
  queryClient.setQueryData(queryKeys.kingdomPower(userId, worldId), { kingdomPower: 1 });
}

function expectPowerQueriesInvalidated(
  queryClient: QueryClient,
  villageId: string,
  userId = 'user-1',
  worldId = 'world-1',
): void {
  expect(queryClient.getQueryState(queryKeys.villagePower(villageId))?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(queryKeys.kingdomPower(userId, worldId))?.isInvalidated).toBe(true);
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

describe('applyWorldStatusChanged', () => {
  it('invalidates world selection and current world config queries', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.publicWorlds(), []);
    queryClient.setQueryData(queryKeys.worlds(), []);
    queryClient.setQueryData(queryKeys.myMemberships('user-1'), []);
    queryClient.setQueryData(queryKeys.worldConfig('world-1'), {});
    queryClient.setQueryData(queryKeys.worldConfigFull('world-1'), {});

    applyWorldStatusChanged(
      {
        worldId: 'world-1',
        from: 'OPEN',
        to: 'LOCKED',
        at: '2026-05-25T10:00:00.000Z',
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.publicWorlds())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.worlds())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.myMemberships('user-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.worldConfig('world-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.worldConfigFull('world-1'))?.isInvalidated).toBe(true);
  });
});

describe('applyBuildingCompleted', () => {
  it('invalidates building queries and pushes a success toast', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'user-1', email: 'user@example.test' },
    });
    useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v1' });
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.villageStrategy('v1'), { currentStrategy: 'BALANCED' });
    queryClient.setQueryData(queryKeys.villagePower('v1'), { total: 1 });
    queryClient.setQueryData(queryKeys.kingdomPower('user-1', 'w1'), { kingdomPower: 1 });
    queryClient.setQueryData(queryKeys.retentionSummary('user-1', 'w1'), { claimableCount: 0 });
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

    expect(invalidationCount).toBe(8);
    expect(queryClient.getQueryState(queryKeys.villageStrategy('v1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.villagePower('v1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.kingdomPower('user-1', 'w1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.retentionSummary('user-1', 'w1'))?.isInvalidated).toBe(true);
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].tone).toBe('success');
    expect(toasts[0].title).toContain('Construction');
    expect(toasts[0].description).toBe('Camp de bûcherons niveau 3');
  });

  it('invalidates village visual feeds when the castle level changes', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.myVillages('user-1', 'world-1'), []);
    queryClient.setQueryData(queryKeys.worldEntities('world-1'), {
      entities: [],
      visionDisks: [],
      fogOfWarEnabled: true,
    });

    applyBuildingCompleted(
      {
        buildingId: 'castle-1',
        villageId: 'v-att',
        buildingType: 'CASTLE',
        level: 10,
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.myVillages('user-1', 'world-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.worldEntities('world-1'))?.isInvalidated).toBe(true);
  });
});

describe('applyUnitTrainingCompleted', () => {
  it('pushes localized unit labels for singular and plural training completion toasts', () => {
    const queryClient = new QueryClient();

    applyUnitTrainingCompleted(
      {
        trainingId: 'training-1',
        villageId: 'v1',
        unitType: 'NOBLE',
        completedQty: 1,
        totalQty: 1,
      },
      { queryClient },
    );
    applyUnitTrainingCompleted(
      {
        trainingId: 'training-2',
        villageId: 'v1',
        unitType: 'MILITIA',
        completedQty: 3,
        totalQty: 3,
      },
      { queryClient },
    );

    const toasts = useUiStore.getState().toasts;
    expect(toasts[0].description).toBe('1 Seigneur');
    expect(toasts[1].description).toBe('3 Milices de paysans');
  });
});

describe('applyUnitTrained', () => {
  it('invalidates training, inventory, population and power queries without pushing a toast', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.armyTraining('v1'), []);
    queryClient.setQueryData(queryKeys.armyInventory('v1'), []);
    queryClient.setQueryData(queryKeys.population('v1'), { used: 1, max: 10, available: 9 });
    queryClient.setQueryData(queryKeys.villagePower('v1'), { total: 1 });
    queryClient.setQueryData(queryKeys.kingdomPower('user-1', 'world-1'), { kingdomPower: 1 });

    applyUnitTrained(
      {
        trainingId: 'training-1',
        villageId: 'v1',
        unitType: 'MILITIA',
        completedQty: 1,
        totalQty: 3,
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.armyTraining('v1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.armyInventory('v1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.population('v1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.villagePower('v1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.kingdomPower('user-1', 'world-1'))?.isInvalidated).toBe(true);
    expect(useUiStore.getState().toasts).toHaveLength(0);
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

  it('removes a resolved battle when no return trip is scheduled', () => {
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
        isVictory: false,
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        lossesAttacker: { MILITIA: 1 },
        casualtyRate: 1,
        survivingUnits: {},
        returnAt: null,
      },
      { queryClient: new QueryClient() },
    );

    expect(useExpeditionsStore.getState().byId['e1'].phase).toBe('RESOLVED');
    vi.advanceTimersByTime(RESOLVED_TO_RETURNING_DELAY_MS);
    expect(useExpeditionsStore.getState().byId['e1']).toBeUndefined();
  });

  it('invalidates the signed-in player reports query for the unread badge', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.combatReports('user-1', 'world-1'), []);
    queryClient.setQueryData(queryKeys.scoutReports('user-1', 'world-1'), []);
    queryClient.setQueryData(queryKeys.combatReports('user-1', 'world-old'), []);
    queryClient.setQueryData(queryKeys.scoutReports('user-1', 'world-old'), []);

    applyBattleResolved(
      {
        expeditionId: 'e1',
        reportId: 'r1',
        villageId: 'v1',
        villageName: 'Capital',
        targetKind: 'BARBARIAN_VILLAGE',
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
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.combatReports('user-1', 'world-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.scoutReports('user-1', 'world-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.combatReports('user-1', 'world-old'))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(queryKeys.scoutReports('user-1', 'world-old'))?.isInvalidated).toBe(false);
  });

  it('invalidates village and kingdom power for the attacking village', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    seedPowerQueries(queryClient, 'v1');

    applyBattleResolved(
      {
        expeditionId: 'e1',
        reportId: 'r1',
        villageId: 'v1',
        villageName: 'Capital',
        targetKind: 'BARBARIAN_VILLAGE',
        targetName: 'Camp',
        targetX: 1,
        targetY: 1,
        isVictory: true,
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        lossesAttacker: { MILITIA: 1 },
        casualtyRate: 0.5,
        survivingUnits: {},
        returnAt: null,
      },
      { queryClient },
    );

    expectPowerQueriesInvalidated(queryClient, 'v1');
  });
});

describe('applyVillageConquered', () => {
  it('pushes a victory modal and removes the entity from the world map', () => {
    setCurrentWorldSession();
    useWorldMapStore.getState().setEntities([
      {
        id: 'v-target',
        kind: 'BARBARIAN_VILLAGE',
        ownerId: undefined,
        isMine: false,
        x: 42,
        y: 88,
        name: 'Cravia',
        tier: 'T2',
      },
    ]);
    const queryClient = new QueryClient();
    queryClient.setQueryData(['memberships'], []);
    queryClient.setQueryData(['villages'], []);
    queryClient.setQueryData(['world-entities'], []);
    queryClient.setQueryData(queryKeys.openConquests('user-1', 'world-1'), []);
    seedPowerQueries(queryClient, 'v-target');

    applyVillageConquered(
      {
        villageId: 'v-target',
        villageName: 'Cravia',
        newOwnerId: 'user-1',
        previousOwnerId: null,
        previousTier: 'T2',
        x: 42,
        y: 88,
        buildingsKept: 6,
      },
      { queryClient },
    );

    const modals = useUiStore.getState().victoryModals;
    expect(modals).toHaveLength(1);
    expect(modals[0]).toMatchObject({
      villageId: 'v-target',
      villageName: 'Cravia',
      x: 42,
      y: 88,
      buildingsKept: 6,
      previousTier: 'T2',
    });

    expect(useUiStore.getState().toasts).toHaveLength(0);
    expect(useWorldMapStore.getState().entities['v-target']).toBeUndefined();
    expect(queryClient.getQueryState(['villages'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['world-entities'])?.isInvalidated).toBe(true);
    expectPowerQueriesInvalidated(queryClient, 'v-target');
  });

  it('refreshes the previous owner without pushing a victory modal', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'previous-owner', email: 'previous@example.test' },
    });
    useGameStore.getState().setContext({ worldId: 'world-1', villageId: 'v-old' });
    useWorldMapStore.getState().setEntities([
      {
        id: 'v-target',
        kind: 'PLAYER_VILLAGE',
        ownerId: 'previous-owner',
        isMine: true,
        x: 42,
        y: 88,
        name: 'Cravia',
        tier: null,
      },
    ]);
    const queryClient = new QueryClient();
    queryClient.setQueryData(['memberships'], []);
    queryClient.setQueryData(['villages'], []);
    queryClient.setQueryData(['world-entities'], []);
    queryClient.setQueryData(queryKeys.openConquests('previous-owner', 'world-1'), []);
    seedPowerQueries(queryClient, 'v-target', 'previous-owner');

    applyVillageConquered(
      {
        villageId: 'v-target',
        villageName: 'Cravia',
        newOwnerId: 'user-1',
        previousOwnerId: 'previous-owner',
        previousTier: null,
        x: 42,
        y: 88,
        buildingsKept: 6,
      },
      { queryClient },
    );

    expect(useUiStore.getState().victoryModals).toHaveLength(0);
    expect(useWorldMapStore.getState().entities['v-target']).toBeUndefined();
    expect(queryClient.getQueryState(['villages'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['world-entities'])?.isInvalidated).toBe(true);
    expectPowerQueriesInvalidated(queryClient, 'v-target', 'previous-owner');
  });
});

describe('applyVillageAttacked', () => {
  it('invalidates the signed-in defender reports query for the unread badge', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'defender-1', email: 'd@example.test' },
    });
    useGameStore.getState().setContext({ worldId: 'world-1', villageId: 'v-def' });
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.combatReports('defender-1', 'world-1'), []);
    queryClient.setQueryData(queryKeys.scoutReports('defender-1', 'world-1'), []);
    seedPowerQueries(queryClient, 'v-def', 'defender-1');
    seedPowerQueries(queryClient, 'v-origin', 'defender-1');

    applyVillageAttacked(
      {
        defenderVillageId: 'v-def',
        attackerVillageId: 'v-att',
        attackerVillageName: 'Attacker',
        attackerX: 2,
        attackerY: 3,
        defenderVillageName: 'Defender',
        isDefenseSuccessful: false,
        losses: {},
        reinforcementOriginVillageIds: ['v-origin'],
        casualtyRate: 0,
        resourcesLost: { wood: 0, stone: 0, iron: 0 },
        timestamp: '2026-05-04T22:00:00.000Z',
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.combatReports('defender-1', 'world-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.scoutReports('defender-1', 'world-1'))?.isInvalidated).toBe(true);
    expectPowerQueriesInvalidated(queryClient, 'v-def', 'defender-1');
    expectPowerQueriesInvalidated(queryClient, 'v-origin', 'defender-1');
  });
});

describe('conquest websocket bindings', () => {
  it('refreshes conquest attacker state when a capture window opens', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.worldEntities('w1'), []);
    queryClient.setQueryData(queryKeys.activeExpeditions('v-att'), []);
    queryClient.setQueryData(queryKeys.armyInventory('v-att'), []);
    queryClient.setQueryData(queryKeys.population('v-att'), { used: 1, max: 10, available: 9 });
    queryClient.setQueryData(queryKeys.openConquests('user-1', 'world-1'), []);
    queryClient.setQueryData(queryKeys.openExpeditions('user-1', 'world-1'), []);

    applyVillageCaptureWindowOpened(
      {
        pendingConquestId: 'pc1',
        targetVillageId: 'barb-1',
        attackerVillageId: 'v-att',
        captureUntil: '2026-05-04T23:00:00.000Z',
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.worldEntities('w1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.activeExpeditions('v-att'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.armyInventory('v-att'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.population('v-att'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.openConquests('user-1', 'world-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.openExpeditions('user-1', 'world-1'))?.isInvalidated).toBe(true);
  });

  it('refreshes open conquests when capture terminal events arrive', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.openConquests('user-1', 'world-1'), []);

    applyVillageCaptureWindowCompleted(
      {
        newOwnerUserId: 'user-1',
        pendingConquestId: 'pc1',
        targetVillageId: 'barb-1',
      },
      { queryClient },
    );
    expect(queryClient.getQueryState(queryKeys.openConquests('user-1', 'world-1'))?.isInvalidated).toBe(true);

    queryClient.setQueryData(queryKeys.openConquests('user-1', 'world-1'), []);
    applyVillageCaptureWindowInterrupted(
      {
        pendingConquestId: 'pc1',
        reason: 'NOBLE_KILLED',
        targetVillageId: 'barb-1',
      },
      { queryClient },
    );
    expect(queryClient.getQueryState(queryKeys.openConquests('user-1', 'world-1'))?.isInvalidated).toBe(true);
  });

  it('refreshes attacker army state when the noble dies', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.activeExpeditions('v-att'), []);
    queryClient.setQueryData(queryKeys.armyInventory('v-att'), []);
    queryClient.setQueryData(queryKeys.population('v-att'), { used: 1, max: 10, available: 9 });
    queryClient.setQueryData(queryKeys.openConquests('user-1', 'world-1'), []);
    queryClient.setQueryData(queryKeys.openExpeditions('user-1', 'world-1'), []);

    applyNobleKilled(
      {
        attackerVillageId: 'v-att',
        attackerUserId: 'u-att',
        combatId: 'combat-1',
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.activeExpeditions('v-att'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.armyInventory('v-att'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.population('v-att'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.openConquests('user-1', 'world-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.openExpeditions('user-1', 'world-1'))?.isInvalidated).toBe(true);
  });
});

describe('kingdom activity expedition invalidations', () => {
  it('refreshes open expeditions when battle and scout lifecycle events arrive', () => {
    setCurrentWorldSession();
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.openExpeditions('user-1', 'world-1'), []);

    applyBattleReturned(
      {
        expeditionId: 'battle-1',
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
        reportId: 'report-1',
        survivingUnits: {},
        villageId: 'v-att',
      },
      { queryClient },
    );

    expect(queryClient.getQueryState(queryKeys.openExpeditions('user-1', 'world-1'))?.isInvalidated).toBe(true);
  });
});

describe('applyBattleReturned', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('removes the snapshot after the configured delay', () => {
    setCurrentWorldSession();
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

    const queryClient = new QueryClient();
    seedPowerQueries(queryClient, 'v1');

    applyBattleReturned(
      {
        expeditionId: 'e2',
        reportId: 'r1',
        villageId: 'v1',
        survivingUnits: {},
        loot: { resources: { wood: 0, stone: 0, iron: 0 } },
      },
      { queryClient },
    );

    expect(useExpeditionsStore.getState().byId['e2'].phase).toBe('RETURNED');
    expectPowerQueriesInvalidated(queryClient, 'v1');
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
