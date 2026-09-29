'use client';

import { useEffect, useRef } from 'react';
import { useCultureStore } from '@/store/useCultureStore';

export default function NaverMapContainer({ items = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const { selectedMapItem, setSelectedMapItem } = useCultureStore();

  useEffect(() => {
    // 네이버 지도 SDK 로드 여부 확인
    if (!window.naver || !window.naver.maps) return;

    // 지도 기본 옵션 설정 (기본 중심: 서울 시청)
    const mapOptions = {
      center: new window.naver.maps.LatLng(37.5665, 126.978),
      zoom: 13,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    };

    // 지도 객체 생성 (1회)
    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, mapOptions);
    }

    const map = mapInstance.current;

    // 기존 마커 초기화
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 행사 아이템 기반 마커 생성
    items.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      const position = new window.naver.maps.LatLng(item.latitude, item.longitude);

      const marker = new window.naver.maps.Marker({
        position,
        map,
        title: item.title,
        icon: {
          url: `/images/markers/marker-${item.type}.png`, // 커스텀 마커 이미지
          size: new window.naver.maps.Size(36, 36),
          scaledSize: new window.naver.maps.Size(36, 36),
        },
      });

      // 마커 클릭 시 스토어 상태 업데이트 (사이드 패널 연동)
      window.naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedMapItem(item);
        map.panTo(position); // 클릭 시 해당 위치로 부드럽게 이동
      });

      markersRef.current.push(marker);
    });
  }, [items, setSelectedMapItem]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden shadow-inner" />
    </div>
  );
}