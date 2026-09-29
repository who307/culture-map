"use client";

import { useEffect } from "react";
import { useFilterStore } from "@/store/useFilterStore";

export default function MapMarker({ map, item }) {
  const setSelectedMapItem = useFilterStore((state) => state.setSelectedMapItem);

  useEffect(() => {
    const maps = window.naver?.maps;
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!maps || !map || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;

    const position = new maps.LatLng(latitude, longitude);
    const marker = new maps.Marker({ position, map, title: item.title });
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