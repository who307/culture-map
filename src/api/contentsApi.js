// contentsApi.js

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const CATEGORY_MAPPING = [
    { apiKey: "movies", storeKey: "movie" },
    { apiKey: "concerts", storeKey: "concert" },
    { apiKey: "musicals", storeKey: "musical" },
    { apiKey: "festivals", storeKey: "festival" },
    { apiKey: "exhibitions", storeKey: "exhibition" },
];

/**
 * 단일 카테고리 호출
 */
export async function fetchCategoryCultures(category, options = {}) {
    const { limit, date, sort, order = "asc" } = options;
    const url = new URL(`${BASE_URL}/${category}`);

    if (limit) {
        url.searchParams.append("_page", 1);
        url.searchParams.append("_per_page", limit);
    }

    // 2. date 필드 대신 startDate / endDate 범위 조회 적용 (json-server 기준)
    if (date) {
        url.searchParams.append("startDate_lte", date);
        url.searchParams.append("endDate_gte", date);
    }
    if (sort) {
        url.searchParams.append("_sort", sort);
        url.searchParams.append("_order", order);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`[${category}] 데이터를 불러올 수 없습니다.`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.data ?? [];
}

/**
 * 홈 전용 : 각 카테고리별 5개씩 병렬 호출
 */
export async function fetchHomeCultures(selectedDate) {
    const results = await Promise.allSettled(CATEGORY_MAPPING.map(({ apiKey }) => fetchCategoryCultures(apiKey, { limit: 5, date: selectedDate })));
console.log(results);
    // 모든 요청이 실패한 경우 에러를 던져 useQuery의 isError를 true로 만듦
    const isAllFailed = results.every((r) => r.status === "rejected");
    if (isAllFailed) {
        throw new Error("모든 문화 행사 데이터를 가져오지 못했습니다.");
    }

    const homeData = { movie: [], concert: [], musical: [], festival: [], exhibition: [] };

    CATEGORY_MAPPING.forEach(({ storeKey }, index) => {
        const result = results[index];
        if (result.status === "fulfilled") {
            homeData[storeKey] = result.value;
        } else {
            console.error(`[${storeKey}] API 로딩 실패:`, result.reason);
            homeData[storeKey] = [];
        }
    });
    console.log(homeData);
    return homeData;
}
