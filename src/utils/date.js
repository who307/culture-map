export function getTodayDate() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

// 박스오피스처럼 지난 날짜의 집계만 있는 데이터를 거를 때 사용 (오늘은 미래가 아님)
export function isFutureDate(value) {
  return Boolean(value) && value > getTodayDate();
}

export function isEventOnDate(item, date) {
  return isEventInDateRange(item, date, date);
}

export function isEventInDateRange(item, startDate, endDate) {
  const eventStartDate = item.startDate ?? item.endDate;
  const eventEndDate = item.endDate ?? item.startDate;
  return Boolean(eventStartDate && eventEndDate)
    && eventStartDate <= endDate
    && eventEndDate >= startDate;
}

// "2026-10-27" 같은 날짜 문자열을 로컬 자정 기준 Date로 (UTC 변환으로 하루 밀리지 않게)
function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(value, days) {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

// 그 날짜가 속한 주의 월요일
export function startOfWeek(value) {
  const weekday = (parseDate(value).getDay() + 6) % 7;
  return addDays(value, -weekday);
}

export function getWeekday(value) {
  return parseDate(value).getDay();
}
