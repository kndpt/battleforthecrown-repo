import { describe, expect, it } from 'vitest';
import { resetGameSessionStores } from './session';
import { useGameStore } from './game';
import { useResourcesStore } from './resources';
import { useCrownsStore } from './crowns';
import { useExpeditionsStore } from './expeditions';
import { useUiStore } from './ui';
import { useWorldMapStore } from './worldMap';

function seedAllSessionStores() {
  useGameStore.getState().setContext({ worldId: 'w1', villageId: 'v1' });
  useResourcesStore.getState().setResources({
    villageId: 'v1',
    wood: 100,
    stone: 50,
    iron: 25,
    maxPerType: 1000,
    productionRates: { wood: 10, stone: 5, iron: 2 },
    lastUpdateTs: Date.now(),
  });
  useCrownsStore.getState().setCrowns({
    userId: 'u1',
    worldId: 'w1',
    balance: 42,
    productionRate: 1,
    lastUpdateTs: Date.now(),
  });
  useExpeditionsStore.getState().add({
    expeditionId: 'e1',
    villageId: 'v1',
    origin: { x: 0, y: 0 },
    target: { x: 5, y: 5 },
    phase: 'EN_ROUTE',
    departAt: Date.now(),
    arrivalAt: Date.now() + 1000,
  });
  useUiStore.getState().pushToast({ tone: 'info', title: 'hi' });
  useUiStore.getState().pushVictoryModal({
    villageId: 'v1',
    villageName: 'Cravia',
    x: 1,
    y: 2,
    buildingsKept: 3,
    previousTier: null,
  });
  useWorldMapStore.getState().upsertEntity({
    id: 'v1',
    name: 'Cravia',
    x: 1,
    y: 2,
    kind: 'PLAYER_VILLAGE',
    ownerId: 'u1',
    isMine: true,
    tier: null,
  });
}

describe('resetGameSessionStores', () => {
  it('clears every game-session-scoped store in one call', () => {
    seedAllSessionStores();

    // Sanity: stores are populated before the reset.
    expect(useGameStore.getState().worldId).toBe('w1');
    expect(Object.keys(useResourcesStore.getState().byVillageId)).toHaveLength(1);
    expect(Object.keys(useCrownsStore.getState().byKey)).toHaveLength(1);
    expect(Object.keys(useExpeditionsStore.getState().byId)).toHaveLength(1);
    expect(useUiStore.getState().toasts).toHaveLength(1);
    expect(useUiStore.getState().victoryModals).toHaveLength(1);
    expect(Object.keys(useWorldMapStore.getState().entities)).toHaveLength(1);

    resetGameSessionStores();

    expect(useGameStore.getState().worldId).toBeNull();
    expect(useGameStore.getState().villageId).toBeNull();
    expect(useResourcesStore.getState().byVillageId).toEqual({});
    expect(useCrownsStore.getState().byKey).toEqual({});
    expect(useExpeditionsStore.getState().byId).toEqual({});
    expect(useUiStore.getState().toasts).toEqual([]);
    expect(useUiStore.getState().victoryModals).toEqual([]);
    expect(useWorldMapStore.getState().entities).toEqual({});
  });
});
