/** 쿼리 상태에서 이 판단에 쓰는 필드만. TanStack Query의 `QueryState`가 이 모양을 만족한다. */
export type FetchHistory = {
  fetchFailureCount: number;
  errorUpdatedAt: number;
  dataUpdatedAt: number;
};

/**
 * 요청에 쓸 브라우저 캐시 모드.
 * 직전 요청이 실패했으면 `reload`로 보내 깨진 응답이 304로 굳는 것을 피한다(`A-common.md` A-3).
 * 새 요청이 시작되면 `fetchFailureCount`는 0으로 돌아가므로, 마지막 실패가 마지막 성공보다 늦은지도 함께 본다.
 */
export function cacheMode(history: FetchHistory | undefined): RequestCache {
  if (history === undefined) return "no-cache";
  const failedLast = history.fetchFailureCount > 0 || history.errorUpdatedAt > history.dataUpdatedAt;
  return failedLast ? "reload" : "no-cache";
}
