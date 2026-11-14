import { skipToken, useQuery } from "@tanstack/react-query";
import { getMeta } from "../api/catalog";
import { keys } from "../api/keys";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 나라의 `/meta`. 바뀌지 않는 기준 자료라 한 번 받으면 버리지 않는다.
 * 직전 요청이 실패했으면(자동 재시도, "다시 시도" 버튼) `cache: "reload"`로 다시 묻는다.
 */
export function useMeta(country: Country | undefined) {
  return useQuery({
    queryKey: keys.meta(country),
    queryFn: country
      ? ({ signal, client, queryKey }) =>
          getMeta(country, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
      : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
