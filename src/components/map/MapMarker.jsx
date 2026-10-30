"use client";

import { useEffect } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { MAP_CATEGORIES } from "@/utils/categories";
import { hasCoordinates } from "@/utils/location";

export const MARKER_STYLES = Object.fromEntries(
  MAP_CATEGORIES.map(({ key, shortLabel, badge, marker }) => [key, { ...marker, badge, label: marker.label ?? shortLabel }])
);

// 이 줌보다 멀리 보면 핀 대신 작은 점으로 그려 수도권처럼 몰린 곳이 덩어리지지 않게 함
const PIN_MIN_ZOOM = 11;
const MARKER_SHADOW = "drop-shadow(0 1px 2px rgba(22,24,29,.35))";

function createMarkerIcon(maps, type, { compact, selected }) {
  const { color, badge } = MARKER_STYLES[type] ?? { color: "#3A3F4B", badge: "" };

  if (compact && !selected) {
    return {
      content: `<div data-culture-marker="${type}" style="width:14px;height:14px;box-sizing:border-box;border:2px solid #fff;border-radius:50%;background:${color};filter:${MARKER_SHADOW};"></div>`,
      size: new maps.Size(14, 14),
      anchor: new maps.Point(7, 7),
    };
  }

  // 물방울 핀: 몸통과 꼬리가 한 경로, 흰 원 안에 노선 글자. 선택된 핀은 1.3배
  const scale = selected ? 1.3 : 1;
  const width = Math.round(28 * scale);
  const height = Math.round(36 * scale);
  return {
    content: `<svg data-culture-marker="${type}" width="${width}" height="${height}" viewBox="0 0 28 36" style="display:block;overflow:visible;filter:${MARKER_SHADOW};">
      <path d="M14 34.5C14 34.5 26 23.6 26 14A12 12 0 0 0 2 14C2 23.6 14 34.5 14 34.5Z" fill="${color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="14" cy="14" r="8" fill="#fff"/>
      <text x="14" y="17.8" text-anchor="middle" font-family="'Wanted Sans Variable','Wanted Sans',system-ui,sans-serif" font-size="11" font-weight="800" fill="${color}">${badge}</text>
    </svg>`,
    size: new maps.Size(width, height),
    anchor: new maps.Point(width / 2, height - 1),
  };
}

export default function MapMarker({ map, item, selected = false }) {
  const setSelectedMapItem = useFilterStore((state) => state.setSelectedMapItem);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (!maps || !map || !hasCoordinates(item)) return undefined;
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);

    map.setOptions({
      zoomControl: false,
    });

    const position = new maps.LatLng(latitude, longitude);
    const iconForZoom = () => createMarkerIcon(maps, item.type, { compact: map.getZoom() < PIN_MIN_ZOOM, selected });
    const marker = new maps.Marker({
      position,
      map,
      title: item.title,
      icon: iconForZoom(),
      zIndex: selected ? 200 : 100,
    });
    const clickListener = maps.Event.addListener(marker, "click", () => {
      setSelectedMapItem(item);
      map.panTo(position);
    });
    const zoomListener = maps.Event.addListener(map, "zoom_changed", () => marker.setIcon(iconForZoom()));

    return () => {
      maps.Event.removeListener(clickListener);
      maps.Event.removeListener(zoomListener);
      marker.setMap(null);
    };
  }, [item, map, selected, setSelectedMapItem]);

  return null;
}
