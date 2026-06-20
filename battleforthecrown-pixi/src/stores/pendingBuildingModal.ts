import { create } from 'zustand';

interface PendingBuildingModalState {
  /** Building type whose detail modal should open on the next VillageView render. */
  buildingType: string | null;
  /** Request a building modal to open (e.g. from an onboarding CTA on another screen). */
  request: (buildingType: string) => void;
  /** Clear the pending request once consumed by VillageView. */
  consume: () => void;
}

export const usePendingBuildingModalStore = create<PendingBuildingModalState>((set) => ({
  buildingType: null,
  request: (buildingType) => set({ buildingType }),
  consume: () => set({ buildingType: null }),
}));
