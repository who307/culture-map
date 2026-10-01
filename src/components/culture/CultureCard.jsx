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

const MOVIE_COVER_ACCENTS = ['#e76f51', '#2a9d8f', '#e9c46a', '#6d9dc5', '#b57ab8'];

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
  const movieAccent = MOVIE_COVER_ACCENTS[(Math.max(1, Number(item.rank) || 1) - 1) % MOVIE_COVER_ACCENTS.length];
  const salesShare = Math.min(100, Math.max(0, Number(item.salesShare) || 0));

  const handleBookmarkClick = (e) => {
    e.stopPropagation(); // 카드 상세 클릭 이벤트 전파 방지
    toggleBookmark(item);
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
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
        ) : !posterUrl && item.movieCd ? (
          <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[#142126] p-5 pt-14 text-white">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-1.5"
              style={{ backgroundColor: movieAccent }}
            />
            <span aria-hidden="true" className="absolute -bottom-8 -right-2 text-[10rem] font-black leading-none text-white/[0.035]">
              {String(item.rank).padStart(2, '0')}
            </span>
            <div className="relative flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-white/65">KOBIS · BOX OFFICE</span>
              <span
                className="rounded-sm border px-2 py-1 text-[10px] font-bold"
                style={{ borderColor: movieAccent, color: movieAccent }}
              >
                {item.boxOfficeType === 'weekend' ? '주말' : '일일'} {String(item.rank).padStart(2, '0')}위
              </span>
            </div>
            <div className="relative my-5">
              <span className="mb-3 block h-1 w-8" style={{ backgroundColor: movieAccent }} />
              <h2 className="line-clamp-4 break-keep text-3xl font-black leading-tight">
                {item.title}
              </h2>
            </div>
            <div className="relative space-y-2">
              <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
                <span className="text-white/65">매출 점유율</span>
                <span>{salesShare}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/15">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${salesShare}%`, backgroundColor: movieAccent }}
                />
              </div>
              <p className="pt-1 text-[10px] font-medium text-white/55">
                {boxOfficeRange} · 전국 박스오피스
              </p>
            </div>
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
          className={`absolute top-2.5 left-2.5 px-2.5 py-1 text-[11px] font-bold rounded-md shadow-sm backdrop-blur-md ${category.color}`}
        >
          {category.label}
        </span>

        {/* 하트 찜하기 버튼 */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
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
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                관객 {item.audienceCount.toLocaleString()}명 · 누적 {item.cumulativeAudience.toLocaleString()}명
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {item.screenCount.toLocaleString()}개 스크린 · {item.screeningCount.toLocaleString()}회 상영
              </p>
              <a
                href={`https://search.naver.com/search.naver?query=${encodeURIComponent(`${item.title} 상영시간표`)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="mt-2 inline-flex text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                네이버에서 상영시간표 검색 ↗
              </a>
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

        <div className={`mt-3 pt-2.5 border-t border-slate-50 flex items-center ${hasPrice ? 'justify-between' : 'justify-start'} text-[11px]`}>
          {item.movieCd ? (
            <div className="grid w-full gap-1 text-[11px]">
              <span className="text-slate-400 font-medium">개봉 {item.openDate || '정보 없음'}</span>
              <span className="font-bold text-indigo-600">
                {item.boxOfficeType === 'weekend' ? '주말' : '일일'} 매출 {item.salesAmount.toLocaleString()}원
              </span>
              <span className="font-bold text-indigo-600">
                누적 매출 {item.cumulativeSales.toLocaleString()}원
              </span>
            </div>
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