'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import DetailPanel from '@/components/map/DetailPanel';
import MapMarker, { MARKER_STYLES } from '@/components/map/MapMarker';
import { useNaverMap } from '@/hooks/useNaverMap';
import { useFilterStore } from '@/store/useFilterStore';
import { hasCoordinates } from '@/utils/location';

// 기본으로 꺼져 있는 영화관 필터는 맨 뒤에 둠
const FILTER_ENTRIES = Object.entries(MARKER_STYLES).sort(([left], [right]) => (left === 'movie') - (right === 'movie'));
// 영화관은 688곳이라 한 번에 그리면 느려서, 이 줌 이상에서 화면 안에 있는 곳만 그림
const THEATER_MIN_ZOOM = 13;
// 내 위치로 이동할 때의 줌 (영화관이 보이는 범위)
const LOCATE_ZOOM = 14;

function readViewport(map) {
  const bounds = map.getBounds();
  const southWest = bounds.getSW();
  const northEast = bounds.getNE();
  return {
    zoom: map.getZoom(),
    south: southWest.lat(),
    west: southWest.lng(),
    north: northEast.lat(),
    east: northEast.lng(),
  };
}

// 화면 가장자리에서 마커가 갑자기 나타나지 않도록 범위를 사방으로 20% 넓혀서 판단
function isInViewport(item, viewport) {
  const latPadding = (viewport.north - viewport.south) * 0.2;
  const lngPadding = (viewport.east - viewport.west) * 0.2;
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);
  return latitude >= viewport.south - latPadding
    && latitude <= viewport.north + latPadding
    && longitude >= viewport.west - lngPadding
    && longitude <= viewport.east + lngPadding;
}

