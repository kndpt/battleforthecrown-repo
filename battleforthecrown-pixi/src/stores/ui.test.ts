import { describe, expect, it, beforeEach } from 'vitest';
import { useUiStore } from './ui';

beforeEach(() => {
  useUiStore.getState().clearToasts();
  useUiStore.getState().clearVictoryModals();
});

describe('useUiStore — victory modals queue', () => {
  it('pushes modals in FIFO order', () => {
    const store = useUiStore.getState();
    const id1 = store.pushVictoryModal({
      villageId: 'v1',
      villageName: 'Cravia',
      x: 10,
      y: 20,
      buildingsKept: 5,
      previousTier: 'T2',
    });
    const id2 = store.pushVictoryModal({
      villageId: 'v2',
      villageName: 'Othrys',
      x: 30,
      y: 40,
      buildingsKept: 7,
      previousTier: null,
    });

    const queue = useUiStore.getState().victoryModals;
    expect(queue).toHaveLength(2);
    expect(queue[0].id).toBe(id1);
    expect(queue[0].villageName).toBe('Cravia');
    expect(queue[1].id).toBe(id2);
    expect(queue[1].villageName).toBe('Othrys');
  });

  it('dismissVictoryModal removes only the matching entry', () => {
    const store = useUiStore.getState();
    const id1 = store.pushVictoryModal({
      villageId: 'v1',
      villageName: 'Cravia',
      x: 0,
      y: 0,
      buildingsKept: 0,
      previousTier: null,
    });
    const id2 = store.pushVictoryModal({
      villageId: 'v2',
      villageName: 'Othrys',
      x: 0,
      y: 0,
      buildingsKept: 0,
      previousTier: null,
    });

    useUiStore.getState().dismissVictoryModal(id1);

    const queue = useUiStore.getState().victoryModals;
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(id2);
  });

  it('clearVictoryModals empties the queue', () => {
    const store = useUiStore.getState();
    store.pushVictoryModal({
      villageId: 'v1',
      villageName: 'Cravia',
      x: 0,
      y: 0,
      buildingsKept: 0,
      previousTier: null,
    });
    store.pushVictoryModal({
      villageId: 'v2',
      villageName: 'Othrys',
      x: 0,
      y: 0,
      buildingsKept: 0,
      previousTier: null,
    });

    useUiStore.getState().clearVictoryModals();
    expect(useUiStore.getState().victoryModals).toHaveLength(0);
  });
});
