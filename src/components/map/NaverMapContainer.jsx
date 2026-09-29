'use client';

import { useRef } from 'react';
import DetailPanel from '@/components/map/DetailPanel';
import MapMarker from '@/components/map/MapMarker';
import { useNaverMap } from '@/hooks/useNaverMap';
import { useFilterStore } from '@/store/useFilterStore';

export default function NaverMapContainer({ items = [] }) {
  const containerRef = useRef(null);
  const map = useNaverMap(containerRef);
  const { selectedMapItem, setSelectedMapItem } = useFilterStore();

  return (
    <div className="relative min-h-125 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
      <div ref={containerRef} className="absolute inset-0" />
      {!map && (
        <p className="absolute inset-x-4 top-4 z-1 rounded-lg bg-white/95 px-4 py-3 text-sm text-slate-600 shadow dark:bg-slate-900/95 dark:text-slate-300">
          Naver Map을 표시하려면 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 설정이 필요합니다.
        </p>
      )}
      {items.map((item) => <MapMarker key={item.id} map={map} item={item} />)}
      <DetailPanel item={selectedMapItem} onClose={() => setSelectedMapItem(null)} />
    </div>
  );
}