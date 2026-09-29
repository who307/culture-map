"use client";

import Button from "@/components/common/Button";
import { formatDateRange, formatPrice } from "@/utils/formatters";

export default function DetailPanel({ item, onClose }) {
  if (!item) return null;

  return (
    <aside className="absolute bottom-4 left-4 right-4 z-10 max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{item.locationName}</p>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{item.title}</h2>
        </div>
        <Button type="button" variant="ghost" className="min-h-8 px-2" onClick={onClose} aria-label="상세 정보 닫기">닫기</Button>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.address}</p>
      <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>{formatDateRange(item.startDate, item.endDate)}</span>
        <span className="font-semibold">{formatPrice(item.price)}</span>
      </div>
    </aside>
  );
}