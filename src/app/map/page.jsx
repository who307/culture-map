"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import Link from "next/link";
import { useCultureData } from "@/hooks/useCultureData";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { useFilterStore } from "@/store/useFilterStore";

const REGIONS = ["ALL", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "제주"];

export default function MapPage() {
  const [mapMode, setMapMode] = useState("all");
  const selectedRegion = useFilterStore((state) => state.selectedRegion);
  const setSelectedRegion = useFilterStore((state) => state.setSelectedRegion);
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookmarkItems = useBookmarkStore((state) => state.bookmarkItems);
  const { data = [], isLoading, isError, refetch } = useCultureData("all");
  const savedItems = bookmarks.map((id) => bookmarkItems[id]).filter(Boolean);
  const sourceItems = mapMode === "bookmarks"
    ? savedItems.filter((item) => item.type !== "movie")
    : data;
  const mapItems = sourceItems
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
                  <div className="flex flex-wrap items-end gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <span>지역</span>
                          <select
                              value={selectedRegion}
                              onChange={(event) => setSelectedRegion(event.target.value)}
                              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                              {REGIONS.map((region) => (
                                  <option key={region} value={region}>
                                      {region === "ALL" ? "전체 지역" : region}
                                  </option>
                              ))}
                          </select>
                      </label>
                      <div role="group" aria-label="지도 표시 항목" className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                          {[
                              { value: "all", label: "전체 문화" },
                              { value: "bookmarks", label: "위시리스트" },
                          ].map((option) => (
                              <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={mapMode === option.value}
                                  onClick={() => setMapMode(option.value)}
                                  className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${
                                      mapMode === option.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                  }`}>
                                  {option.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
              {isError ? (
                  <div className="rounded-lg border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-slate-900">
                      <p className="text-sm text-rose-600 dark:text-rose-400">지도 데이터를 불러오지 못했습니다.</p>
                      <Button type="button" className="mt-4" onClick={() => refetch()}>
                          다시 시도
                      </Button>
                  </div>
              ) : (
                  <>
                      {isLoading && <p className="mb-3 text-sm text-slate-500">문화 일정을 불러오는 중입니다.</p>}
                      {!isLoading && mapItems.length === 0 && (
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                              <p>{mapMode === "bookmarks" && savedItems.length === 0 ? "위시리스트에 담은 비영화 일정이 없습니다." : "선택한 조건에서 지도에 표시할 일정이 없습니다."}</p>
                              {mapMode === "bookmarks" && (
                                  <Link href="/bookmarks" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                                      위시리스트 보기
                                  </Link>
                              )}
                          </div>
                      )}
                      <NaverMapContainer items={isLoading ? [] : mapItems} />
                  </>
              )}
          </main>
      </>
  );
}