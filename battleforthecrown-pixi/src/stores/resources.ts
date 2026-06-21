import { create } from 'zustand';

export interface ResourcesSnapshot {
  villageId: string;
  wood: number;
  stone: number;
  iron: number;
  maxPerType: number;
  productionRates: { wood: number; stone: number; iron: number };
  /** ms epoch — backend payload exposes ISO, store keeps numeric for fast math. */
  lastUpdateTs: number;
}

interface ResourcesState {
  byVillageId: Record<string, ResourcesSnapshot>;
  setResources: (snapshot: ResourcesSnapshot) => void;
  clear: () => void;
}

export const useResourcesStore = create<ResourcesState>((set) => ({
  byVillageId: {},
  setResources: (snapshot) =>
    set((state) => ({
      byVillageId: { ...state.byVillageId, [snapshot.villageId]: snapshot },
    })),
  clear: () => set({ byVillageId: {} }),
}));