import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastEntry {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
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

interface UiState {
  openModalId: string | null;
  openPanelId: string | null;
  toasts: ToastEntry[];
  victoryModals: VictoryModalEntry[];
  openModal: (id: string | null) => void;
  openPanel: (id: string | null) => void;
  pushToast: (toast: Omit<ToastEntry, 'id'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  pushVictoryModal: (
    entry: Omit<VictoryModalEntry, 'id'> & { id?: string },
  ) => string;
  dismissVictoryModal: (id: string) => void;
  clearVictoryModals: () => void;
}

let toastSeq = 0;
let victoryModalSeq = 0;

export const useUiStore = create<UiState>((set) => ({
  openModalId: null,
  openPanelId: null,
  toasts: [],
  victoryModals: [],
  openModal: (id) => set({ openModalId: id }),
  openPanel: (id) => set({ openPanelId: id }),
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
}));
