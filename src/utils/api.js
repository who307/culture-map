import { isEventInDateRange } from "@/utils/date";

const BASE_URL = process.env.NEXT_PUBLIC_CULTURE_API_URL ?? "http://localhost:4000";

export const CULTURE_CATEGORIES = [
  { key: "movie", endpoint: "movies", label: "영화", path: "/movies" },
  { key: "concert", endpoint: "concerts", label: "콘서트", path: "/concerts" },
  { key: "musical", endpoint: "musicals", label: "뮤지컬", path: "/musicals" },
  { key: "festival", endpoint: "festivals", label: "지역 행사", path: "/festivals" },
  { key: "exhibition", endpoint: "exhibitions", label: "전시회", path: "/exhibitions" },
];

function getEndpoint(category) {
  const match = CULTURE_CATEGORIES.find((item) => item.key === category || item.endpoint === category);
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
  } = options;
  const endpoint = getEndpoint(category);

  if (endpoint === "movies") {
    const params = new URLSearchParams({
      targetDt: endDate,
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

  const url = new URL(`${BASE_URL}/${endpoint}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${endpoint} 데이터를 불러오지 못했습니다.`);

  const data = await response.json();
  let cultures = Array.isArray(data) ? data : data.data ?? [];

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
    CULTURE_CATEGORIES.map(({ endpoint }) => fetchCategoryCultures(endpoint, { limit: 5, startDate, endDate }))
  );

  if (results.every((result) => result.status === "rejected")) {
    throw new Error("문화 행사 정보를 불러오지 못했습니다.");
  }

  return Object.fromEntries(
    CULTURE_CATEGORIES.map(({ key }, index) => [
      key,
      results[index].status === "fulfilled" ? results[index].value : [],
    ])
  );
}

export async function fetchAllCultures(options = {}) {
  const results = await Promise.all(
    CULTURE_CATEGORIES.map(({ endpoint }) => fetchCategoryCultures(endpoint, options))
  );
  return results.flat();
}

export async function fetchMovieTheaters(options = {}) {
  const { pageNo = 1, numOfRows = 1000 } = options;
  const params = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
  });
  const response = await fetch(`/api/movie-theaters?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "영화관 정보를 불러오지 못했습니다.");
  }

  const data = await response.json();
  const items = data?.response?.body?.items?.item
    ?? data?.body?.items?.item
    ?? data?.data?.items
    ?? data?.items
    ?? [];

  return Array.isArray(items) ? items : items ? [items] : [];
}