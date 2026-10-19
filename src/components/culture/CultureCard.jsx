'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { formatDateRange, formatPrice } from '@/utils/formatters';

// 카테고리별 라벨 및 색상
const CATEGORY_MAP = {
  movie: { label: '영화', color: 'bg-blue-100 text-blue-700' },
  concert: { label: '콘서트', color: 'bg-purple-100 text-purple-700' },
  musical: { label: '뮤지컬', color: 'bg-rose-100 text-rose-700' },
  festival: { label: '행사', color: 'bg-emerald-100 text-emerald-700' },
  event: { label: '행사', color: 'bg-emerald-100 text-emerald-700' },
  exhibition: { label: '전시', color: 'bg-amber-100 text-amber-700' },
};

// 146250 → 14.6만, 18876613480 → 188.8억
function formatKoreanUnit(value) {
  const number = Number(value) || 0;
  if (number >= 100_000_000) return `${(number / 100_000_000).toFixed(1).replace(/\.0$/, '')}억`;
  if (number >= 10_000) return `${(number / 10_000).toFixed(1).replace(/\.0$/, '')}만`;
  return number.toLocaleString();
}

export default function CultureCard({ item, onClick }) {
  const { bookmarks, toggleBookmark } = useBookmarkStore();
  const isBookmarked = bookmarks.includes(item.id);
  const category = CATEGORY_MAP[item.type]
  const posterUrl = item.posterUrl || item.imageUrl;
  const [failedPosterUrl, setFailedPosterUrl] = useState(null);
  const showPoster = Boolean(posterUrl) && failedPosterUrl !== posterUrl;
  const hasPrice = Boolean(item.price) && !['정보 없음', '가격 정보 없음'].includes(item.price);
  const boxOfficeRange = item.showRange
    ?.split('~')
    .map((date) => date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'))
    .join(' ~ ');
  const hasMovieCover = !posterUrl && Boolean(item.movieCd);
  const salesShare = Math.min(100, Math.max(0, Number(item.salesShare) || 0));

  const handleBookmarkClick = (e) => {
    e.stopPropagation(); // 카드 상세 클릭 이벤트 전파 방지
    toggleBookmark(item);
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className={`group relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* 썸네일 이미지 영역 */}
      <div className="relative aspect-3/4 w-full bg-slate-100 overflow-hidden">
        {showPoster ? (
          <Image
            src={posterUrl}
            alt={`${item.title} 포스터`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized={Boolean(item.movieCd)}
            onError={() => setFailedPosterUrl(posterUrl)}
          />
        ) : hasMovieCover ? (
          <div className="flex h-full flex-col bg-slate-900 p-4 pt-14 text-white">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold leading-none tabular-nums">{item.rank}</span>
              <span className="text-xs font-medium text-white/60">
                {item.boxOfficeType === 'weekend' ? '주말' : '일일'} 박스오피스
              </span>
            </div>
            <h2 className="mt-auto line-clamp-3 break-keep text-lg font-semibold leading-snug">
              {item.title}
            </h2>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/60">
                  {item.boxOfficeType === 'weekend' ? '주말' : '일일'} 매출 {formatKoreanUnit(item.salesAmount)}원
                </span>
                <span className="font-semibold tabular-nums">점유율 {salesShare}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/15">
                <span className="block h-full rounded-full bg-white/80" style={{ width: `${salesShare}%` }} />
              </div>
            </div>
            <p className="mt-3 text-[10px] text-white/40">
              {boxOfficeRange} · KOBIS 전국 박스오피스
            </p>
          </div>
        ) : (
            <Image
              src="/images/placeholders/no-image.svg"
            alt={item.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        )}

        {/* 카테고리 뱃지 */}
        <span
          className={`absolute top-2.5 left-2.5 px-2.5 py-1 text-[11px] font-bold rounded-md shadow-sm backdrop-blur-md ${hasMovieCover ? 'bg-white/15 text-white' : category.color}`}
        >
          {category.label}
        </span>

        {/* 하트 찜하기 버튼 */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors cursor-pointer"
          aria-label="찜하기"
        >
          <svg
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isBookmarked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-white'
            }`}
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* 예매율/순위 오버레이 (영화/공연 전용) */}
        {!item.movieCd && item.reservationRate ? (
          <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/80 to-transparent p-2.5 pt-6 text-white text-xs font-semibold">
            예매율 {item.reservationRate}%
          </div>
        ) : null}
      </div>

      {/* 정보 텍스트 영역 */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {item.title}
          </h3>
          {item.movieCd ? (
            <>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                👥 {formatKoreanUnit(item.audienceCount)}명 · 누적 {formatKoreanUnit(item.cumulativeAudience)}명
              </p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                🎞️ {item.screenCount.toLocaleString()}개관 · {item.screeningCount.toLocaleString()}회 상영
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="truncate text-slate-500">KOBIS</span>
                <a
                  href={`https://search.naver.com/search.naver?query=${encodeURIComponent(`${item.title} 상영시간표`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  상영시간표 ↗
                </a>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              📍 {item.locationName}
            </p>
          )}
          {(item.reservationUrl || item.detailUrl) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {item.reservationSite && <span className="truncate text-slate-500">{item.reservationSite}</span>}
              {item.reservationUrl && (
                <a
                  href={item.reservationUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  예매하기 ↗
                </a>
              )}
              {item.detailUrl && item.detailUrl !== item.reservationUrl && (
                <a
                  href={item.detailUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold text-slate-600 hover:underline"
                >
                  {item.detailLinkLabel || '상세정보'} ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className={`mt-3 pt-2.5 border-t border-slate-50 flex items-center ${hasPrice || item.movieCd ? 'justify-between' : 'justify-start'} text-[11px]`}>
          {item.movieCd ? (
            <>
              <span className="text-slate-400 font-medium">개봉 {item.openDate || '정보 없음'}</span>
              <span className="font-bold text-indigo-600">누적 {formatKoreanUnit(item.cumulativeSales)}원</span>
            </>
          ) : (
            <>
              <span className="text-slate-400 font-medium">
                {formatDateRange(item.startDate, item.endDate)}
              </span>
              {hasPrice && <span className="font-bold text-indigo-600">{formatPrice(item.price)}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
