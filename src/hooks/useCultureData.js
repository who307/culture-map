"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllCultures, fetchCategoryCultures, fetchHomeCultures } from "@/utils/api";
import { useFilterStore } from "@/store/useFilterStore";

export function useCultureData(category, options = {}) {
  const { limit, sort, order } = options;
  const selectedDate = useFilterStore((state) => state.selectedDate);
  const selectedRegion = useFilterStore((state) => state.selectedRegion);

  return useQuery({
    queryKey: ["cultures", category, selectedDate, selectedRegion, limit, sort, order],
    queryFn: async () => {
      if (category === "home") return fetchHomeCultures(selectedDate);

      const requestOptions = { date: selectedDate, limit, sort, order };
      const data = category === "all"
        ? await fetchAllCultures(requestOptions)
        : await fetchCategoryCultures(category, requestOptions);

      if (selectedRegion === "ALL") return data;
      return data.filter((item) => item.address?.includes(selectedRegion));
    },
  });
}