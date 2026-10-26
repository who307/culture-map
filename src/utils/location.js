// 위도·경도가 모두 숫자로 들어 있는지 확인 (null/undefined/빈 값 제외)
export function hasCoordinates(item) {
  return item.latitude !== null
    && item.latitude !== undefined
    && item.longitude !== null
    && item.longitude !== undefined
    && Number.isFinite(Number(item.latitude))
    && Number.isFinite(Number(item.longitude));
}
