import { create } from "zustand";
import type { MapMarkerDto } from "@battleforthecrown/shared/map-markers";

interface MapMarkersState {
  markers: MapMarkerDto[];
  selectedMarkerId: string | null;
  setMarkers: (markers: MapMarkerDto[]) => void;
  setSelectedMarkerId: (id: string | null) => void;
}

export const useMapMarkersStore = create<MapMarkersState>((set) => ({
  markers: [],
  selectedMarkerId: null,
  setMarkers: (markers) => set({ markers }),
  setSelectedMarkerId: (id) => set({ selectedMarkerId: id }),
}));
