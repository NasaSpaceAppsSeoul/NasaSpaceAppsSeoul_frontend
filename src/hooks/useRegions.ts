import { skipToken, useQuery } from "@tanstack/react-query";
import { getRegions } from "../api/catalog";
import { keys } from "../api/keys";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/** 나라의 모든 지역(`/regions`). 바뀌지 않는 기준 자료라 한 번 받으면 버리지 않는다. `country`가 없으면 요청하지 않는다. */
export function useRegions(country: Country | undefined) {
  return useQuery({
    queryKey: keys.regions(country),
    queryFn: country
      ? ({ signal, client, queryKey }) =>
          getRegions(country, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
      : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
