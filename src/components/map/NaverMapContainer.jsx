'use client';

import { useRef } from 'react';
import DetailPanel from '@/components/map/DetailPanel';
import MapMarker, { MARKER_STYLES } from '@/components/map/MapMarker';
import { useNaverMap } from '@/hooks/useNaverMap';
import { useFilterStore } from '@/store/useFilterStore';

export default function NaverMapContainer({ items = [] }) {
  const containerRef = useRef(null);
  const { map, status } = useNaverMap(containerRef);
  const { selectedMapItem, setSelectedMapItem } = useFilterStore();

  return (
    <div className="relative min-h-125 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
      <div ref={containerRef} className="h-250 w-full" />
      <ul
        aria-label="지도 마커 카테고리"
        className="absolute left-3 right-16 top-3 z-10 w-fit flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        {Object.entries(MARKER_STYLES).map(([category, style]) => (
          <li key={category} className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700 dark:text-slate-200">
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: style.color }}
            >
              {style.icon}
            </span>
            <span>{style.label}</span>
          </li>
        ))}
      </ul>
      {status !== 'ready' && (
        <p className="absolute inset-x-4 bottom-4 z-1 rounded-lg bg-white/95 px-4 py-3 text-sm text-slate-600 shadow dark:bg-slate-900/95 dark:text-slate-300">
          {status === 'error'
            ? 'Naver 지도를 불러오지 못했습니다. 키와 허용 도메인 설정을 확인해주세요.'
            : 'Naver 지도를 불러오는 중입니다.'}
        </p>
      )}
      {items.map((item) => <MapMarker key={item.id} map={map} item={item} />)}
      <DetailPanel item={selectedMapItem} onClose={() => setSelectedMapItem(null)} />
    </div>
  );
}