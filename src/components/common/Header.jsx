"use client";

import { useState, useEffect } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import Navbar, { NAV_ITEMS } from "@/components/common/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();
    const { startDate, endDate, setStartDate, setEndDate } = useFilterStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // 마운트 시 저장된 테마 또는 시스템 설정 불러오기
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        document.documentElement.classList.toggle("dark", savedTheme === "dark" || (!savedTheme && systemDark));
    }, []);

    // 다크모드 토글 함수
    const toggleDarkMode = () => {
        const nextState = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", nextState);
        localStorage.setItem("theme", nextState ? "dark" : "light");
    };

    return (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* 로고 영역 */}
                <Link href="/" className="inline-flex items-center group focus:outline-none">
                    <svg width="170" height="38" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200 group-hover:scale-[1.02]">
                        <defs>
                            <linearGradient id="headerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#4F46E5" />
                                <stop offset="100%" stopColor="#7C3AED" />
                            </linearGradient>
                        </defs>

                        <g transform="translate(2, 3)">
                            <path
                                d="M22 2C12.059 2 4 10.059 4 20C4 32.5 20.2 43.1 20.9 43.6C21.2 43.8 21.6 44 22 44C22.4 44 22.8 43.8 23.1 43.6C23.8 43.1 40 32.5 40 20C40 10.059 31.941 2 22 2Z"
                                fill="url(#headerLogoGrad)"
                            />
                            <rect x="13" y="13" width="18" height="13" rx="2.5" fill="#FFFFFF" />
                            <circle cx="13" cy="19.5" r="2" fill="url(#headerLogoGrad)" />
                            <circle cx="31" cy="19.5" r="2" fill="url(#headerLogoGrad)" />
                            <path d="M22 15.2L22.9 17.2L25.1 17.4L23.5 18.9L23.9 21.1L22 20L20.1 21.1L20.5 18.9L18.9 17.4L21.1 17.2L22 15.2Z" fill="url(#headerLogoGrad)" />
                        </g>

                        <text
                            x="54"
                            y="27"
                            fontFamily="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif"
                            fontWeight="800"
                            fontSize="20"
                            className="fill-slate-900 dark:fill-slate-100 transition-colors"
                            letterSpacing="-0.5px">
                            컬쳐맵
                        </text>
                        <text
                            x="54.5"
                            y="39"
                            fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                            fontWeight="700"
                            fontSize="8.5"
                            className="fill-slate-500 dark:fill-slate-400 transition-colors"
                            letterSpacing="2.2px">
                            CULTURE MAP
                        </text>
                        <circle cx="123" cy="24" r="2.8" fill="#F43F5E" />
                    </svg>
                </Link>

                {/* GNV 영역 */}
                <Navbar />

                <div className="flex">
                {/* 우측 유틸리티 영역 (날짜 피커, 다크모드 버튼, 지도 탐색) */}
                    <div className="flex items-center gap-2.5">
                        <fieldset className="hidden items-center gap-2 md:flex">
                            <legend className="sr-only">일정 조회 기간</legend>
                            <label className="sr-only" htmlFor="desktop-start-date">시작일</label>
                            <input
                                id="desktop-start-date"
                                type="date"
                                aria-label="시작일"
                                value={startDate}
                                max={endDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-32 px-2 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                            />
                            <span aria-hidden="true" className="text-xs text-slate-400">~</span>
                            <label className="sr-only" htmlFor="desktop-end-date">종료일</label>
                            <input
                                id="desktop-end-date"
                                type="date"
                                aria-label="종료일"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-32 px-2 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                            />
                        </fieldset>

                        {/* 다크모드 토글 버튼 */}
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            aria-label="다크모드 토글"
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 cursor-pointer">
                            <svg className="h-4 w-4 text-slate-600 dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            <svg className="hidden h-4 w-4 text-amber-400 dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>

                        {/* 지도 탐색 링크 */}
                        <Link
                            href="/map"
                            className="flex items-center gap-1.5 px-1.5 py-1 sm:px-3.5 sm:py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm transition-all active:scale-95">
                            <div>
                                <span className="hidden sm:inline-block">🗺️</span> 지도 <span className="hidden sm:inline-block">탐색</span>
                            </div>
                        </Link>
                    </div>
                    <div className="lg:hidden inline-flex">
                        {/* 1. 햄버거 ↔ X 변형 애니메이션 버튼 */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="모바일 메뉴 토글"
                            className="relative z-50 p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors cursor-pointer">
                            <div className="w-5 h-4 relative flex flex-col justify-between items-center">
                                {/* 상단 선 */}
                                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center ${mobileMenuOpen ? "rotate-45 translate-y-1.75" : ""}`} />
                                {/* 중단 선 */}
                                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-200 ease-in-out ${mobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100"}`} />
                                {/* 하단 선 */}
                                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center ${mobileMenuOpen ? "-rotate-45 -translate-y-1.75" : ""}`} />
                            </div>
                        </button>

                        {/* 2. 어두운 백드롭 오버레이 (Fade In/Out) */}
                        <div
                            onClick={() => setMobileMenuOpen(false)}
                            className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
                                mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                            }`}
                        />

                        {/* 3. 우측 슬라이드 오버 메뉴 드로어 (Slide Right to Left) */}
                        <aside
                            className={`fixed top-0 right-0 z-40 w-72 bg-white dark:bg-slate-900 border-l border-b border-slate-100 dark:border-slate-800 shadow-2xl p-6 pt-15 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
                                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
                            }`}>
                            {/* 메뉴 목록 */}
                            <nav className="space-y-1">
                                <p className="px-0 pb-2 text-s font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">카테고리 메뉴</p>
                                {NAV_ITEMS.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                                isActive
                                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                                                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* 하단 서브 컨트롤 (모바일 날짜 선택 및 지도 바로가기) */}
                            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="mobile-start-date" className="text-xs font-medium text-slate-500 dark:text-slate-400">시작일</label>
                                    <input
                                        id="mobile-start-date"
                                        type="date"
                                        value={startDate}
                                        max={endDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <label htmlFor="mobile-end-date" className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">종료일</label>
                                    <input
                                        id="mobile-end-date"
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>

                                <Link
                                    href="/map"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-98">
                                    <span>🗺️</span>
                                    <span>지도 탐색 서비스 열기</span>
                                </Link>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </header>
    );
}
