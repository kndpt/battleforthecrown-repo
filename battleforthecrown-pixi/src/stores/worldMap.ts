import { create } from 'zustand';
import type { MapEntity } from '@/api/world-types';

export interface PendingMapFocus {
  x: number;
  y: number;
}

interface WorldMapState {
  entities: Record<string, MapEntity>;
  selectedEntityId: string | null;
  pendingFocus: PendingMapFocus | null;
  setEntities: (entities: MapEntity[]) => void;
  upsertEntity: (entity: MapEntity) => void;
  removeEntity: (id: string) => void;
  setSelectedEntity: (id: string | null) => void;
  setPendingFocus: (focus: PendingMapFocus | null) => void;
  clear: () => void;
}

export const useWorldMapStore = create<WorldMapState>((set) => ({
  entities: {},
  selectedEntityId: null,
  pendingFocus: null,
  setEntities: (entities) => {
    const next: Record<string, MapEntity> = {};
    for (const entity of entities) {
      next[entity.id] = entity;
    }
    set({ entities: next });
  },
  upsertEntity: (entity) =>
    set((state) => ({ entities: { ...state.entities, [entity.id]: entity } })),
  removeEntity: (id) =>
    set((state) => {
      if (!(id in state.entities)) return state;
      const next = { ...state.entities };
      delete next[id];
      const selectedEntityId = state.selectedEntityId === id ? null : state.selectedEntityId;
      return { entities: next, selectedEntityId };
    }),
  setSelectedEntity: (id) => set({ selectedEntityId: id }),
  setPendingFocus: (focus) => set({ pendingFocus: focus }),
  clear: () => set({ entities: {}, selectedEntityId: null, pendingFocus: null }),
}));
