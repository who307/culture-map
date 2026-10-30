// 카테고리별 이름·경로·색을 한 곳에서 관리 (메뉴, 홈 섹션, 카드 뱃지, 지도 마커가 모두 여기서 읽음)
// 화면에서는 카테고리 색 세로선(bar)·색 칩(dot)으로, 지도 핀에서는 한 글자(badge)로 구분. marker.color는 globals.css의 --cat-* 라이트 값과 같음
export const CATEGORIES = [
  {
    key: "movie",
    endpoint: "movies",
    href: "/movies",
    label: "영화",
    shortLabel: "영화",
    title: "영화",
    homeTitle: "박스오피스 영화",
    badge: "영",
    dot: "bg-cat-movie",
    bar: "border-cat-movie",
    // 지도에는 영화 대신 영화관(행정안전부 영화상영관 데이터) 위치를 표시
    marker: { color: "#3A3F4B", label: "영화관" },
  },
  {
    key: "concert",
    endpoint: "concerts",
    href: "/concerts",
    label: "콘서트",
    shortLabel: "콘서트",
    title: "콘서트(대중음악)",
    homeTitle: "인기 콘서트",
    badge: "콘",
    dot: "bg-cat-concert",
    bar: "border-cat-concert",
    marker: { color: "#00843D" },
  },
  {
    key: "musical",
    endpoint: "musicals",
    href: "/musicals",
    label: "뮤지컬",
    shortLabel: "뮤지컬",
    title: "뮤지컬",
    homeTitle: "대표 뮤지컬",
    badge: "뮤",
    dot: "bg-cat-musical",
    bar: "border-cat-musical",
    marker: { color: "#8B4FA8" },
  },
  {
    key: "festival",
    endpoint: "festivals",
    href: "/festivals",
    label: "지역 행사",
    shortLabel: "행사",
    title: "지역 행사",
    homeTitle: "지역 축제 및 행사",
    badge: "행",
    dot: "bg-cat-festival",
    bar: "border-cat-festival",
    marker: { color: "#B35400" },
  },
  {
    key: "exhibition",
    endpoint: "exhibitions",
    href: "/exhibitions",
    label: "전시회",
    shortLabel: "전시",
    title: "전시회",
    homeTitle: "전시회 및 미술관",
    badge: "전",
    dot: "bg-cat-exhibition",
    bar: "border-cat-exhibition",
    marker: { color: "#0072B0" },
  },
];

export const CATEGORY_BY_KEY = {
  ...Object.fromEntries(CATEGORIES.map((category) => [category.key, category])),
  // 관광공사 데이터는 행사를 event 타입으로 내려줌
  event: CATEGORIES.find((category) => category.key === "festival"),
};

export const MAP_CATEGORIES = CATEGORIES.filter((category) => category.marker);
