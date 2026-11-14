import { skipToken, useQuery } from "@tanstack/react-query";
import { keys } from "../api/keys";
import { getBaseline } from "../api/timeseries";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/** 지역의 평년·보통 해 범위·히트맵 색 경계(`/baseline/{id}`). 바뀌지 않는 기준 자료라 버리지 않는다. */
export function useBaseline(country: Country | undefined, id: string | undefined) {
  return useQuery({
    queryKey: keys.baseline(country, id),
    queryFn:
      country && id
        ? ({ signal, client, queryKey }) =>
            getBaseline(country, id, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
