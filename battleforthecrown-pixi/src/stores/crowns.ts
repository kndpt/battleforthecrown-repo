import { create } from 'zustand';

export interface CrownsSnapshot {
  userId: string;
  worldId: string;
  balance: number;
  productionRate: number;
  /** ms epoch */
  lastUpdateTs: number;
}

interface CrownsState {
  byKey: Record<string, CrownsSnapshot>;
  setCrowns: (snapshot: CrownsSnapshot) => void;
  clear: () => void;
}

const crownsKey = (userId: string, worldId: string) => `${userId}:${worldId}`;

export const useCrownsStore = create<CrownsState>((set) => ({
  byKey: {},
  setCrowns: (snapshot) =>
    set((state) => ({
      byKey: { ...state.byKey, [crownsKey(snapshot.userId, snapshot.worldId)]: snapshot },
    })),
  clear: () => set({ byKey: {} }),
}));