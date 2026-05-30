/**
 * Regression guard: every store that holds session-scoped data must expose
 * a clear() (or equivalent) that resets to initial state. useLogout() in
 * queries.ts calls these; if a store's clear contract breaks, this test fails.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { useCrownsStore } from './crowns';
import { useExpeditionsStore } from './expeditions';
import { useResourcesStore } from './resources';
import { useUiStore } from './ui';
import { useWorldMapStore } from './worldMap';

beforeEach(() => {
  useResourcesStore.getState().clear();
  useCrownsStore.getState().clear();
  useExpeditionsStore.getState().clear();
  useWorldMapStore.getState().clear();
  useUiStore.getState().clearToasts();
  useUiStore.getState().clearVictoryModals();
  useUiStore.getState().openModal(null);
  useUiStore.getState().openPanel(null);
});

describe('store clear contracts — useLogout lifecycle', () => {
  it('useResourcesStore.clear() resets byVillageId to empty', () => {
    useResourcesStore.getState().setResources({
      villageId: 'v1',
      wood: 500,
      stone: 200,
      iron: 100,
      maxPerType: 10_000,
      productionRates: { wood: 10, stone: 5, iron: 3 },
      lastUpdateTs: Date.now(),
    });
    expect(Object.keys(useResourcesStore.getState().byVillageId)).toHaveLength(1);

    useResourcesStore.getState().clear();
    expect(useResourcesStore.getState().byVillageId).toEqual({});
  });

  it('useCrownsStore.clear() resets byKey to empty', () => {
    useCrownsStore.getState().setCrowns({
      userId: 'u1',
      worldId: 'w1',
      balance: 1000,
      productionRate: 5,
      lastUpdateTs: Date.now(),
    });
    expect(Object.keys(useCrownsStore.getState().byKey)).toHaveLength(1);

    useCrownsStore.getState().clear();
    expect(useCrownsStore.getState().byKey).toEqual({});
  });

  it('useExpeditionsStore.clear() resets byId to empty', () => {
    useExpeditionsStore.getState().add({
      expeditionId: 'exp1',
      villageId: 'v1',
      originVillageId: 'v1',
      targetVillageId: 'v2',
      origin: { x: 0, y: 0 },
      target: { x: 10, y: 20 },
      phase: 'EN_ROUTE',
      departAt: Date.now(),
      arrivalAt: Date.now() + 60_000,
    });
    expect(Object.keys(useExpeditionsStore.getState().byId)).toHaveLength(1);

    useExpeditionsStore.getState().clear();
    expect(useExpeditionsStore.getState().byId).toEqual({});
  });

  it('useWorldMapStore.clear() resets entities and selection', () => {
    useWorldMapStore.getState().upsertEntity({
      id: 'e1',
      kind: 'PLAYER_VILLAGE',
      isMine: true,
      x: 5,
      y: 5,
      name: 'V',
      tier: null,
    });
    useWorldMapStore.getState().setSelectedEntity('e1');
    expect(useWorldMapStore.getState().selectedEntityId).toBe('e1');

    useWorldMapStore.getState().clear();
    expect(useWorldMapStore.getState().entities).toEqual({});
    expect(useWorldMapStore.getState().selectedEntityId).toBeNull();
  });

  it('useUiStore modal and panel reset to null on logout', () => {
    useUiStore.getState().openModal('some-modal');
    useUiStore.getState().openPanel('some-panel');
    expect(useUiStore.getState().openModalId).toBe('some-modal');
    expect(useUiStore.getState().openPanelId).toBe('some-panel');

    useUiStore.getState().openModal(null);
    useUiStore.getState().openPanel(null);
    expect(useUiStore.getState().openModalId).toBeNull();
    expect(useUiStore.getState().openPanelId).toBeNull();
  });

  it('useUiStore toasts and victoryModals cleared on logout', () => {
    useUiStore.getState().pushToast({ tone: 'info', title: 'hello' });
    useUiStore.getState().pushVictoryModal({
      villageId: 'v1',
      villageName: 'Cravia',
      x: 0,
      y: 0,
      buildingsKept: 0,
      previousTier: null,
    });
    expect(useUiStore.getState().toasts).toHaveLength(1);
    expect(useUiStore.getState().victoryModals).toHaveLength(1);

    useUiStore.getState().clearToasts();
    useUiStore.getState().clearVictoryModals();
    expect(useUiStore.getState().toasts).toHaveLength(0);
    expect(useUiStore.getState().victoryModals).toHaveLength(0);
  });
});
