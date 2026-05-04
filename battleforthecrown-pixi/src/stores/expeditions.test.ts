import { beforeEach, describe, expect, it } from 'vitest';
import { useExpeditionsStore, type ExpeditionSnapshot } from './expeditions';

const baseSnapshot: ExpeditionSnapshot = {
  expeditionId: 'e1',
  villageId: 'v1',
  origin: { x: 100, y: 100 },
  target: { x: 200, y: 200 },
  phase: 'EN_ROUTE',
  departAt: 1_000,
  arrivalAt: 2_000,
};

beforeEach(() => {
  useExpeditionsStore.getState().clear();
});

describe('useExpeditionsStore', () => {
  it('adds an expedition keyed by id', () => {
    useExpeditionsStore.getState().add(baseSnapshot);
    expect(useExpeditionsStore.getState().byId.e1).toEqual(baseSnapshot);
  });

  it('updates only existing expeditions', () => {
    useExpeditionsStore.getState().update('e1', { phase: 'RESOLVED' });
    expect(useExpeditionsStore.getState().byId.e1).toBeUndefined();

    useExpeditionsStore.getState().add(baseSnapshot);
    useExpeditionsStore.getState().update('e1', { phase: 'RESOLVED', isVictory: true });
    expect(useExpeditionsStore.getState().byId.e1.phase).toBe('RESOLVED');
    expect(useExpeditionsStore.getState().byId.e1.isVictory).toBe(true);
  });

  it('removes an expedition by id', () => {
    useExpeditionsStore.getState().add(baseSnapshot);
    useExpeditionsStore.getState().remove('e1');
    expect(useExpeditionsStore.getState().byId.e1).toBeUndefined();
  });

  it('clear empties everything', () => {
    useExpeditionsStore.getState().add(baseSnapshot);
    useExpeditionsStore.getState().add({ ...baseSnapshot, expeditionId: 'e2' });
    useExpeditionsStore.getState().clear();
    expect(Object.keys(useExpeditionsStore.getState().byId)).toHaveLength(0);
  });
});
