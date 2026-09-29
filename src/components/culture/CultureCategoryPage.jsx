"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import SkeletonCard from "@/components/common/SkeletonCard";
import CultureList from "@/components/culture/CultureList";
import SortSelect from "@/components/culture/SortSelect";
import { useCultureData } from "@/hooks/useCultureData";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCategory } from "@/utils/formatters";

export default function CultureCategoryPage({ category }) {
  const [sort, setSort] = useState("popularityRank");
  const selectedDate = useFilterStore((state) => state.selectedDate);
  const { data = [], isLoading, isError, refetch } = useCultureData(category, { sort });

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{selectedDate}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatCategory(category)}</h1>
          </div>
          <SortSelect value={sort} onChange={setSort} />
        </div>

        {isError ? (
          <div className="rounded-lg border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-slate-900">
            <p className="text-sm text-rose-600 dark:text-rose-400">문화 행사 정보를 불러오지 못했습니다.</p>
            <Button type="button" className="mt-4" onClick={() => refetch()}>다시 시도</Button>
          </div>
        ) : (
          isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }, (_, index) => <SkeletonCard key={index} />)}
            </div>
          ) : (
            <CultureList items={data} emptyMessage={`${selectedDate} 기준 진행 중인 일정이 없습니다.`} />
          )
        )}
      </main>
    </>
  );
}