"use client";

import { useEffect, useState } from "react";

export function useNaverMap(containerRef) {
  const [map, setMap] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const initialize = () => {
      const maps = window.naver?.maps;
      if (!maps || !container.isConnected) return false;
      setMap(new maps.Map(container, {
        center: new maps.LatLng(37.5665, 126.978),
        zoom: 12,
        zoomControl: true,
        zoomControlOptions: { position: maps.Position.TOP_RIGHT },
      }));
      return true;
    };

    if (initialize()) return undefined;
    const handleLoad = () => initialize();
    window.addEventListener("load", handleLoad, { once: true });
    return () => window.removeEventListener("load", handleLoad);
  }, [containerRef]);

  return map;
}