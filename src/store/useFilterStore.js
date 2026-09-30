import { create } from "zustand";
import { getTodayDate } from "@/utils/date";

export const useFilterStore = create((set) => ({
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  selectedRegion: "ALL",
  selectedMapItem: null,
  setStartDate: (startDate) => set((state) => {
    const nextStartDate = startDate || state.startDate;
    return {
      startDate: nextStartDate,
      endDate: state.endDate < nextStartDate ? nextStartDate : state.endDate,
    };
  }),
  setEndDate: (endDate) => set((state) => {
    const nextEndDate = endDate || state.endDate;
    return {
      startDate: state.startDate > nextEndDate ? nextEndDate : state.startDate,
      endDate: nextEndDate,
    };
  }),
  setSelectedRegion: (selectedRegion) => set({ selectedRegion }),
  setSelectedMapItem: (selectedMapItem) => set({ selectedMapItem }),
}));