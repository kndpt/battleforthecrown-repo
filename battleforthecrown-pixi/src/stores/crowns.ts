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

export const crownsKey = (userId: string, worldId: string) => `${userId}:${worldId}`;

export const useCrownsStore = create<CrownsState>((set) => ({
  byKey: {},
  setCrowns: (snapshot) =>
    set((state) => ({
      byKey: { ...state.byKey, [crownsKey(snapshot.userId, snapshot.worldId)]: snapshot },
    })),
  clear: () => set({ byKey: {} }),
}));

export function selectCrowns(userId: string | null, worldId: string | null) {
  return (state: CrownsState): CrownsSnapshot | undefined => {
    if (!userId || !worldId) return undefined;
    return state.byKey[crownsKey(userId, worldId)];
  };
}
