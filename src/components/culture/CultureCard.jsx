'use client';

import Image from 'next/image';
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

export default function CultureCard({ item, onClick }) {
  const { bookmarks, toggleBookmark } = useBookmarkStore();
  const isBookmarked = bookmarks.includes(item.id);
  const category = CATEGORY_MAP[item.type] || CATEGORY_MAP.movie;

  const handleBookmarkClick = (e) => {
    e.stopPropagation(); // 카드 상세 클릭 이벤트 전파 방지
    toggleBookmark(item.id);
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* 썸네일 이미지 영역 */}
      <div className="relative aspect-3/4 w-full bg-slate-100 overflow-hidden">
        <Image
          src={item.imageUrl || '/images/placeholders/no-poster.png'}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/images/placeholders/no-poster.png';
          }}
        />

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
        {item.reservationRate && (
          <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/80 to-transparent p-2.5 pt-6 text-white text-xs font-semibold">
            예매율 {item.reservationRate}%
          </div>
        )}
      </div>

      {/* 정보 텍스트 영역 */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            📍 {item.locationName}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">
            {formatDateRange(item.startDate, item.endDate)}
          </span>
          <span className="font-bold text-indigo-600">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
    </div>
  );
}