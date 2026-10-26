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
    <main id="main-content" className="mx-auto max-w-7xl px-4 pb-16 pt-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-6">
        <h1 className="font-display text-[1.75rem] leading-tight text-ink md:text-[2rem]">위시리스트</h1>
        <span className="text-sm font-medium text-ink-soft tabular-nums">{bookmarks.length}개 저장됨</span>
      </div>

      <CultureList items={items} emptyMessage="아직 저장한 일정이 없습니다. 카드의 하트를 눌러 담아 보세요." />

      {unavailableCount > 0 && (
        <p className="mt-4 text-xs text-ink-faint">
          이전에 저장한 {unavailableCount}개 항목은 상세 데이터가 저장되지 않아 목록에서 복원할 수 없습니다. 해당 항목을 다시 찾아 저장해 주세요.
        </p>
      )}
    </main>
  );
}