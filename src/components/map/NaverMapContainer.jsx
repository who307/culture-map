'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import DetailPanel from '@/components/map/DetailPanel';
import MapMarker, { MARKER_STYLES } from '@/components/map/MapMarker';
import { useNaverMap } from '@/hooks/useNaverMap';
import { useFilterStore } from '@/store/useFilterStore';
import { hasCoordinates } from '@/utils/location';

// 기본으로 꺼져 있는 영화관 필터는 맨 뒤에 둠
const FILTER_ENTRIES = Object.entries(MARKER_STYLES).sort(([left], [right]) => (left === 'movie') - (right === 'movie'));

function getGeocodeQueries(item) {
  const address = String(item.address ?? '').trim();
  const locationName = String(item.locationName ?? '').trim();
  const baseName = locationName.replace(/\s*\([^()]*\)\s*$/, '').trim();
  const aliases = [...locationName.matchAll(/\(([^()]+)\)/g)].map(([, alias]) => alias.trim());
  const candidates = [baseName, ...aliases, locationName].filter(Boolean);
  const queries = new Set();

  for (const candidate of candidates) {
    if (address && address !== candidate) queries.add(`${address} ${candidate}`);
    queries.add(candidate);
  }

  return [...queries].filter((query) => query.length >= 3);
}

export default function NaverMapContainer({ items = [], initialCategories = [] }) {
  const containerRef = useRef(null);
  const geocodeCacheRef = useRef(new Map());
  const { map, status } = useNaverMap(containerRef);
  const { selectedMapItem, setSelectedMapItem } = useFilterStore();

  // 💡 1. 복수 선택을 위해 배열([])로 상태 변경
  const [activeCategories, setActiveCategories] = useState(initialCategories);
  const [geocodedLocations, setGeocodedLocations] = useState({});

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

  // 💡 3. 선택된 카테고리 중 하나라도 일치하면 필터링 (배열이 비어있으면 행사 전체 노출)
  // 영화관은 날짜와 무관한 상시 시설이라 수가 많아 '영화관'을 직접 골랐을 때만 표시
  const filteredItems = useMemo(() => activeCategories.length > 0
    ? items.filter((item) => activeCategories.includes(item.type))
    : items.filter((item) => item.type !== 'movie'), [activeCategories, items]);

  useEffect(() => {
    if (status !== 'ready') return undefined;

    let cancelled = false;
    const groupedQueries = new Map();

    // 보이는 항목만 장소 검색 (꺼진 영화관 레이어까지 검색하지 않도록)
    for (const item of filteredItems) {
      if (hasCoordinates(item)) continue;

      const queries = getGeocodeQueries(item);
      const cacheKey = queries[0];
      if (!cacheKey) continue;

      if (geocodeCacheRef.current.has(cacheKey)) {
        continue;
      }

      groupedQueries.set(cacheKey, queries);
    }

    const queries = [...groupedQueries.entries()];
    let nextQueryIndex = 0;
    const geocode = async (query) => {
      try {
        const params = new URLSearchParams({ query });
        const response = await fetch(`/api/geocode?${params}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.coordinates ?? null;
      } catch {
        return null;
      }
    };

    const worker = async () => {
      while (!cancelled && nextQueryIndex < queries.length) {
        const [cacheKey, queryCandidates] = queries[nextQueryIndex++];
        let coordinates = null;
        for (const query of queryCandidates) {
          coordinates = await geocode(query);
          if (coordinates) break;
        }
        geocodeCacheRef.current.set(cacheKey, coordinates);
        if (coordinates && !cancelled) {
            setGeocodedLocations((current) => ({
            ...current,
              [cacheKey]: coordinates,
          }));
        }
      }
    };

    void Promise.all(Array.from({ length: Math.min(2, queries.length) }, worker));
    return () => { cancelled = true; };
  }, [filteredItems, status]);

  const mapItems = useMemo(() => filteredItems.flatMap((item) => {
    if (hasCoordinates(item)) return [item];

    const cacheKey = getGeocodeQueries(item)[0];
    const coordinates = geocodedLocations[cacheKey];
    return coordinates ? [{ ...item, ...coordinates }] : [];
  }), [filteredItems, geocodedLocations]);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (status !== 'ready' || !map || !maps || mapItems.length === 0) return;

    if (mapItems.length === 1) {
      map.setCenter(new maps.LatLng(Number(mapItems[0].latitude), Number(mapItems[0].longitude)));
      map.setZoom(14);
      return;
    }

    const bounds = new maps.LatLngBounds();
    for (const item of mapItems) {
      bounds.extend(new maps.LatLng(Number(item.latitude), Number(item.longitude)));
    }
    map.fitBounds(bounds);
  }, [map, mapItems, status]);

  return (
    <div className="relative h-[calc(100dvh-210px)] min-h-96 w-full overflow-hidden rounded-xl border border-line bg-sunken">
      <div ref={containerRef} className="h-250 w-full" />
      <ul
        aria-label="지도 마커 카테고리 필터"
        className="absolute left-3 right-16 top-3 z-10 flex w-fit flex-wrap items-center gap-1 rounded-xl border border-line-strong bg-surface p-1 text-sm shadow-sm"
      >
        {FILTER_ENTRIES.map(([category, style]) => {
          // 💡 4. 현재 카테고리가 선택 배열에 포함되어 있는지 확인
          const isSelected = activeCategories.includes(category);
          const isAnySelected = activeCategories.length > 0;
          const isShown = isAnySelected ? isSelected : category !== 'movie';

          return (
            <li key={category}>
              {/* 💡 5. 선택된 카테고리는 배경으로 강조, 나머지는 흐리게 (아무것도 선택 안 했을 땐 영화관만 흐리게) */}
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleCategoryClick(category)}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 font-medium text-ink transition-[background-color,opacity] duration-150 ${
                  isSelected ? 'bg-sunken font-semibold' : 'hover:bg-sunken'
                } ${isShown ? 'opacity-100' : 'opacity-55'}`}
              >
                {/* 지도의 점 마커와 같은 모양의 색 점: 마커를 읽는 기준 */}
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full border-2 border-surface shadow-[0_0_0_1px_var(--line-strong)]"
                  style={{ backgroundColor: style.color }}
                />
                {style.label}
              </button>
            </li>
          );
        })}
        {/* 💡 6. 활성화된 필터가 있을 때만 전체 리셋 버튼 노출 */}
        {activeCategories.length > 0 && (
          <li className="border-l border-line pl-1">
            <button
              type="button"
              onClick={() => setActiveCategories([])}
              className="h-9 cursor-pointer rounded-lg px-2.5 text-xs font-semibold text-ink-soft transition-colors duration-150 hover:bg-sunken hover:text-ink"
            >
              초기화
            </button>
          </li>
        )}
      </ul>
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-2 z-10 rounded bg-surface/90 px-1.5 py-1 text-[11px] text-ink-soft shadow"
      >
        © OpenStreetMap contributors
      </a>
      {status !== 'ready' && (
        <p role="status" className="absolute inset-x-4 bottom-4 z-1 rounded-lg bg-surface/95 px-4 py-3 text-sm text-ink-soft shadow">
          {status === 'error'
            ? 'Naver 지도를 불러오지 못했습니다. 키와 허용 도메인 설정을 확인해주세요.'
            : 'Naver 지도를 불러오는 중…'}
        </p>
      )}
      {mapItems.map((item) => <MapMarker key={item.id} map={map} item={item} selected={selectedMapItem?.id === item.id} />)}
      <DetailPanel item={selectedMapItem} onClose={() => setSelectedMapItem(null)} />
    </div>
  );
}
