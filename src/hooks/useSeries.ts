import { skipToken, useQuery } from "@tanstack/react-query";
import { keys } from "../api/keys";
import { getSeries, type SeriesRange } from "../api/timeseries";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 지역의 시계열(`/series/{id}`). 나라 ID로 부르면 그 나라의 달 범위와 달별 관측 위성이 된다.
 * `country`나 `id`가 없으면 요청하지 않는다.
 */
export function useSeries(country: Country | undefined, id: string | undefined, range: SeriesRange = {}) {
  return useQuery({
    queryKey: keys.series(country, id, range),
    queryFn:
      country && id
        ? ({ signal, client, queryKey }) =>
            getSeries(country, id, range, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
        : skipToken,
  });
}
