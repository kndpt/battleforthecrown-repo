import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GameState {
  worldId: string | null;
  villageId: string | null;
  setWorld: (worldId: string | null) => void;
  setVillage: (villageId: string | null) => void;
  setContext: (context: { worldId: string | null; villageId: string | null }) => void;
  clear: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      worldId: null,
      villageId: null,
      setWorld: (worldId) => set({ worldId }),
      setVillage: (villageId) => set({ villageId }),
      setContext: ({ worldId, villageId }) => set({ worldId, villageId }),
      clear: () => set({ worldId: null, villageId: null }),
    }),
    {
      name: 'bftc-game',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
