import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';
export type ToastRefundResource = 'wood' | 'stone' | 'iron' | 'population' | 'crowns';

export interface ToastRefundItem {
  resource: ToastRefundResource;
  amount: number;
}

export interface ToastEntry {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  refundItems?: ToastRefundItem[];
  ttlMs?: number;
}

export interface VictoryModalEntry {
  id: string;
  villageId: string;
  villageName: string;
  x: number;
  y: number;
  buildingsKept: number;
  previousTier: string | null;
}

export interface DefeatModalItem {
  id: string;
  villageId: string;
  villageName: string;
  x: number;
  y: number;
  conquerorName: string;
  visualTier: number; // 1-6
  reportId?: string; // présent à l'hydratation boot ; résolu live par le host
}

interface UiState {
  toasts: ToastEntry[];
  victoryModals: VictoryModalEntry[];
  defeatItems: DefeatModalItem[];
  defeatActiveIndex: number;
  pushToast: (toast: Omit<ToastEntry, 'id'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  pushVictoryModal: (
    entry: Omit<VictoryModalEntry, 'id'> & { id?: string },
  ) => string;
  dismissVictoryModal: (id: string) => void;
  clearVictoryModals: () => void;
  pushDefeatItem: (item: Omit<DefeatModalItem, 'id'> & { id?: string }) => void;
  setDefeatActiveIndex: (index: number) => void;
  acknowledgeDefeatItem: (villageId: string) => void;
  clearDefeatItems: () => void;
  /** Resets all transient UI state (toasts + queued modals) in one shot. */
  clear: () => void;
}

let toastSeq = 0;
let victoryModalSeq = 0;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  victoryModals: [],
  defeatItems: [],
  defeatActiveIndex: 0,
  pushToast: (toast) => {
    const id = toast.id ?? `toast-${++toastSeq}-${Date.now()}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
  pushVictoryModal: (entry) => {
    const id = entry.id ?? `victory-${++victoryModalSeq}-${Date.now()}`;
    set((state) => ({
      victoryModals: [...state.victoryModals, { ...entry, id }],
    }));
    return id;
  },
  dismissVictoryModal: (id) =>
    set((state) => ({
      victoryModals: state.victoryModals.filter((m) => m.id !== id),
    })),
  clearVictoryModals: () => set({ victoryModals: [] }),
  pushDefeatItem: (item) =>
    set((state) => {
      const id = item.id ?? `defeat-${item.villageId}`;
      const existingIndex = state.defeatItems.findIndex(
        (d) => d.villageId === item.villageId,
      );
      if (existingIndex !== -1) {
        // Dédup : fusionner reportId si l'ancien n'en a pas et le nouveau en fournit un
        const existing = state.defeatItems[existingIndex];
        const merged: DefeatModalItem = {
          ...existing,
          reportId:
            existing.reportId === undefined && item.reportId !== undefined
              ? item.reportId
              : existing.reportId,
        };
        const updated = [...state.defeatItems];
        updated[existingIndex] = merged;
        return { defeatItems: updated };
      }
      return { defeatItems: [...state.defeatItems, { ...item, id }] };
    }),
  setDefeatActiveIndex: (index) =>
    set((state) => ({
      defeatActiveIndex: Math.min(
        Math.max(0, state.defeatItems.length - 1),
        Math.max(0, index),
      ),
    })),
  acknowledgeDefeatItem: (villageId) =>
    set((state) => {
      const newItems = state.defeatItems.filter((d) => d.villageId !== villageId);
      const maxIndex = Math.max(0, newItems.length - 1);
      return {
        defeatItems: newItems,
        defeatActiveIndex: Math.min(state.defeatActiveIndex, maxIndex),
      };
    }),
  clearDefeatItems: () => set({ defeatItems: [], defeatActiveIndex: 0 }),
  clear: () =>
    set({ toasts: [], victoryModals: [], defeatItems: [], defeatActiveIndex: 0 }),
}));
