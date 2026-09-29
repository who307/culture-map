import { create } from "zustand";
import { getTodayDate } from "@/utils/date";

export const useFilterStore = create((set) => ({
  selectedDate: getTodayDate(),
  selectedRegion: "ALL",
  selectedMapItem: null,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedRegion: (selectedRegion) => set({ selectedRegion }),
  setSelectedMapItem: (selectedMapItem) => set({ selectedMapItem }),
}));