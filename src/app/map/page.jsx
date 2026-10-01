"use client";

import NaverMapContainer from "@/components/map/NaverMapContainer";
import Link from "next/link";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { useFilterStore } from "@/store/useFilterStore";

const REGIONS = ["ALL", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "제주"];

export default function MapPage() {
  const selectedRegion = useFilterStore((state) => state.selectedRegion);
  const setSelectedRegion = useFilterStore((state) => state.setSelectedRegion);
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookmarkItems = useBookmarkStore((state) => state.bookmarkItems);
  const savedItems = bookmarks.map((id) => bookmarkItems[id]).filter(Boolean);
  const mapItems = savedItems.filter((item) => item.type !== "movie")
    .filter((item) => selectedRegion === "ALL"
      || item.address?.includes(selectedRegion)
      || item.locationName?.includes(selectedRegion));

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">장소 기반 문화 탐색</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">지도 탐색</h1>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span>지역</span>
            <select
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {REGIONS.map((region) => <option key={region} value={region}>{region === "ALL" ? "전체 지역" : region}</option>)}
            </select>
          </label>
        </div>
        {mapItems.length === 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <p>{savedItems.length === 0 ? "위시리스트에 담은 문화 일정이 없습니다." : "선택한 지역에 표시할 비영화 일정이 없습니다."}</p>
            <Link href="/bookmarks" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">위시리스트 보기</Link>
          </div>
        )}
        <NaverMapContainer items={mapItems} />
      </main>
    </>
  );
}