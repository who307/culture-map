"use client";

import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

// 페이지가 빌드 때 미리 만들어지므로, 오늘 날짜에 따라 달라지는 화면은 브라우저에서만 그려야 함
// (suppressHydrationWarning은 경고만 끄고 빌드 시점 글자를 그대로 남기기 때문에 쓰지 않음)
export function useIsClient() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}
