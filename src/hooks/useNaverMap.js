"use client";

import { useEffect, useRef, useState } from "react";

export function useNaverMap(containerRef) {
  const mapInstanceRef = useRef(null);
  const [map, setMap] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let active = true;
    let attempts = 0;
    let retryTimer;

    const initialize = () => {
      const maps = window.naver?.maps;
      if (!maps || !container.isConnected) return false;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new maps.Map(container, {
          center: new maps.LatLng(37.5665, 126.978),
          zoom: 12,
          zoomControl: true,
          zoomControlOptions: { position: maps.Position.TOP_RIGHT },
        });
      }

      if (active) {
        setMap(mapInstanceRef.current);
        setStatus("ready");
      }
      return true;
    };

    if (initialize()) return () => { active = false; };

    const script = document.querySelector('script[src*="maps.js"]');
    const handleLoad = () => initialize();
    const handleError = () => active && setStatus("error");
    script?.addEventListener("load", handleLoad);
    script?.addEventListener("error", handleError);

    retryTimer = window.setInterval(() => {
      attempts += 1;
      if (initialize()) {
        window.clearInterval(retryTimer);
      } else if (attempts >= 100) {
        window.clearInterval(retryTimer);
        handleError();
      }
    }, 100);

    return () => {
      active = false;
      window.clearInterval(retryTimer);
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [containerRef]);

  return { map, status };
}