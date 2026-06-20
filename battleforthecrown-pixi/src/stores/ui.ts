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

/**
 * One lost village in the defeat carousel shown to the conquered player.
 * `id` is stable per `villageId` so a live `village.conquered` event and the
 * boot hydration from unread reports dedup onto the same carousel item.
 */
export interface DefeatModalItem {
  id: string;
  villageId: string;
  villageName: string;
  x: number;
  y: number;
  newOwnerName: string;
  /** Castle level of the lost village at T; null for barbarian-origin losses. */
  castleLevel: number | null;
  /** Combat report id, when the item was hydrated/known from a report. */
  reportId?: string;
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
  /**
   * Push a lost village onto the carousel. Dedup by `villageId`: a duplicate is
   * ignored (its `reportId` backfilled if newly known). Adding while the modal
   * is open appends without closing it or resetting `defeatActiveIndex`.
   */
  pushDefeatItem: (item: Omit<DefeatModalItem, 'id'> & { id?: string }) => void;
  /** Acknowledge (remove) one carousel item, keeping the index in range. */
  acknowledgeDefeatItem: (id: string) => void;
  setDefeatActiveIndex: (index: number) => void;
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
      const existing = state.defeatItems.find(
        (i) => i.villageId === item.villageId,
      );
      if (existing) {
        // Dedup: same lost village from live WS + boot report. Backfill reportId
        // if this push knows it and the stored item did not.
        if (item.reportId && !existing.reportId) {
          return {
            defeatItems: state.defeatItems.map((i) =>
              i.villageId === item.villageId
                ? { ...i, reportId: item.reportId }
                : i,
            ),
          };
        }
        return state;
      }
      const id = item.id ?? `defeat-${item.villageId}`;
      return { defeatItems: [...state.defeatItems, { ...item, id }] };
    }),
  acknowledgeDefeatItem: (id) =>
    set((state) => {
      const index = state.defeatItems.findIndex((i) => i.id === id);
      if (index === -1) return state;
      const defeatItems = state.defeatItems.filter((i) => i.id !== id);
      // Keep the index pointing at a valid item: clamp into the shrunk list, and
      // shift left when we removed an item before the active one.
      const shifted =
        index < state.defeatActiveIndex
          ? state.defeatActiveIndex - 1
          : state.defeatActiveIndex;
      const defeatActiveIndex = Math.max(
        0,
        Math.min(shifted, defeatItems.length - 1),
      );
      return { defeatItems, defeatActiveIndex };
    }),
  setDefeatActiveIndex: (index) => set({ defeatActiveIndex: index }),
  clearDefeatItems: () => set({ defeatItems: [], defeatActiveIndex: 0 }),
  clear: () =>
    set({
      toasts: [],
      victoryModals: [],
      defeatItems: [],
      defeatActiveIndex: 0,
    }),
}));
