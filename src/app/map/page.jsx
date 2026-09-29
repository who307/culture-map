"use client";

import Button from "@/components/common/Button";
import NaverMapContainer from "@/components/map/NaverMapContainer";
import { useCultureData } from "@/hooks/useCultureData";
import { useFilterStore } from "@/store/useFilterStore";

const REGIONS = ["ALL", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "제주"];

export default function MapPage() {
  const selectedRegion = useFilterStore((state) => state.selectedRegion);
  const setSelectedRegion = useFilterStore((state) => state.setSelectedRegion);
  const { data = [], isLoading, isError, refetch } = useCultureData("all");

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
        {isError ? (
          <div className="rounded-lg border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-slate-900">
            <p className="text-sm text-rose-600 dark:text-rose-400">문화 행사 정보를 불러오지 못했습니다.</p>
            <Button type="button" className="mt-4" onClick={() => refetch()}>다시 시도</Button>
          </div>
        ) : (
          <>
            {isLoading && <p className="mb-3 text-sm text-slate-500">지도 데이터를 불러오는 중입니다.</p>}
            <NaverMapContainer items={data} />
          </>
        )}
      </main>
    </>
  );
}