export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "일정 미정";
  return `${startDate} ~ ${endDate}`;
}

export function formatPrice(price) {
  return price || "정보 없음";
}

export function formatCategory(category) {
  const labels = {
    concert: "콘서트(대중음악)",
    exhibition: "전시회",
    festival: "지역 행사",
    movie: "영화",
    musical: "뮤지컬",
  };
  return labels[category] ?? "문화 행사";
}