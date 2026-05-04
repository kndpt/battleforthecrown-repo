import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastEntry {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  ttlMs?: number;
}

interface UiState {
  openModalId: string | null;
  openPanelId: string | null;
  toasts: ToastEntry[];
  openModal: (id: string | null) => void;
  openPanel: (id: string | null) => void;
  pushToast: (toast: Omit<ToastEntry, 'id'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>((set) => ({
  openModalId: null,
  openPanelId: null,
  toasts: [],
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
}));
