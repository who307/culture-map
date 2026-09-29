import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCultureStore = create(
  persist(
    (set) => ({
      // 선택된 날짜 (기본값: 오늘 날짜 YYYY-MM-DD)
      selectedDate: new Date().toISOString().split('T')[0],
      setSelectedDate: (date) => set({ selectedDate: date }),

      // 선택된 지역 (기본값: 전체)
      selectedRegion: 'ALL',
      setSelectedRegion: (region) => set({ selectedRegion: region }),

      // 선택된 지도 마커 / 패널 상세 아이템
      selectedMapItem: null,
      setSelectedMapItem: (item) => set({ selectedMapItem: item }),

      // 찜한(북마크) 행사 ID 목록 (LocalStorage 자동 저장)
      bookmarks: [],
      toggleBookmark: (id) =>
        set((state) => {
          const exists = state.bookmarks.includes(id);
          return {
            bookmarks: exists
              ? state.bookmarks.filter((bId) => bId !== id)
              : [...state.bookmarks, id],
          };
        }),
    }),
    {
      name: 'culture-map-storage',
      partialize: (state) => ({ bookmarks: state.bookmarks }), // 찜 목록만 새로고침 시 유지
    }
  )
);