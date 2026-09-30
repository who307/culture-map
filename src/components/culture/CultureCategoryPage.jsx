"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import SkeletonCard from "@/components/common/SkeletonCard";
import CultureList from "@/components/culture/CultureList";
import SortSelect from "@/components/culture/SortSelect";
import { useCultureData } from "@/hooks/useCultureData";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCategory } from "@/utils/formatters";

const PAGE_SIZE = 10;

export default function CultureCategoryPage({ category }) {
  const [sort, setSort] = useState("popularityRank");
  const [boxOfficeType, setBoxOfficeType] = useState("daily");
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const paginationContext = `${category}:${startDate}:${endDate}:${sort}:${boxOfficeType}`;
  const [pagination, setPagination] = useState({ context: null, page: 1 });
  const currentPage = pagination.context === paginationContext ? pagination.page : 1;
  const { data = [], isLoading, isError, refetch } = useCultureData(category, { sort, boxOfficeType });
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const visiblePage = Math.min(currentPage, Math.max(1, totalPages));
  const pageItems = data.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const boxOfficeRange = data[0]?.showRange
    ?.split("~")
    .map((date) => date.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"))
    .join(" ~ ");

  const selectPage = (page) => {
    const nextPage = typeof page === "function" ? page(currentPage) : page;
    setPagination({ context: paginationContext, page: nextPage });
  };

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {category === "movie" ? boxOfficeRange ?? `${startDate} ~ ${endDate}` : `${startDate} ~ ${endDate}`}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatCategory(category)}</h1>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {category === "movie" && (
              <div
                role="group"
                aria-label="박스오피스 조회 기간"
                className="inline-flex h-10 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
              >
                {[{ value: "daily", label: "일일" }, { value: "weekend", label: "주말" }].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={boxOfficeType === option.value}
                    onClick={() => setBoxOfficeType(option.value)}
                    className={`rounded-md px-3 text-sm font-semibold transition-colors ${
                      boxOfficeType === option.value
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <SortSelect value={sort} onChange={setSort} category={category} />
          </div>
        </div>

        {isError ? (
          <div className="rounded-lg border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-slate-900">
            <p className="text-sm text-rose-600 dark:text-rose-400">
              {category === "movie" ? "박스오피스 데이터를 불러오지 못했습니다." : "문화 행사 정보를 불러오지 못했습니다."}
            </p>
            <Button type="button" className="mt-4" onClick={() => refetch()}>다시 시도</Button>
          </div>
        ) : (
          isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }, (_, index) => <SkeletonCard key={index} />)}
            </div>
          ) : (
            <CultureList
              items={pageItems}
              emptyMessage={category === "movie"
                ? `${endDate} 기준 박스오피스 데이터가 없습니다.`
                : `${startDate} ~ ${endDate} 기간에 진행 중인 일정이 없습니다.`}
            />
          )
        )}
        {!isLoading && !isError && totalPages > 1 && (
          <nav aria-label="페이지 이동" className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => selectPage((page) => Math.max(1, page - 1))}
              disabled={visiblePage === 1}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                aria-current={visiblePage === page ? "page" : undefined}
                onClick={() => selectPage(page)}
                className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${
                  visiblePage === page
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selectPage((page) => Math.min(totalPages, page + 1))}
              disabled={visiblePage === totalPages}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              다음
            </button>
          </nav>
        )}
      </main>
    </>
  );
}