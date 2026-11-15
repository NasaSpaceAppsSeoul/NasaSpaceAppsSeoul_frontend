import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { getRegions } from "../api/catalog";
import { keys } from "../api/keys";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/** 나라 하나의 `/regions` 요청. 여러 나라를 한꺼번에 받는 곳(첫 화면 검색 "전체")도 이 설정을 써서 같은 캐시를 나눈다 */
export function regionsQuery(country: Country) {
  return queryOptions({
    queryKey: keys.regions(country),
    queryFn: ({ signal, client, queryKey }) => getRegions(country, { signal, cache: cacheMode(client.getQueryState(queryKey)) }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** 나라의 모든 지역(`/regions`). 바뀌지 않는 기준 자료라 한 번 받으면 버리지 않는다. `country`가 없으면 요청하지 않는다. */
export function useRegions(country: Country | undefined) {
  return useQuery(country ? regionsQuery(country) : { queryKey: keys.regions(country), queryFn: skipToken });
}
