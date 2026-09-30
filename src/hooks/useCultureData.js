"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllCultures, fetchCategoryCultures, fetchHomeCultures } from "@/utils/api";
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
        ? await fetchAllCultures(requestOptions)
        : await fetchCategoryCultures(category, requestOptions);

      if (selectedRegion === "ALL") return data;
      if (category === "movie") return data;
      return data.filter((item) => item.address?.includes(selectedRegion));
    },
  });
}