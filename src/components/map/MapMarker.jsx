"use client";

import { useEffect } from "react";
import { useFilterStore } from "@/store/useFilterStore";

export const MARKER_STYLES = {
  concert: { color: "#2864C5", icon: "🎤", label: "콘서트" },
  musical: { color: "#8753C4", icon: "🎭", label: "뮤지컬" },
  festival: { color: "#D9842B", icon: "🎪", label: "행사" },
  exhibition: { color: "#15947A", icon: "🖼️", label: "전시" },
};

function createMarkerIcon(maps, type) {
  const { color, icon } = MARKER_STYLES[type] ?? { color: "#475569", icon: "📍" };

  return {
    content: `<div data-culture-marker="${type}" style="position:relative;width:38px;height:42px;font-family:system-ui,sans-serif;">
      <div style="position:absolute;z-index:0;top:25px;left:13px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:12px solid ${color};filter:drop-shadow(0 2px 2px rgba(15,23,42,.22));"></div>
      <div style="position:absolute;z-index:1;top:0;left:1px;display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:3px solid #fff;border-radius:50%;background:${color};box-shadow:0 2px 7px rgba(15,23,42,.3);font-size:17px;line-height:1;box-sizing:border-box;">${icon}</div>
    </div>`,
    size: new maps.Size(38, 42),
    anchor: new maps.Point(19, 39),
  };
}

export default function MapMarker({ map, item }) {
  const setSelectedMapItem = useFilterStore((state) => state.setSelectedMapItem);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (item.latitude === null || item.latitude === undefined || item.longitude === null || item.longitude === undefined) return undefined;
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!maps || !map || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;

    map.setOptions({
      zoomControl: false,
    });

    const position = new maps.LatLng(latitude, longitude);
    const marker = new maps.Marker({
      position,
      map,
      title: item.title,
      icon: createMarkerIcon(maps, item.type),
      zIndex: 100,
    });
    const listener = maps.Event.addListener(marker, "click", () => {
      setSelectedMapItem(item);
      map.panTo(position);
    });

    return () => {
      maps.Event.removeListener(listener);
      marker.setMap(null);
    };
  }, [item, map, setSelectedMapItem]);

  return null;
}