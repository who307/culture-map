export function getTodayDate() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
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