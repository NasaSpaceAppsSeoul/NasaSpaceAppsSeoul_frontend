import { QueryClient } from "@tanstack/react-query";
import { isRetryable } from "../api/client";

const FIVE_MINUTES = 5 * 60 * 1000;

/** 5xx·시간 초과·네트워크는 1번만 다시 시도하고, 4xx와 응답 형식 오류는 다시 시도하지 않는다. */
export function retry(failureCount: number, error: unknown): boolean {
  return isRetryable(error) && failureCount < 1;
}

/** 서버 데이터 기본값. 바뀌지 않는 기준 자료는 훅에서 `staleTime: Infinity`로 덮어쓴다. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        refetchOnWindowFocus: false,
        retry,
      },
    },
  });
}

export const queryClient = createQueryClient();
