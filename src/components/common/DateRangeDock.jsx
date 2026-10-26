"use client";

import { useEffect, useRef, useState } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { getTodayDate } from "@/utils/date";
import { REGIONS } from "@/utils/regions";

const fieldClassName = "mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-line bg-sunken px-2.5 text-sm font-medium text-ink tabular-nums";

export default function DateRangeDock() {
  const { startDate, endDate, setStartDate, setEndDate, selectedRegion, setSelectedRegion } = useFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);
  const regionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    // 패널이 열리면 첫 입력으로 포커스를 옮겨 키보드 사용자가 바로 조작할 수 있게 함
    regionRef.current?.focus();
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

  const closePanel = () => {
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  return (
    // 모바일에서는 본문 링크를 가리지 않도록 화면 아래쪽에 둠
    <div className="fixed bottom-6 right-0 z-[60] flex items-end gap-2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:items-center">
      {isOpen && (
        <aside
          id="date-range-dock-panel"
          aria-label="일정 및 지역 검색 필터"
          className="w-[min(17rem,calc(100vw-4rem))] origin-right animate-slide-in-right rounded-l-xl border border-r-0 border-line-strong bg-surface p-4 shadow-md"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">검색 필터</h2>
            <button
              type="button"
              onClick={closePanel}
              className="h-8 cursor-pointer rounded-md px-2.5 text-xs font-semibold text-ink-soft transition-colors duration-150 hover:bg-sunken hover:text-ink"
            >
              닫기
            </button>
          </div>
          <div className="space-y-4">
            {/* 지역 선택 */}
            <label className="block text-xs font-medium text-ink-soft" htmlFor="dock-region">
              지역
              <select
                ref={regionRef}
                id="dock-region"
                name="region"
                autoComplete="off"
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className={fieldClassName}
              >
                {REGIONS.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </label>

            {/* 날짜 선택 */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-ink-soft" htmlFor="dock-start-date">
                시작일
                <input
                  id="dock-start-date"
                  name="startDate"
                  type="date"
                  autoComplete="off"
                  suppressHydrationWarning
                  value={startDate}
                  max={endDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={fieldClassName}
                />
              </label>
              <label className="block text-xs font-medium text-ink-soft" htmlFor="dock-end-date">
                종료일
                <input
                  id="dock-end-date"
                  name="endDate"
                  type="date"
                  autoComplete="off"
                  suppressHydrationWarning
                  value={endDate}
                  min={startDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={fieldClassName}
                />
              </label>
              <button
                type="button"
                onClick={selectToday}
                className="h-10 w-full cursor-pointer rounded-lg bg-accent px-3 text-sm font-semibold text-on-accent transition-[background-color,scale] duration-150 ease-out hover:bg-accent-strong active:scale-[0.98]"
              >
                오늘로 돌아가기
              </button>
            </div>
          </div>
        </aside>
      )}
      <button
        ref={toggleRef}
        type="button"
        aria-label={isOpen ? "검색 필터 닫기" : "검색 필터 열기"}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "date-range-dock-panel" : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-14 w-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-l-lg border border-r-0 border-line-strong bg-surface text-accent shadow-md transition-colors duration-150 hover:bg-accent-soft"
      >
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        <span className="text-[11px] font-semibold">필터</span>
      </button>
    </div>
  );
}
