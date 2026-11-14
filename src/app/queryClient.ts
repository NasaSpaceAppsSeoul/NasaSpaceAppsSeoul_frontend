import { QueryClient } from "@tanstack/react-query";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * 서버 데이터 기본값. 바뀌지 않는 기준 자료는 훅에서 `staleTime: Infinity`로 덮어쓴다.
 * 재시도 규칙(4xx는 0번, 5xx·시간 초과·네트워크는 1번)은 `ApiError`가 생기는 API 계층 작업에서 넣는다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      refetchOnWindowFocus: false,
    },
  },
});
