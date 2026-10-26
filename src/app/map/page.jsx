"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import Link from "next/link";
import { useCultureData } from "@/hooks/useCultureData";
import { useBookmarkStore } from "@/store/useBookmarkStore";
import { useFilterStore } from "@/store/useFilterStore";
import { REGIONS } from "@/utils/regions";

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
          <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                  <h1 className="font-display text-[1.75rem] leading-tight text-ink md:text-[2rem]">지도 탐색</h1>
                  <div className="flex flex-wrap items-end gap-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                          <span>지역</span>
                          <select
                              name="region"
                              autoComplete="off"
                              value={selectedRegion}
                              onChange={(event) => setSelectedRegion(event.target.value)}
                              className="h-10 cursor-pointer rounded-lg border border-line bg-surface px-3 text-ink">
                              {REGIONS.map((region) => (
                                  <option key={region.value} value={region.value}>
                                      {region.label}
                                  </option>
                              ))}
                          </select>
                      </label>
                      <div role="group" aria-label="지도 표시 항목" className="inline-flex h-10 items-center rounded-lg border border-line bg-surface p-1">
                          {[
                              { value: "all", label: "전체 문화" },
                              { value: "bookmarks", label: "위시리스트" },
                          ].map((option) => (
                              <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={mapMode === option.value}
                                  onClick={() => setMapMode(option.value)}
                                  className={`h-8 cursor-pointer rounded-md px-3 text-sm font-semibold transition-colors duration-150 ${
                                      mapMode === option.value ? "bg-ink text-paper" : "text-ink-soft hover:bg-sunken hover:text-ink"
                                  }`}>
                                  {option.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
              {isError ? (
                  <div role="alert" className="rounded-xl border border-line bg-surface p-8 text-center">
                      <p className="text-sm font-semibold text-danger">지도 데이터를 불러오지 못했습니다.</p>
                      <Button type="button" variant="secondary" className="mt-4" onClick={() => refetch()}>
                          다시 시도
                      </Button>
                  </div>
              ) : (
                  <>
                      <p role="status" className="mb-3 text-sm text-ink-soft empty:hidden">{isLoading ? "문화 일정을 불러오는 중…" : ""}</p>
                      {!isLoading && mapItems.length === 0 && (
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
                              <p>{mapMode === "bookmarks" && savedItems.length === 0 ? "위시리스트에 담은 비영화 일정이 없습니다." : "선택한 조건에서 지도에 표시할 일정이 없습니다."}</p>
                              {mapMode === "bookmarks" && (
                                  <Link href="/bookmarks" className="font-semibold text-accent underline-offset-2 hover:underline">
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