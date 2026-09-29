export function getTodayDate() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function isEventOnDate(item, date) {
  return item.startDate <= date && item.endDate >= date;
}