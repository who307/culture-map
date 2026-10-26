'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { CATEGORY_BY_KEY } from '@/utils/categories';
import { formatDateRange, formatPrice, hasPriceInfo } from '@/utils/formatters';

const POSTER_SIZES = '(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw';

const koreanUnitFormat = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 });

// 146250 → 14.6만, 18876613480 → 188.8억
function formatKoreanUnit(value) {
  return koreanUnitFormat.format(Number(value) || 0);
}

function ExternalLink({ href, children, tone = 'accent' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`font-semibold underline-offset-2 hover:underline ${tone === 'accent' ? 'text-accent' : 'text-ink-soft'}`}
    >
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (새 창)</span>
    </a>
  );
}

export default function CultureCard({ item }) {
  const { bookmarks, toggleBookmark } = useBookmarkStore();
  const isBookmarked = bookmarks.includes(item.id);
  const [justBookmarked, setJustBookmarked] = useState(false);
  const category = CATEGORY_BY_KEY[item.type] ?? { shortLabel: '문화', dot: 'bg-ink-faint' };
  const posterUrl = item.posterUrl || item.imageUrl;
  const [failedPosterUrl, setFailedPosterUrl] = useState(null);
  const showPoster = Boolean(posterUrl) && failedPosterUrl !== posterUrl;
  const hasPrice = hasPriceInfo(item.price);
  const hasMovieCover = !posterUrl && Boolean(item.movieCd);
  const salesShare = Math.min(100, Math.max(0, Number(item.salesShare) || 0));
  const boxOfficeLabel = item.boxOfficeType === 'weekend' ? '주말' : '일일';

  const handleBookmarkClick = () => {
    setJustBookmarked(!isBookmarked);
    toggleBookmark(item);
  };

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      {/* 썸네일 이미지 영역 */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-sunken">
        {showPoster ? (
          <Image
            src={posterUrl}
            alt=""
            fill
            sizes={POSTER_SIZES}
            className="object-cover"
            unoptimized={Boolean(item.movieCd)}
            onError={() => setFailedPosterUrl(posterUrl)}
          />
        ) : hasMovieCover ? (
          // 포스터 비율 안에 순위·제목·점유율만 둠. 제목은 shrink-0이라 좁은 화면에서도 높이가 줄지 않음
          <div className="flex h-full flex-col bg-cover p-3.5 pt-11 text-white sm:p-4 sm:pt-12">
            <div className="flex shrink-0 items-baseline gap-2">
              <span className="font-display text-5xl leading-none tabular-nums">{item.rank}</span>
              <span className="text-xs font-medium text-white/70">{boxOfficeLabel} 박스오피스</span>
            </div>
            <p className="mt-auto line-clamp-3 shrink-0 break-keep pt-3 font-display text-lg leading-snug sm:text-xl">
              {item.title}
            </p>
            <div className="mt-3 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-white/70">매출 점유율</span>
                <span className="font-semibold tabular-nums">{salesShare}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                <span className="block h-full rounded-full bg-cover-accent" style={{ width: `${salesShare}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <Image
            src="/images/placeholders/no-image.svg"
            alt=""
            fill
            sizes={POSTER_SIZES}
            className="object-cover"
            unoptimized
          />
        )}

        {/* 카테고리 뱃지 */}
        {/* 카테고리 색 바탕에 흰 글자 (노선색은 흰 글자 대비 4.8:1 이상) */}
        <span
          className={`absolute left-2.5 top-2.5 rounded-md px-2 py-1 text-[11px] font-semibold leading-none text-white ${
            hasMovieCover ? 'bg-white/15' : category.dot
          }`}
        >
          {category.shortLabel}
        </span>

        {/* 하트 찜하기 버튼 */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          aria-pressed={isBookmarked}
          aria-label={`${item.title} 위시리스트에 담기`}
          className="absolute right-1.5 top-1.5 grid h-10 w-10 cursor-pointer place-items-center rounded-full text-white transition-[scale] duration-150 ease-out active:scale-[0.95]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black/55">
            <svg
              aria-hidden="true"
              className={`h-4 w-4 ${isBookmarked ? 'fill-heart stroke-heart' : 'fill-none stroke-white'} ${
                isBookmarked && justBookmarked ? 'animate-heart' : ''
              }`}
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
        </button>

        {/* 예매율 오버레이 (공연 전용) */}
        {!item.movieCd && item.reservationRate ? (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2.5 pt-6 text-xs font-semibold text-white">
            예매율 {item.reservationRate}%
          </div>
        ) : null}
      </div>

      {/* 정보 텍스트 영역 */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
            {item.title}
          </h3>
          {item.movieCd ? (
            <>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs tabular-nums">
                <dt className="text-ink-faint">관객</dt>
                <dd className="truncate text-ink-soft">{formatKoreanUnit(item.audienceCount)}명 (누적 {formatKoreanUnit(item.cumulativeAudience)}명)</dd>
                <dt className="text-ink-faint">상영</dt>
                <dd className="truncate text-ink-soft">{item.screenCount.toLocaleString()}개관, {item.screeningCount.toLocaleString()}회</dd>
                <dt className="text-ink-faint">매출</dt>
                <dd className="truncate text-ink-soft">{boxOfficeLabel} {formatKoreanUnit(item.salesAmount)}원</dd>
              </dl>
              <div className="mt-2 text-xs">
                <ExternalLink href={`https://search.naver.com/search.naver?query=${encodeURIComponent(`${item.title} 상영시간표`)}`}>
                  상영시간표
                </ExternalLink>
              </div>
            </>
          ) : (
            <p className="mt-1.5 line-clamp-1 text-xs text-ink-soft">
              <span className="sr-only">장소: </span>
              {item.locationName}
            </p>
          )}
          {(item.reservationUrl || item.detailUrl) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {item.reservationSite && <span className="truncate text-ink-faint">{item.reservationSite}</span>}
              {item.reservationUrl && <ExternalLink href={item.reservationUrl}>예매하기</ExternalLink>}
              {item.detailUrl && item.detailUrl !== item.reservationUrl && (
                <ExternalLink href={item.detailUrl} tone="muted">
                  {item.detailLinkLabel || '상세정보'}
                </ExternalLink>
              )}
            </div>
          )}
        </div>

        {/* 좁은 카드에서는 두 값이 각각 한 줄로 내려가도록 nowrap + wrap */}
        <div className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-line pt-2.5 text-xs tabular-nums ${hasPrice || item.movieCd ? 'justify-between' : 'justify-start'}`}>
          {item.movieCd ? (
            <>
              <span className="whitespace-nowrap text-ink-faint">개봉 {item.openDate || '정보 없음'}</span>
              <span className="whitespace-nowrap font-semibold text-ink">누적 {formatKoreanUnit(item.cumulativeSales)}원</span>
            </>
          ) : (
            <>
              <span className="text-ink-faint">
                {formatDateRange(item.startDate, item.endDate)}
              </span>
              {hasPrice && <span className="truncate font-semibold text-ink">{formatPrice(item.price)}</span>}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
