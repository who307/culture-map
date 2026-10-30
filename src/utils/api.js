import { getTodayDate, isEventInDateRange, isFutureDate } from "@/utils/date";
import { CATEGORIES } from "@/utils/categories";
import { hasCoordinates } from "@/utils/location";

const BASE_URL = "http://localhost:4000";

function getEndpoint(category) {
  const match = CATEGORIES.find((item) => item.key === category || item.endpoint === category);
  if (!match) throw new Error(`지원하지 않는 문화 카테고리입니다: ${category}`);
  return match.endpoint;
}

export async function fetchCategoryCultures(category, options = {}) {
  const {
    limit,
    date,
    startDate = date,
    endDate = date ?? new Date().toISOString().slice(0, 10),
    sort,
    order = "asc",
    boxOfficeType = "daily",
    includeCoordinates = false,
  } = options;
  const endpoint = getEndpoint(category);

  if (endpoint === "movies") {
    // 박스오피스는 지난 날짜의 집계만 있음: 기간 전체가 미래면 요청하지 않고,
    // 기간이 오늘을 지나 미래까지 이어지면 오늘까지의 최신 집계를 보여줌
    if (isFutureDate(startDate)) return [];
    const params = new URLSearchParams({
      targetDt: isFutureDate(endDate) ? getTodayDate() : endDate,
      type: boxOfficeType,
    });
    const response = await fetch(`/api/box-office?${params}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? "박스오피스 데이터를 불러오지 못했습니다.");
    }

    const data = await response.json();
    let movies = data.items ?? [];
    if (sort) {
      const direction = order === "desc" ? -1 : 1;
      movies = [...movies].sort((left, right) => {
        const leftValue = left[sort];
        const rightValue = right[sort];
        if (typeof leftValue === "number" && typeof rightValue === "number") {
          return (leftValue - rightValue) * direction;
        }
        return String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "ko") * direction;
      });
    }

    return limit ? movies.slice(0, limit) : movies;
  }

  let cultures;
  if (endpoint === "concerts" || endpoint === "musicals") {
    const params = new URLSearchParams({
      category: endpoint === "concerts" ? "concert" : "musical",
      startDate: startDate ?? endDate,
      endDate,
    });
    if (includeCoordinates) params.set("includeCoordinates", "true");
    const response = await fetch(`/api/kopis?${params}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? "KOPIS 공연 데이터를 불러오지 못했습니다.");
    }

    const data = await response.json();
    cultures = data.items ?? [];
  } else if (endpoint === "festivals" || endpoint === "exhibitions") {
    const route = endpoint === "festivals" ? "/api/tour-events" : "/api/culture-exhibitions";
    const params = new URLSearchParams({
      startDate: startDate ?? endDate,
      endDate,
    });
    const response = await fetch(`${route}?${params}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error ?? `${endpoint} 데이터를 불러오지 못했습니다.`);
    }

    const data = await response.json();
    cultures = data.items ?? [];
  } else {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${endpoint} 데이터를 불러오지 못했습니다.`);

    const data = await response.json();
    cultures = Array.isArray(data) ? data : data.data ?? [];
  }

  if (startDate && endDate) {
    cultures = cultures.filter((item) => isEventInDateRange(item, startDate, endDate));
  }
  if (sort) {
    const direction = order === "desc" ? -1 : 1;
    cultures = [...cultures].sort((left, right) => {
      const leftValue = left[sort];
      const rightValue = right[sort];
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * direction;
      }
      return String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "ko") * direction;
    });
  }

  return limit ? cultures.slice(0, limit) : cultures;
}

export async function fetchHomeCultures(startDate, endDate = startDate) {
  const results = await Promise.allSettled(
    CATEGORIES.map(({ endpoint }) => fetchCategoryCultures(endpoint, { limit: 5, startDate, endDate }))
  );

  if (results.every((result) => result.status === "rejected")) {
    throw new Error("문화 행사 정보를 불러오지 못했습니다.");
  }

  return Object.fromEntries(
    CATEGORIES.map(({ key }, index) => [
      key,
      results[index].status === "fulfilled" ? results[index].value : [],
    ])
  );
}

export async function fetchMapCultures(options = {}) {
  const mapCategories = CATEGORIES.filter(({ key }) => key !== "movie");
  const results = await Promise.allSettled(
    mapCategories.map(({ key }) => fetchCategoryCultures(key, { ...options, includeCoordinates: true }))
  );

  if (results.every((result) => result.status === "rejected")) {
    throw new Error("지도 행사 정보를 불러오지 못했습니다.");
  }

  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const uniqueItems = [...new Map(items.map((item) => [item.id, item])).values()];

  return uniqueItems
    .filter((item) => hasCoordinates(item) || Boolean(item.address || item.locationName));
}

export async function fetchMovieTheaters() {
  const response = await fetch("/api/movie-theaters");

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "영화관 정보를 불러오지 못했습니다.");
  }

  const data = await response.json();
  return data.items ?? [];
}