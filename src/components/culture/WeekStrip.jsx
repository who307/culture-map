"use client";

import { useState, useSyncExternalStore } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { addDays, getTodayDate, getWeekday, startOfWeek } from "@/utils/date";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabelFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" });

const subscribeNothing = () => () => {};

function formatDayLabel(value) {
  const [year, month, day] = value.split("-").map(Number);
  return dayLabelFormat.format(new Date(year, month - 1, day));
}

// 극장 편성표처럼 한 주를 가로 띠로 보여주고, 날짜를 누르면 그 날로 필터를 바꿈
export default function WeekStrip() {
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const setStartDate = useFilterStore((state) => state.setStartDate);
  const setEndDate = useFilterStore((state) => state.setEndDate);
  // 페이지가 빌드 때 미리 만들어지므로, 날짜에 따라 달라지는 띠는 브라우저에서만 그림
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [weekOffset, setWeekOffset] = useState({ anchor: null, weeks: 0 });

  const anchor = startOfWeek(startDate);
  const weeks = weekOffset.anchor === anchor ? weekOffset.weeks : 0;
  const weekStart = addDays(anchor, weeks * 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = isClient ? getTodayDate() : null;

  const selectRange = (start, end = start) => {
    setStartDate(start);
    setEndDate(end);
  };
  const moveWeek = (step) => setWeekOffset({ anchor, weeks: weeks + step });
  const saturday = addDays(startOfWeek(today ?? startDate), 5);

  if (!isClient) {
    return <div aria-hidden="true" className="h-[7.5rem] rounded-xl bg-sunken" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => moveWeek(-1)}
          aria-label="이전 주"
          className="grid w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-soft transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <ol className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const isSelected = day >= startDate && day <= endDate;
            const isToday = day === today;
            const weekday = getWeekday(day);
            return (
              <li key={day}>
                <button
                  type="button"
                  onClick={() => selectRange(day)}
                  aria-pressed={isSelected}
                  aria-label={`${formatDayLabel(day)}${isToday ? ", 오늘" : ""}`}
                  className={`flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border tabular-nums transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.97] ${
                    isSelected
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-surface text-ink hover:border-line-strong"
                  }`}
                >
                  <span className={`text-xs font-medium ${isSelected ? "text-paper/75" : weekday === 0 ? "text-danger" : weekday === 6 ? "text-accent" : "text-ink-faint"}`}>
                    {WEEKDAY_LABELS[weekday]}
                  </span>
                  <span className="text-lg font-bold leading-none">{Number(day.slice(8))}</span>
                  <span aria-hidden="true" className={`h-1 w-1 rounded-full ${isToday ? (isSelected ? "bg-paper" : "bg-accent") : "bg-transparent"}`} />
                </button>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          onClick={() => moveWeek(1)}
          aria-label="다음 주"
          className="grid w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-soft transition-colors duration-150 hover:bg-sunken hover:text-ink"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-2 pl-11" role="group" aria-label="빠른 기간 선택">
        {[
          { label: "오늘", start: today, end: today },
          { label: "이번 주말", start: saturday, end: addDays(saturday, 1) },
          { label: "이 주 전체", start: weekStart, end: addDays(weekStart, 6) },
        ].map((option) => {
          const isActive = startDate === option.start && endDate === option.end;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => selectRange(option.start, option.end)}
              className={`h-8 cursor-pointer rounded-full border px-3 text-[13px] font-semibold transition-colors duration-150 ${
                isActive ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
