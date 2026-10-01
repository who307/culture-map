"use client";

import { useEffect, useRef, useState } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { getTodayDate } from "@/utils/date";

export default function DateRangeDock() {
  const { startDate, endDate, setStartDate, setEndDate } = useFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const selectToday = () => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
  };

  return (
    <div className="fixed right-0 top-1/2 z-[60] flex -translate-y-1/2 items-center gap-2">
      {isOpen && (
        <aside
          id="date-range-dock-panel"
          aria-label="일정 날짜 범위"
          className="w-[min(17rem,calc(100vw-4rem))] rounded-l-xl border border-r-0 border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">날짜 범위</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              닫기
            </button>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor="dock-start-date">
              시작일
              <input
                id="dock-start-date"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor="dock-end-date">
              종료일
              <input
                id="dock-end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={selectToday}
              className="h-9 w-full rounded-md bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
            >
              오늘
            </button>
          </div>
        </aside>
      )}
      <button
        ref={toggleRef}
        type="button"
        aria-label={isOpen ? "날짜 메뉴 닫기" : "날짜 메뉴 열기"}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "date-range-dock-panel" : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-12 w-10 flex-col items-center justify-center gap-1 rounded-l-lg border border-r-0 border-slate-200 bg-white/95 text-indigo-600 shadow-lg backdrop-blur transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900/95 dark:text-indigo-400 dark:hover:bg-slate-800 cursor-pointer"
      >
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
        </svg>
        <span className="text-[10px] font-bold">기간</span>
      </button>
    </div>
  );
}