import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface OnboardingFabOffset {
  x: number;
  y: number;
}

interface OnboardingFabState {
  /** User drag offset from the default anchor, persisted across navigation + reloads. */
  offset: OnboardingFabOffset;
  setOffset: (offset: OnboardingFabOffset) => void;
  reset: () => void;
}

const DEFAULT_OFFSET: OnboardingFabOffset = { x: 0, y: 0 };

export const useOnboardingFabStore = create<OnboardingFabState>()(
  persist(
    (set) => ({
      offset: DEFAULT_OFFSET,
      setOffset: (offset) => set({ offset }),
      reset: () => set({ offset: DEFAULT_OFFSET }),
    }),
    {
      name: 'bftc-onboarding-fab',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
