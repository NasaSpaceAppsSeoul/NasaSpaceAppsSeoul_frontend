import { skipToken, useQuery } from "@tanstack/react-query";
import { getGeo } from "../api/catalog";
import { keys } from "../api/keys";
import type { Country, GeoParams } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 경계(`/geo`). 바뀌지 않는 기준 자료라 한 번 받으면 버리지 않는다. 달이 바뀌어도 다시 받지 않는다(E-2).
 * `country`가 없으면 요청하지 않는다.
 */
export function useGeo(country: Country | undefined, params: GeoParams = {}) {
  return useQuery({
    queryKey: keys.geo(country, params),
    queryFn: country
      ? ({ signal, client, queryKey }) =>
          getGeo(country, params, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
      : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
