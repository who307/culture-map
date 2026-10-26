"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import SkeletonCard from "@/components/common/SkeletonCard";
import CultureList from "@/components/culture/CultureList";
import SortSelect from "@/components/culture/SortSelect";
import { useCultureData } from "@/hooks/useCultureData";
import { useIsClient } from "@/hooks/useIsClient";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCategory, formatReadableRange, formatShowRange } from "@/utils/formatters";
import { getTodayDate, isFutureDate } from "@/utils/date";
import { CATEGORY_BY_KEY } from "@/utils/categories";

const PAGE_SIZE = 20;
const pagerButtonClassName = "h-10 min-w-10 cursor-pointer rounded-lg border px-3 text-sm font-semibold tabular-nums transition-colors duration-150";

export default function CultureCategoryPage({ category }) {
  const [sort, setSort] = useState(category === "concert" || category === "musical" ? "startDate" : "popularityRank");
  const [boxOfficeType, setBoxOfficeType] = useState("daily");
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const setStartDate = useFilterStore((state) => state.setStartDate);
  const setEndDate = useFilterStore((state) => state.setEndDate);
  const isFutureBoxOffice = category === "movie" && isFutureDate(startDate);
  const isClient = useIsClient();
  const paginationContext = `${category}:${startDate}:${endDate}:${sort}:${boxOfficeType}`;
  const [pagination, setPagination] = useState({ context: null, page: 1 });
  const currentPage = pagination.context === paginationContext ? pagination.page : 1;
  const { data = [], isLoading, isError, refetch } = useCultureData(category, { sort, boxOfficeType });
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const visiblePage = Math.min(currentPage, Math.max(1, totalPages));
  const pageItems = data.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const boxOfficeRange = formatShowRange(data[0]?.showRange);

  const selectPage = (page) => {
    const nextPage = typeof page === "function" ? page(currentPage) : page;
    setPagination({ context: paginationContext, page: nextPage });
  };

  return (
    <>
      <main id="main-content" className="mx-auto max-w-7xl px-4 pb-16 pt-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className={`border-l-4 pl-3.5 font-display text-[1.75rem] leading-tight text-ink md:text-[2rem] ${CATEGORY_BY_KEY[category]?.bar ?? "border-line-strong"}`}>
              {formatCategory(category)}
            </h1>
            {/* 빌드 시점 날짜가 남지 않도록 날짜는 브라우저에서만 표시 */}
            <p className="mt-2 min-h-[1.5em] text-[15px] text-ink-soft tabular-nums">
              {!isClient ? "" : category === "movie" && boxOfficeRange ? `${boxOfficeRange} 집계` : formatReadableRange(startDate, endDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {category === "movie" && (
              <div
                role="group"
                aria-label="박스오피스 조회 기간"
                className="inline-flex h-10 rounded-lg border border-line bg-surface p-1"
              >
                {[{ value: "daily", label: "일일" }, { value: "weekend", label: "주말" }].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={boxOfficeType === option.value}
                    onClick={() => setBoxOfficeType(option.value)}
                    className={`cursor-pointer rounded-md px-3 text-sm font-semibold transition-colors duration-150 ${
                      boxOfficeType === option.value
                        ? "bg-ink text-paper"
                        : "text-ink-soft hover:bg-sunken hover:text-ink"
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
          <div role="alert" className="rounded-xl border border-line bg-surface p-8 text-center">
            <p className="text-sm font-semibold text-danger">
              {category === "movie" ? "박스오피스 데이터를 불러오지 못했습니다." : "문화 행사 정보를 불러오지 못했습니다."}
            </p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => refetch()}>다시 시도</Button>
          </div>
        ) : (
          isLoading ? (
            <div aria-busy="true" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              <span className="sr-only">목록을 불러오는 중…</span>
              {Array.from({ length: 10 }, (_, index) => <SkeletonCard key={index} />)}
            </div>
          ) : isFutureBoxOffice ? (
            // 미래 날짜에는 박스오피스 집계가 없음을 알리고 오늘로 돌아갈 방법을 줌
            <div className="rounded-xl border border-dashed border-line-strong px-4 py-14 text-center">
              <p className="text-sm text-ink-soft">
                박스오피스는 지난 날짜의 집계만 있어 미래 날짜에는 표시되지 않습니다.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  const today = getTodayDate();
                  setStartDate(today);
                  setEndDate(today);
                }}
              >
                오늘 기준으로 보기
              </Button>
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
          <nav aria-label="페이지 이동" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => selectPage((page) => Math.max(1, page - 1))}
              disabled={visiblePage === 1}
              className={`${pagerButtonClassName} border-line text-ink hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                aria-current={visiblePage === page ? "page" : undefined}
                aria-label={`${page}페이지`}
                onClick={() => selectPage(page)}
                className={`${pagerButtonClassName} ${
                  visiblePage === page
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink hover:bg-sunken"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selectPage((page) => Math.min(totalPages, page + 1))}
              disabled={visiblePage === totalPages}
              className={`${pagerButtonClassName} border-line text-ink hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}
            >
              다음
            </button>
          </nav>
        )}
      </main>
    </>
  );
}