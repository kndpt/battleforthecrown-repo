import { create } from 'zustand';

export type ExpeditionPhase = 'EN_ROUTE' | 'RESOLVED' | 'RETURNING' | 'RETURNED';
export type ExpeditionKind = 'ATTACK' | 'REINFORCE' | 'SCOUT' | 'CARAVAN';

export interface ExpeditionSnapshot {
  expeditionId: string;
  kind?: ExpeditionKind;
  reportId?: string;
  villageId: string;
  originVillageId?: string;
  targetVillageId?: string;
  villageName?: string;
  origin: { x: number; y: number };
  target: { x: number; y: number };
  targetName?: string;
  targetKind?: string;
  phase: ExpeditionPhase;
  /** ms epoch */
  departAt: number;
  arrivalAt: number;
  returnAt?: number;
  isVictory?: boolean;
}

interface ExpeditionsState {
  byId: Record<string, ExpeditionSnapshot>;
  add: (expedition: ExpeditionSnapshot) => void;
  update: (expeditionId: string, patch: Partial<ExpeditionSnapshot>) => void;
  remove: (expeditionId: string) => void;
  clear: () => void;
}

export const useExpeditionsStore = create<ExpeditionsState>((set) => ({
  byId: {},
  add: (expedition) =>
    set((state) => ({ byId: { ...state.byId, [expedition.expeditionId]: expedition } })),
  update: (expeditionId, patch) =>
    set((state) => {
      const current = state.byId[expeditionId];
      if (!current) return state;
      return {
        byId: { ...state.byId, [expeditionId]: { ...current, ...patch } },
      };
    }),
  remove: (expeditionId) =>
    set((state) => {
      if (!(expeditionId in state.byId)) return state;
      const next = { ...state.byId };
      delete next[expeditionId];
      return { byId: next };
    }),
  clear: () => set({ byId: {} }),
}));
