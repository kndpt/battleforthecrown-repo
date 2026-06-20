import { describe, expect, it, beforeEach } from 'vitest';
import { useUiStore } from './ui';

beforeEach(() => {
  useUiStore.getState().clearToasts();
  useUiStore.getState().clearVictoryModals();
  useUiStore.getState().clearDefeatItems();
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

describe('useUiStore — defeat carousel', () => {
  it('(a) push 2 items différents → 2 entrées, defeatActiveIndex reste 0', () => {
    const store = useUiStore.getState();
    store.pushDefeatItem({ villageId: 'v1', villageName: 'Alpha', x: 1, y: 2, conquerorName: 'C1', visualTier: 2 });
    store.pushDefeatItem({ villageId: 'v2', villageName: 'Beta', x: 3, y: 4, conquerorName: 'C2', visualTier: 3 });

    const state = useUiStore.getState();
    expect(state.defeatItems).toHaveLength(2);
    expect(state.defeatItems[0].villageId).toBe('v1');
    expect(state.defeatItems[1].villageId).toBe('v2');
    expect(state.defeatActiveIndex).toBe(0);
  });

  it('(b) push pendant modal ouverte (activeIndex=1) → append sans reset de defeatActiveIndex', () => {
    const store = useUiStore.getState();
    store.pushDefeatItem({ villageId: 'v1', villageName: 'Alpha', x: 1, y: 2, conquerorName: 'C1', visualTier: 1 });
    store.pushDefeatItem({ villageId: 'v2', villageName: 'Beta', x: 3, y: 4, conquerorName: 'C2', visualTier: 2 });
    store.setDefeatActiveIndex(1);

    store.pushDefeatItem({ villageId: 'v3', villageName: 'Gamma', x: 5, y: 6, conquerorName: 'C3', visualTier: 3 });

    const state = useUiStore.getState();
    expect(state.defeatItems).toHaveLength(3);
    expect(state.defeatActiveIndex).toBe(1);
  });

  it('(c) dédup : deux push même villageId → 1 seul item, reportId fusionné si fourni au 2ème', () => {
    const store = useUiStore.getState();
    store.pushDefeatItem({ villageId: 'v1', villageName: 'Alpha', x: 1, y: 2, conquerorName: 'C1', visualTier: 2 });

    // 2ème push sans reportId → pas de changement
    store.pushDefeatItem({ villageId: 'v1', villageName: 'Alpha', x: 1, y: 2, conquerorName: 'C1', visualTier: 2 });
    expect(useUiStore.getState().defeatItems).toHaveLength(1);
    expect(useUiStore.getState().defeatItems[0].reportId).toBeUndefined();

    // 3ème push avec reportId → fusion
    store.pushDefeatItem({ villageId: 'v1', villageName: 'Alpha', x: 1, y: 2, conquerorName: 'C1', visualTier: 2, reportId: 'rpt-42' });
    expect(useUiStore.getState().defeatItems).toHaveLength(1);
    expect(useUiStore.getState().defeatItems[0].reportId).toBe('rpt-42');

    // 4ème push avec reportId différent → ancien reportId conservé
    store.pushDefeatItem({ villageId: 'v1', villageName: 'Alpha', x: 1, y: 2, conquerorName: 'C1', visualTier: 2, reportId: 'rpt-99' });
    expect(useUiStore.getState().defeatItems).toHaveLength(1);
    expect(useUiStore.getState().defeatItems[0].reportId).toBe('rpt-42');
  });

  it("(d) acknowledgeDefeatItem retire l'item et clamp l'index", () => {
    const store = useUiStore.getState();
    store.pushDefeatItem({ villageId: 'v1', villageName: 'Alpha', x: 1, y: 2, conquerorName: 'C1', visualTier: 1 });
    store.pushDefeatItem({ villageId: 'v2', villageName: 'Beta', x: 3, y: 4, conquerorName: 'C2', visualTier: 2 });
    store.pushDefeatItem({ villageId: 'v3', villageName: 'Gamma', x: 5, y: 6, conquerorName: 'C3', visualTier: 3 });
    store.setDefeatActiveIndex(2); // pointe sur v3

    // Supprimer v3 (index courant 2, nouveau max = 1)
    store.acknowledgeDefeatItem('v3');
    expect(useUiStore.getState().defeatItems).toHaveLength(2);
    expect(useUiStore.getState().defeatActiveIndex).toBe(1); // clampé à 1

    // Supprimer v1 → reste v2 à index 0
    store.acknowledgeDefeatItem('v1');
    expect(useUiStore.getState().defeatItems).toHaveLength(1);
    expect(useUiStore.getState().defeatItems[0].villageId).toBe('v2');
    expect(useUiStore.getState().defeatActiveIndex).toBe(0);

    // Supprimer v2 → vide, index 0
    store.acknowledgeDefeatItem('v2');
    expect(useUiStore.getState().defeatItems).toHaveLength(0);
    expect(useUiStore.getState().defeatActiveIndex).toBe(0);
  });
});
