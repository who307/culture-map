'use client';

import { useRef, useState, useEffect } from 'react';
import DetailPanel from '@/components/map/DetailPanel';
import MapMarker, { MARKER_STYLES } from '@/components/map/MapMarker';
import { useNaverMap } from '@/hooks/useNaverMap';
import { useFilterStore } from '@/store/useFilterStore';

export default function NaverMapContainer({ items = [] }) {
  const containerRef = useRef(null);
  const { map, status } = useNaverMap(containerRef);
  const { selectedMapItem, setSelectedMapItem } = useFilterStore();

  // 💡 1. 복수 선택을 위해 배열([])로 상태 변경
  const [activeCategories, setActiveCategories] = useState([]);

  // 지도가 로드되었을 때 확대/축소 바(zoomControl) 없애기
  useEffect(() => {
    if (status === 'ready' && map) {
      map.setOptions({
        zoomControl: false,
      });
    }
  }, [status, map]);

  // 💡 2. 중복 선택을 처리하는 토글 핸들러
  const handleCategoryClick = (category) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category) // 이미 있으면 제거
        : [...prev, category]                // 없으면 추가
    );
  };

  // 💡 3. 선택된 카테고리 중 하나라도 일치하면 필터링 (배열이 비어있으면 전체 노출)
  const filteredItems = activeCategories.length > 0
    ? items.filter((item) => activeCategories.includes(item.type))
    : items;

  return (
    <div className="relative h-[calc(100vh-190px)] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
      <div ref={containerRef} className="h-250 w-full" />
      <ul
        aria-label="지도 마커 카테고리"
        className="absolute left-3 right-16 top-3 z-10 w-fit flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        {Object.entries(MARKER_STYLES).map(([category, style]) => {
          // 💡 4. 현재 카테고리가 선택 배열에 포함되어 있는지 확인
          const isSelected = activeCategories.includes(category);
          const isAnySelected = activeCategories.length > 0;

          return (
            <li
              key={category}
              // 💡 5. 선택된 카테고리들은 선명하게, 나머지는 흐리게 처리 (아무것도 선택 안 했을 땐 모두 선명하게)
              className={`inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700 dark:text-slate-200 cursor-pointer transition-opacity duration-200 ${
                isAnySelected && !isSelected ? 'opacity-40' : 'opacity-100'
              }`}
              onClick={() => handleCategoryClick(category)}
            >
              <span
                aria-hidden="true"
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm transition-transform ${
                  isSelected ? 'scale-110 ring-2 ring-slate-400 dark:ring-slate-500' : ''
                }`}
                style={{ backgroundColor: style.color }}
              >
                {style.icon}
              </span>
              <span className={isSelected ? 'font-bold' : ''}>{style.label}</span>
            </li>
          );
        })}
        {/* 💡 6. 활성화된 필터가 있을 때만 전체 리셋 버튼 노출 */}
        {activeCategories.length > 0 && (
          <li
            className="text-[10px] text-slate-400 dark:text-slate-500 cursor-pointer hover:underline pl-1 border-l border-slate-200 dark:border-slate-700"
            onClick={() => setActiveCategories([])}
          >
            초기화
          </li>
        )}
      </ul>
      {status !== 'ready' && (
        <p className="absolute inset-x-4 bottom-4 z-1 rounded-lg bg-white/95 px-4 py-3 text-sm text-slate-600 shadow dark:bg-slate-900/95 dark:text-slate-300">
          {status === 'error'
            ? 'Naver 지도를 불러오지 못했습니다. 키와 허용 도메인 설정을 확인해주세요.'
            : 'Naver 지도를 불러오는 중입니다.'}
        </p>
      )}
      {filteredItems.map((item) => <MapMarker key={item.id} map={map} item={item} />)}
      <DetailPanel item={selectedMapItem} onClose={() => setSelectedMapItem(null)} />
    </div>
  );
}
