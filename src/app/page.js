"use client";

import { useFilterStore } from "@/store/useFilterStore";
import { useCultureData } from "@/hooks/useCultureData";
import CultureCard from "@/components/culture/CultureCard";
import SkeletonCard from "@/components/common/SkeletonCard";

const CATEGORIES = [
    { key: "movie", title: "🎬 박스오피스 영화", href: "/movies" },
    { key: "concert", title: "🎤 인기 콘서트", href: "/concerts" },
    { key: "musical", title: "🎭 대표 뮤지컬", href: "/musicals" },
    { key: "festival", title: "🎪 지역 축제 및 행사", href: "/festivals" },
    { key: "exhibition", title: "🖼️ 전시회 및 미술관", href: "/exhibitions" },
];

export default function HomePage() {
    const { startDate, endDate } = useFilterStore();
    const { data, isLoading, isError } = useCultureData("home");

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 transition-colors duration-200">
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
                {/* 히어로 배너 */}
                <section className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-800 text-white shadow-lg">
                    <span className="text-xs font-bold tracking-widest text-indigo-200 dark:text-indigo-300 uppercase">Culture Map Today</span>
                    <h1 className="text-2xl md:text-3xl font-extrabold mt-1">{startDate} ~ {endDate} 추천 문화생활 🎯</h1>
                    <p className="text-sm text-indigo-100 dark:text-indigo-200 mt-2">선택한 기간에 즐길 수 있는 문화 일정을 탐색해보세요.</p>
                </section>

                {/* 에러 화면 */}
                {isError && (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-rose-900/40 shadow-sm transition-colors">
                        <p className="text-rose-500 dark:text-rose-400 font-semibold text-sm">문화 행사 정보를 불러오지 못했습니다.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-3 px-4 py-1.5 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors">
                            다시 시도
                        </button>
                    </div>
                )}

                {/* 카테고리별 섹션 */}
                {CATEGORIES.map((category) => {
                    // 객체 구조 데이터에서 해당 카테고리 배열 추출
                    const categoryItems = data?.[category.key] || [];

                    return (
                        <section key={category.key} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors">{category.title}</h2>
                                <a href={category.href} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                                    전체보기 &rarr;
                                </a>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, idx) => <SkeletonCard key={idx} />)
                                ) : categoryItems.length > 0 ? (
                                    categoryItems.map((item) => <CultureCard key={item.id} item={item} />)
                                ) : (
                                    <div className="col-span-full py-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                        등록된 일정이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })}
            </main>
        </div>
    );
}
