"use client";

import Link from "next/link";
import { useFilterStore } from "@/store/useFilterStore";
import { useCultureData } from "@/hooks/useCultureData";
import CultureCard from "@/components/culture/CultureCard";
import WeekStrip from "@/components/culture/WeekStrip";
import SkeletonCard from "@/components/common/SkeletonCard";
import Button from "@/components/common/Button";
import { formatReadableRange } from "@/utils/formatters";
import { CATEGORIES } from "@/utils/categories";
import { REGIONS } from "@/utils/regions";
import { isFutureDate } from "@/utils/date";
import { useIsClient } from "@/hooks/useIsClient";

export default function HomePage() {
    const { startDate, endDate, selectedRegion, setSelectedRegion } = useFilterStore();
    const { data, isLoading, isError, refetch } = useCultureData("home");
    const regionLabel = selectedRegion === "ALL" ? "전국" : selectedRegion;
    const isClient = useIsClient();
    // 박스오피스는 지난 날짜의 집계만 있어 기간 전체가 미래면 영화 줄을 숨김
    const visibleCategories = isFutureDate(startDate)
        ? CATEGORIES.filter((category) => category.key !== "movie")
        : CATEGORIES;

    return (
        <main id="main-content" className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:pt-10">
            {/* 편성표 머리: 제목과 지역, 그 아래 한 주 날짜 띠 */}
            <section aria-labelledby="schedule-heading" className="space-y-5 border-b border-line pb-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 id="schedule-heading" className="font-display text-[1.75rem] leading-tight text-ink md:text-[2rem]">
                            {regionLabel} 문화 일정
                        </h1>
                        {/* 빌드 때 만든 HTML에는 빌드한 날의 날짜가 들어가므로 날짜는 브라우저에서만 표시 */}
                        <p className="mt-1 text-[15px] text-ink-soft tabular-nums">
                            {isClient ? formatReadableRange(startDate, endDate) : "선택한 기간"}에 열리는 영화, 공연, 지역 행사, 전시
                        </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                        지역
                        <select
                            name="region"
                            autoComplete="off"
                            value={selectedRegion}
                            onChange={(event) => setSelectedRegion(event.target.value)}
                            className="h-10 cursor-pointer rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink"
                        >
                            {REGIONS.map((region) => (
                                <option key={region.value} value={region.value}>{region.label}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <WeekStrip />
            </section>

            {/* 에러 화면 */}
            {isError && (
                <div role="alert" className="mt-8 rounded-xl border border-line bg-surface p-8 text-center">
                    <p className="text-sm font-semibold text-danger">문화 행사 정보를 불러오지 못했습니다.</p>
                    <Button type="button" variant="secondary" className="mt-4" onClick={() => refetch()}>
                        다시 시도
                    </Button>
                </div>
            )}

            {/* 카테고리별 줄: 왼쪽 행 제목, 오른쪽 카드 (모바일은 카드가 가로로 넘어감) */}
            {visibleCategories.map((category) => {
                // 객체 구조 데이터에서 해당 카테고리 배열 추출
                const categoryItems = data?.[category.key] || [];
                const headingId = `home-${category.key}`;
                return (
                    <section
                        key={category.key}
                        aria-labelledby={headingId}
                        aria-busy={isLoading}
                        className="grid gap-4 border-b border-line py-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8"
                    >
                        <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-start lg:justify-start lg:gap-3">
                            {/* 편성표의 줄 색처럼 제목 왼쪽에 카테고리 색 세로선 */}
                            <h2 id={headingId} className={`border-l-[3px] pl-3 text-xl font-bold leading-tight text-ink ${category.bar}`}>
                                {category.homeTitle}
                            </h2>
                            <Link
                                href={category.href}
                                className="shrink-0 text-sm font-semibold text-accent underline-offset-4 hover:underline"
                            >
                                {category.label} 전체보기
                            </Link>
                        </div>

                        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 *:w-[44%] *:shrink-0 *:snap-start sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:*:w-auto md:grid-cols-4 xl:grid-cols-5">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, idx) => <SkeletonCard key={idx} />)
                            ) : categoryItems.length > 0 ? (
                                categoryItems.map((item) => <CultureCard key={item.id} item={item} />)
                            ) : (
                                <p className="!w-full rounded-xl border border-dashed border-line-strong py-10 text-center text-sm text-ink-faint sm:col-span-full">
                                    이 기간에 등록된 일정이 없습니다.
                                </p>
                            )}
                        </div>
                    </section>
                );
            })}
        </main>
    );
}
