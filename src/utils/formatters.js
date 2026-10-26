import { CATEGORY_BY_KEY } from "@/utils/categories";

export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "일정 미정";
  return `${startDate} ~ ${endDate}`;
}

export function formatPrice(price) {
  return price || "정보 없음";
}

// API가 "정보 없음" 같은 문구를 가격 자리에 넣어 보내는 경우를 걸러냄
export function hasPriceInfo(price) {
  return Boolean(price) && !["정보 없음", "가격 정보 없음"].includes(price);
}

// KOBIS showRange "20261020~20261026" → "2026-10-20 ~ 2026-10-26"
export function formatShowRange(showRange) {
  return showRange
    ?.split("~")
    .map((date) => date.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"))
    .join(" ~ ");
}

export function formatCategory(category) {
  return CATEGORY_BY_KEY[category]?.title ?? "문화 행사";
}

const readableDateFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" });

// "2026-10-27" → "10월 27일 (화)"
export function formatReadableDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return readableDateFormat.format(new Date(year, month - 1, day));
}

// 범위면 "10월 27일 (화) – 11월 3일 (화)"
export function formatReadableRange(startDate, endDate) {
  if (!startDate) return "";
  if (!endDate || startDate === endDate) return formatReadableDate(startDate);
  return `${formatReadableDate(startDate)} – ${formatReadableDate(endDate)}`;
}
