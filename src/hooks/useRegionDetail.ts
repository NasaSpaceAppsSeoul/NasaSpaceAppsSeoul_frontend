import { skipToken, useQuery } from "@tanstack/react-query";
import { getRegionDetail } from "../api/catalog";
import { keys } from "../api/keys";
import type { Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/** 한 지역의 이웃과 위험 시기(`/regions/{id}`). 지역마다 다른 자료라 이전 지역의 값을 이어 보여 주지 않는다. */
export function useRegionDetail(country: Country | undefined, id: string | undefined) {
  return useQuery({
    queryKey: keys.regionDetail(country, id),
    queryFn:
      country && id
        ? ({ signal, client, queryKey }) =>
            getRegionDetail(country, id, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
        : skipToken,
  });
}
