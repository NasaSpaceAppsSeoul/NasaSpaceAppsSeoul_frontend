import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { keys } from "../api/keys";
import { getLanding } from "../api/landing";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 나라 하나의 `/landing` 요청. 2025-12까지의 값만 담아 바뀌지 않으므로 한 번 받으면 버리지 않는다(스킬 `burnline-api` 표).
 * 여러 나라를 한꺼번에 받는 곳(기법 페이지 05 표)도 이 설정을 써서 같은 캐시를 나눈다.
 */
export function landingQuery(country: Country) {
  return queryOptions({
    queryKey: keys.landing(country),
    queryFn: ({ signal, client, queryKey }) => getLanding(country, { signal, cache: cacheMode(client.getQueryState(queryKey)) }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * 소개 화면의 `/landing`. 소개 화면의 두 구역이 같은 키로 부르므로 요청은 한 번이고,
 * 어느 구역에서 다시 시도해도 둘 다 새 값을 받는다.
 */
export function useLanding(country: Country | undefined) {
  return useQuery(country ? landingQuery(country) : { queryKey: keys.landing(country), queryFn: skipToken });
}
