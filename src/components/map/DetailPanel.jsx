"use client";

import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import { formatDateRange, formatPrice, hasPriceInfo } from "@/utils/formatters";

const DESCRIPTION_LIMIT = 220;
const HTML_ENTITIES = {
  amp: "&",
  apos: "'",
  bull: "•",
  gt: ">",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  middot: "·",
  nbsp: " ",
  quot: '"',
  rdquo: "”",
  rsquo: "’",
};

function cleanDescription(value) {
  return String(value ?? "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z][a-z\d]+);/gi, (entity, code) => {
      if (code[0] !== "#") return HTML_ENTITIES[code.toLowerCase()] ?? entity;
      const numericCode = code[1].toLowerCase() === "x"
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
      return Number.isInteger(numericCode) && numericCode <= 0x10ffff
        ? String.fromCodePoint(numericCode)
        : entity;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function DetailPanel({ item, onClose }) {
  const [expandedDescriptionId, setExpandedDescriptionId] = useState(null);

  useEffect(() => {
    if (!item) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [item, onClose]);

  if (!item) return null;
  const isDescriptionExpanded = expandedDescriptionId === item.id;
  const hasPrice = hasPriceInfo(item.price);
  const description = cleanDescription(item.description);
  const hasLongDescription = description.length > DESCRIPTION_LIMIT;
  const normalizedLocation = item.locationName?.replace(/[\s,]/g, "").toLowerCase();
  const normalizedAddress = item.address?.replace(/[\s,]/g, "").toLowerCase();
  const hasDistinctAddress = item.address && normalizedAddress !== normalizedLocation;

  return (
    <aside
      key={item.id}
      aria-label={`${item.title} 상세 정보`}
      className="absolute bottom-4 left-4 right-4 z-10 flex max-h-[65vh] max-w-sm animate-rise-in flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-md"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="wrap-break-word text-xs font-semibold text-accent">{item.locationName}</p>
          <h2 className="mt-1 wrap-break-word text-lg font-bold leading-snug text-ink">{item.title}</h2>
        </div>
        <Button type="button" variant="ghost" className="min-h-9 shrink-0 whitespace-nowrap px-2.5" onClick={onClose}>닫기</Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {description && (
          <p className="whitespace-pre-line wrap-break-word text-sm leading-6 text-ink-soft">
            {hasLongDescription && !isDescriptionExpanded
              ? `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
              : description}
          </p>
        )}
        {hasDistinctAddress && <p className="mt-2 wrap-break-word text-xs text-ink-faint">{item.address}</p>}
        <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-xs text-ink-soft tabular-nums">
          <span>{formatDateRange(item.startDate, item.endDate)}</span>
          {hasPrice && <span className="font-semibold text-ink">{formatPrice(item.price)}</span>}
        </div>
        {item.contactPoint && <p className="mt-2 wrap-break-word text-xs text-ink-faint">문의: {item.contactPoint}</p>}
        {(item.reservationUrl || item.detailUrl) && (
          <div className="mt-3 flex flex-wrap gap-3 border-t border-line pt-3 text-sm">
            {item.reservationUrl && (
              <a href={item.reservationUrl} target="_blank" rel="noreferrer" className="font-semibold text-accent underline-offset-2 hover:underline">
                {item.reservationSite ? `${item.reservationSite} 예매` : "예매하기"}
                <span aria-hidden="true"> ↗</span><span className="sr-only"> (새 창)</span>
              </a>
            )}
            {item.detailUrl && item.detailUrl !== item.reservationUrl && (
              <a href={item.detailUrl} target="_blank" rel="noreferrer" className="font-semibold text-ink-soft underline-offset-2 hover:underline">
                {item.detailLinkLabel || "상세정보"}
                <span aria-hidden="true"> ↗</span><span className="sr-only"> (새 창)</span>
              </a>
            )}
          </div>
        )}
      </div>
      {hasLongDescription && (
        <div className="shrink-0 border-t border-line bg-surface px-4 py-2">
          <button
            type="button"
            aria-expanded={isDescriptionExpanded}
            onClick={() => setExpandedDescriptionId(isDescriptionExpanded ? null : item.id)}
            className="w-full cursor-pointer rounded-md py-2 text-sm font-semibold text-accent transition-colors duration-150 hover:bg-accent-soft"
          >
            {isDescriptionExpanded ? "내용 접기" : "전체 내용 보기"}
          </button>
        </div>
      )}
    </aside>
  );
}