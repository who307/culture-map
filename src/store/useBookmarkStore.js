import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useBookmarkStore = create(
  persist(
    (set) => ({
      bookmarks: [],
      toggleBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(id)
            ? state.bookmarks.filter((bookmarkId) => bookmarkId !== id)
            : [...state.bookmarks, id],
        })),
    }),
    {
      name: "culture-map-storage",
      partialize: (state) => ({ bookmarks: state.bookmarks }),
    }
  )
);