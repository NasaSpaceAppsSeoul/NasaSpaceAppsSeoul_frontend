import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { getMeta } from "../api/catalog";
import { keys } from "../api/keys";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 나라 하나의 `/meta` 요청. 바뀌지 않는 기준 자료라 한 번 받으면 버리지 않는다.
 * 직전 요청이 실패했으면(자동 재시도, "다시 시도" 버튼) `cache: "reload"`로 다시 묻는다.
 * 여러 나라를 한꺼번에 받는 곳(기법 페이지 표)도 이 설정을 써서 같은 캐시를 나눈다.
 */
export function metaQuery(country: Country) {
  return queryOptions({
    queryKey: keys.meta(country),
    queryFn: ({ signal, client, queryKey }) => getMeta(country, { signal, cache: cacheMode(client.getQueryState(queryKey)) }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** 나라의 `/meta`. 나라가 정해지기 전에는 부르지 않는다 */
export function useMeta(country: Country | undefined) {
  return useQuery(country ? metaQuery(country) : { queryKey: keys.meta(country), queryFn: skipToken });
}
