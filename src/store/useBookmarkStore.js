import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useBookmarkStore = create(
  persist(
    (set) => ({
      bookmarks: [],
      bookmarkItems: {},
      toggleBookmark: (itemOrId) => set((state) => {
        const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
        if (!id) return state;

        const isBookmarked = state.bookmarks.includes(id);
        const bookmarkItems = { ...state.bookmarkItems };
        if (isBookmarked) {
          delete bookmarkItems[id];
          return {
            bookmarks: state.bookmarks.filter((bookmarkId) => bookmarkId !== id),
            bookmarkItems,
          };
        }

        if (typeof itemOrId === "object") bookmarkItems[id] = itemOrId;
        return { bookmarks: [...state.bookmarks, id], bookmarkItems };
      }),
    }),
    {
      name: "culture-map-storage",
      partialize: (state) => ({ bookmarks: state.bookmarks, bookmarkItems: state.bookmarkItems }),
    }
  )
);