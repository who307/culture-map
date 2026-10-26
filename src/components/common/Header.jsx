"use client";

import { useState, useEffect } from "react";
import Navbar, { NAV_ITEMS } from "@/components/common/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

function trapDialogFocus(event) {
    if (event.key !== "Tab") return;

    const focusableElements = [...event.currentTarget.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.getAttribute("aria-hidden") !== "true");
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

export default function Header() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        window.requestAnimationFrame(() => document.getElementById("mobile-menu-toggle")?.focus());
    };

    useEffect(() => {
        if (!mobileMenuOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key !== "Escape") return;
            closeMobileMenu();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        window.requestAnimationFrame(() => document.querySelector("#mobile-navigation a")?.focus());
    }, [mobileMenuOpen]);

    // 다크모드 토글 함수
    const toggleDarkMode = () => {
        const nextState = document.documentElement.dataset.theme !== "dark";
        document.documentElement.dataset.theme = nextState ? "dark" : "light";
        try {
            localStorage.setItem("theme", nextState ? "dark" : "light");
        } catch {
            // 저장소를 쓸 수 없는 환경에서도 현재 화면 테마는 바뀌도록 무시
        }
    };

    return (
        <>
        <header className="sticky top-0 z-50 border-b border-line bg-paper">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* 로고 영역 */}
                <Link href="/" aria-label="컬쳐맵 홈" className="inline-flex items-center rounded focus-visible:outline-offset-4">
                    <svg width="170" height="38" viewBox="0 0 220 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <g transform="translate(2, 3)">
                            <path
                                d="M22 2C12.059 2 4 10.059 4 20C4 32.5 20.2 43.1 20.9 43.6C21.2 43.8 21.6 44 22 44C22.4 44 22.8 43.8 23.1 43.6C23.8 43.1 40 32.5 40 20C40 10.059 31.941 2 22 2Z"
                                className="fill-accent"
                            />
                            <rect x="13" y="13" width="18" height="13" rx="2.5" className="fill-paper" />
                            <circle cx="13" cy="19.5" r="2" className="fill-accent" />
                            <circle cx="31" cy="19.5" r="2" className="fill-accent" />
                            <path d="M22 15.2L22.9 17.2L25.1 17.4L23.5 18.9L23.9 21.1L22 20L20.1 21.1L20.5 18.9L18.9 17.4L21.1 17.2L22 15.2Z" className="fill-accent" />
                        </g>

                        <text
                            x="54"
                            y="27"
                            fontSize="22"
                            fontWeight="800"
                            className="fill-ink font-display"
                            letterSpacing="-0.5px">
                            컬쳐맵
                        </text>
                        <text
                            x="54.5"
                            y="39"
                            fontWeight="600"
                            fontSize="8.5"
                            className="fill-ink-faint"
                            letterSpacing="2.2px">
                            CULTURE MAP
                        </text>
                    </svg>
                </Link>

                {/* GNV 영역 */}
                <Navbar />

                <div className="flex items-center gap-1">
                {/* 우측 유틸리티 영역 (다크모드 버튼, 지도 탐색) */}
                    <div className="flex items-center gap-2">
                        {/* 다크모드 토글 버튼 */}
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            aria-label="다크모드 전환"
                            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-ink-soft transition-[color,background-color,scale] duration-150 ease-out hover:bg-sunken hover:text-ink active:scale-[0.96]">
                            <svg aria-hidden="true" className="h-[18px] w-[18px] dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            <svg aria-hidden="true" className="hidden h-[18px] w-[18px] dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>

                        {/* 지도 탐색 링크 */}
                        <Link
                            href="/map"
                            aria-current={pathname === "/map" ? "page" : undefined}
                            className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition-[background-color,scale] duration-150 ease-out hover:bg-accent-strong active:scale-[0.97]">
                            지도<span className="hidden sm:inline">&nbsp;탐색</span>
                        </Link>
                    </div>
                    <div className="lg:hidden inline-flex">
                        {/* 1. 햄버거 ↔ X 변형 애니메이션 버튼 */}
                        <button
                            id="mobile-menu-toggle"
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen((open) => !open);
                            }}
                            aria-label={mobileMenuOpen ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-navigation"
                            aria-haspopup="dialog"
                            className="relative z-50 grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-ink transition-colors duration-150 hover:bg-sunken">
                            <div className="w-5 h-4 relative flex flex-col justify-between items-center">
                                {/* 상단 선 */}
                                <span className={`w-full h-0.5 bg-current rounded-full transition-[rotate,translate] duration-200 ease-out origin-center ${mobileMenuOpen ? "rotate-45 translate-y-1.75" : ""}`} />
                                {/* 중단 선 */}
                                <span className={`w-full h-0.5 bg-current rounded-full transition-[opacity,scale] duration-150 ease-out ${mobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100"}`} />
                                {/* 하단 선 */}
                                <span className={`w-full h-0.5 bg-current rounded-full transition-[rotate,translate] duration-200 ease-out origin-center ${mobileMenuOpen ? "-rotate-45 -translate-y-1.75" : ""}`} />
                            </div>
                        </button>

                        {/* 2. 어두운 백드롭 오버레이 (Fade In/Out) */}
                        <button
                            type="button"
                            aria-label="모바일 메뉴 닫기"
                            tabIndex={mobileMenuOpen ? 0 : -1}
                            onClick={closeMobileMenu}
                            className={`fixed inset-0 z-40 bg-black/40 transition-opacity ease-out ${
                                mobileMenuOpen ? "opacity-100 pointer-events-auto duration-300" : "opacity-0 pointer-events-none duration-200"
                            }`}
                        />

                        {/* 3. 우측 슬라이드 오버 메뉴 드로어 (Slide Right to Left) */}
                        <aside
                            id="mobile-navigation"
                            role="dialog"
                            aria-label="모바일 메뉴"
                            aria-modal={mobileMenuOpen ? "true" : undefined}
                            aria-hidden={!mobileMenuOpen}
                            inert={!mobileMenuOpen}
                            onKeyDown={trapDialogFocus}
                            className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col justify-between border-l border-line-strong bg-surface p-6 pt-20 shadow-md overscroll-contain transition-transform ${
                                // 열 때는 시트 곡선으로 400ms, 닫을 때는 빠르게 200ms (닫기가 열기보다 빨라야 반응이 즉각적으로 느껴짐)
                                mobileMenuOpen ? "translate-x-0 duration-[400ms] ease-drawer" : "translate-x-full duration-200 ease-out"
                            }`}>
                            {/* 메뉴 목록 */}
                            <nav className="space-y-1">
                                <p className="px-3 pb-2 text-xs font-semibold text-ink-faint">카테고리</p>
                                {NAV_ITEMS.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            onClick={closeMobileMenu}
                                            href={item.href}
                                            aria-current={isActive ? "page" : undefined}
                                            className={`block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-colors duration-150 ${
                                                isActive
                                                    ? "bg-accent-soft text-accent"
                                                    : "text-ink hover:bg-sunken"
                                            }`}>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* 모바일 지도 바로가기 */}
                            <div className="border-t border-line pt-6">
                                <Link
                                    href="/map"
                                    onClick={closeMobileMenu}
                                    className="flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-on-accent transition-[background-color,scale] duration-150 ease-out hover:bg-accent-strong active:scale-[0.98]">
                                    지도에서 찾아보기
                                </Link>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </header>
        </>
    );
}
