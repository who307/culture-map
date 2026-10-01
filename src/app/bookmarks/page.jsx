"use client";

import Link from "next/link";
import CultureList from "@/components/culture/CultureList";
import { useBookmarkStore } from "@/store/useBookmarkStore";

export default function BookmarksPage() {
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookmarkItems = useBookmarkStore((state) => state.bookmarkItems);
  const items = bookmarks.map((id) => bookmarkItems[id]).filter(Boolean);
  const unavailableCount = bookmarks.length - items.length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">저장한 문화 일정</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">위시리스트</h1>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{bookmarks.length}개</span>
      </div>

      <CultureList items={items} emptyMessage="아직 저장한 문화 일정이 없습니다." />

      {unavailableCount > 0 && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          이전에 저장한 {unavailableCount}개 항목은 상세 데이터가 저장되지 않아 목록에서 복원할 수 없습니다. 해당 항목을 다시 찾아 저장해 주세요.
        </p>
      )}
    </main>
  );
}