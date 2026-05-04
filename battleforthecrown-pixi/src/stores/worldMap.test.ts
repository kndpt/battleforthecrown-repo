import { describe, expect, it, beforeEach } from 'vitest';
import { useWorldMapStore } from './worldMap';
import type { MapEntity } from '@/api/world-types';

const entity = (id: string, overrides: Partial<MapEntity> = {}): MapEntity => ({
  id,
  kind: 'BARBARIAN_VILLAGE',
  ownerId: undefined,
  isMine: false,
  x: 100,
  y: 100,
  name: id,
  tier: 'T1',
  ...overrides,
});

beforeEach(() => {
  useWorldMapStore.getState().clear();
});

describe('useWorldMapStore', () => {
  it('replaces entities atomically with setEntities', () => {
    useWorldMapStore.getState().setEntities([entity('a'), entity('b')]);
    expect(Object.keys(useWorldMapStore.getState().entities).sort()).toEqual(['a', 'b']);

    useWorldMapStore.getState().setEntities([entity('c')]);
    expect(Object.keys(useWorldMapStore.getState().entities)).toEqual(['c']);
  });

  it('upsert keeps existing entities and merges new ones', () => {
    useWorldMapStore.getState().setEntities([entity('a', { name: 'A' })]);
    useWorldMapStore.getState().upsertEntity(entity('a', { name: 'A2' }));
    useWorldMapStore.getState().upsertEntity(entity('b'));
    const state = useWorldMapStore.getState().entities;
    expect(state.a.name).toBe('A2');
    expect(state.b).toBeDefined();
  });

  it('removeEntity clears selection if the removed entity was selected', () => {
    useWorldMapStore.getState().setEntities([entity('a')]);
    useWorldMapStore.getState().setSelectedEntity('a');
    useWorldMapStore.getState().removeEntity('a');
    const state = useWorldMapStore.getState();
    expect(state.entities.a).toBeUndefined();
    expect(state.selectedEntityId).toBeNull();
  });

  it('removeEntity keeps selection if a different entity was selected', () => {
    useWorldMapStore.getState().setEntities([entity('a'), entity('b')]);
    useWorldMapStore.getState().setSelectedEntity('a');
    useWorldMapStore.getState().removeEntity('b');
    expect(useWorldMapStore.getState().selectedEntityId).toBe('a');
  });
});
