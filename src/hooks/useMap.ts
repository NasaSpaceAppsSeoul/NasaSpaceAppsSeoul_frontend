import { skipToken, useQuery } from "@tanstack/react-query";
import { keys } from "../api/keys";
import { getMap, type MapParams } from "../api/spatial";
import type { Country, MapResponse } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 지도 값과 감지 점(`/map?month=`). 달이 바뀌면 새 값이 올 때까지 같은 나라·범위의 이전 달을 보여 준다
 * (`isPlaceholderData`이면 흐리게). 나라나 범위가 바뀌면 이전 지도를 보여 주지 않는다.
 */
export function useMap(country: Country | undefined, month: string | undefined, params: MapParams = {}) {
  return useQuery({
    queryKey: keys.map(country, month, params),
    queryFn:
      country && month
        ? ({ signal, client, queryKey }) =>
            getMap(country, month, params, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
        : skipToken,
    placeholderData: (previous: MapResponse | undefined, previousQuery) => {
      const previousKey = previousQuery?.queryKey;
      const same = previousKey !== undefined && previousKey[0] === country && previousKey[2].parent === (params.parent || null);
      return same ? previous : undefined;
    },
  });
}