function getLocateErrorMessage(error) {
  if (error?.code === 1) return '위치 권한이 꺼져 있습니다. 브라우저 설정에서 이 사이트의 위치 접근을 허용해주세요.';
  if (error?.code === 3) return '현재 위치를 찾는 데 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.';
  return '현재 위치를 찾지 못했습니다.';
}

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
  const [viewport, setViewport] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locateState, setLocateState] = useState({ status: 'idle', message: '' });
  // 내 위치로 옮긴 뒤에는 장소 검색 결과가 늦게 와도 지도를 전체 범위로 되돌리지 않음
  const userPositionedRef = useRef(false);
  const locateMessageTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(locateMessageTimerRef.current), []);

  // 지도가 로드되었을 때 확대/축소 바(zoomControl) 없애기
  useEffect(() => {
    if (status === 'ready' && map) {
      map.setOptions({
        zoomControl: false,
      });
    }
  }, [status, map]);

  // 이동·확대가 끝날 때마다 현재 화면 범위와 줌을 기록 (영화관 마커를 화면 안에서만 그리기 위해)
  useEffect(() => {
    const maps = window.naver?.maps;
    if (status !== 'ready' || !map || !maps) return undefined;

    const updateViewport = () => setViewport(readViewport(map));
    // 리스너를 붙이기 전에 이미 멈춰 있던 지도도 한 번은 범위를 읽도록 다음 프레임에 기록
    const frame = window.requestAnimationFrame(updateViewport);
    const idleListener = maps.Event.addListener(map, 'idle', updateViewport);
    return () => {
      window.cancelAnimationFrame(frame);
      maps.Event.removeListener(idleListener);
    };
  }, [map, status]);

  // 내 위치 표시: 접근성 대비가 높은 파란 점 + 반투명 테두리
  useEffect(() => {
    const maps = window.naver?.maps;
    if (status !== 'ready' || !map || !maps || !userLocation) return undefined;

    const marker = new maps.Marker({
      position: new maps.LatLng(userLocation.latitude, userLocation.longitude),
      map,
      title: '내 위치',
      clickable: false,
      zIndex: 300,
      icon: {
        content: '<div style="width:18px;height:18px;box-sizing:border-box;border:3px solid #fff;border-radius:50%;background:#2346D3;box-shadow:0 0 0 6px rgba(35,70,211,.25),0 1px 3px rgba(22,24,29,.4);"></div>',
        size: new maps.Size(18, 18),
        anchor: new maps.Point(9, 9),
      },
    });
    return () => marker.setMap(null);
  }, [map, status, userLocation]);

  // 오류 안내는 상세 패널을 가리지 않도록 잠시 보여 준 뒤 지움
  const showLocateError = (message) => {
    setLocateState({ status: 'error', message });
    window.clearTimeout(locateMessageTimerRef.current);
    locateMessageTimerRef.current = window.setTimeout(() => setLocateState({ status: 'idle', message: '' }), 6000);
  };

  const handleLocateClick = () => {
    const maps = window.naver?.maps;
    if (!map || !maps) return;
    if (!navigator.geolocation) {
      showLocateError('이 브라우저는 위치 찾기를 지원하지 않습니다.');
      return;
    }

    window.clearTimeout(locateMessageTimerRef.current);
    setLocateState({ status: 'locating', message: '현재 위치를 찾는 중…' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude };
        userPositionedRef.current = true;
        setUserLocation(location);
        setLocateState({ status: 'idle', message: '' });
        map.setCenter(new maps.LatLng(location.latitude, location.longitude));
        map.setZoom(LOCATE_ZOOM);
      },
      (error) => showLocateError(getLocateErrorMessage(error)),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

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

  // 지도 범위 맞추기는 행사 마커 기준 (전국 영화관에 맞추면 영화관이 보이지 않는 줌까지 멀어짐)
  const fitItems = useMemo(() => mapItems.filter((item) => item.type !== 'movie'), [mapItems]);
  const isTheaterLayerOn = activeCategories.includes('movie');
  const isTheaterZoomReached = viewport ? viewport.zoom >= THEATER_MIN_ZOOM : false;
  const visibleItems = useMemo(() => mapItems.filter((item) => item.type !== 'movie'
    || (isTheaterZoomReached && isInViewport(item, viewport))), [mapItems, isTheaterZoomReached, viewport]);

  // 조건(지역·기간·카테고리)이 바뀌면 다시 전체 범위에 맞춤
  useEffect(() => {
    userPositionedRef.current = false;
  }, [items, activeCategories]);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (status !== 'ready' || !map || !maps || fitItems.length === 0 || userPositionedRef.current) return;

    if (fitItems.length === 1) {
      map.setCenter(new maps.LatLng(Number(fitItems[0].latitude), Number(fitItems[0].longitude)));
      map.setZoom(14);
      return;
    }

    const bounds = new maps.LatLngBounds();
    for (const item of fitItems) {
      bounds.extend(new maps.LatLng(Number(item.latitude), Number(item.longitude)));
    }
    map.fitBounds(bounds);
  }, [map, fitItems, status]);

  return (
    <div className="relative h-[calc(100dvh-210px)] min-h-96 w-full overflow-hidden rounded-xl border border-line bg-sunken">
      {/* Naver SDK가 컨테이너에 position: relative를 넣어 inset 대신 부모 높이를 그대로 채움 */}
      <div ref={containerRef} className="h-full w-full" />
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
      <button
        type="button"
        onClick={handleLocateClick}
        disabled={status !== 'ready' || locateState.status === 'locating'}
        aria-label="내 위치에서 보기"
        title="내 위치에서 보기"
        className="absolute right-3 top-3 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-line-strong bg-surface text-ink shadow-sm transition-colors duration-150 hover:bg-sunken disabled:cursor-default disabled:opacity-55"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 ${locateState.status === 'locating' ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
      {/* 영화관 안내와 위치 찾기 결과 (화면낭독기에도 읽힘) */}
      <div role="status" className="pointer-events-none absolute inset-x-3 bottom-10 z-10 flex flex-col items-center gap-2 empty:hidden">
        {locateState.message && (
          <p className={`pointer-events-auto rounded-lg bg-surface/95 px-3 py-2 text-center text-sm shadow ${locateState.status === 'error' ? 'text-danger' : 'text-ink-soft'}`}>
            {locateState.message}
          </p>
        )}
        {status === 'ready' && isTheaterLayerOn && !isTheaterZoomReached && (
          <p className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg bg-surface/95 px-3 py-2 text-center text-sm text-ink-soft shadow">
            지도를 확대하면 근처 영화관이 표시됩니다.
            <button
              type="button"
              onClick={handleLocateClick}
              disabled={locateState.status === 'locating'}
              className="cursor-pointer font-semibold text-accent underline-offset-2 hover:underline disabled:cursor-default disabled:opacity-55"
            >
              내 위치에서 보기
            </button>
          </p>
        )}
      </div>
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
      {visibleItems.map((item) => <MapMarker key={item.id} map={map} item={item} selected={selectedMapItem?.id === item.id} />)}
      <DetailPanel item={selectedMapItem} onClose={() => setSelectedMapItem(null)} />
    </div>
  );
}
