"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategoryCultures, fetchHomeCultures, fetchMapCultures, fetchMovieTheaters } from "@/utils/api";
import { useFilterStore } from "@/store/useFilterStore";

export function useCultureData(category, options = {}) {
  const { limit, sort, order, boxOfficeType = "daily" } = options;
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const selectedRegion = useFilterStore((state) => state.selectedRegion);

  return useQuery({
    queryKey: ["cultures", category, startDate, endDate, selectedRegion, limit, sort, order, boxOfficeType],
    queryFn: async () => {
      if (category === "home") return fetchHomeCultures(startDate, endDate);

      const requestOptions = { startDate, endDate, limit, sort, order, boxOfficeType };
      const data = category === "all"
        ? await fetchMapCultures(requestOptions)
        : await fetchCategoryCultures(category, requestOptions);

      if (selectedRegion === "ALL") return data;
      if (category === "movie") return data;
      return data.filter((item) => item.address?.includes(selectedRegion));
    },
  });
}

// 영화관은 날짜와 무관한 시설 정보라 기간·지역과 상관없이 하루 한 번만 받아옴 (지역 필터는 지도 페이지에서 적용)
export function useMovieTheaters() {
  return useQuery({
    queryKey: ["movie-theaters"],
    queryFn: fetchMovieTheaters,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
