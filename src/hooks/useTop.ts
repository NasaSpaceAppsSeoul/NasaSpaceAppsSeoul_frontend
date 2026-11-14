import { skipToken, useQuery } from "@tanstack/react-query";
import { keys } from "../api/keys";
import { getTop } from "../api/spatial";
import type { Country, TopResponse } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 목록(`/top?month=&parent=`). 달이 바뀌면 새 값이 올 때까지 같은 `parent`의 이전 달을 보여 준다
 * (`isPlaceholderData`이면 흐리게). `parent`가 바뀌면 이전 목록을 보여 주지 않는다.
 */
export function useTop(country: Country | undefined, month: string | undefined, parent: string | undefined) {
  return useQuery({
    queryKey: keys.top(country, month, parent),
    queryFn:
      country && month && parent
        ? ({ signal, client, queryKey }) =>
            getTop(country, month, parent, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
        : skipToken,
    placeholderData: (previous: TopResponse | undefined, previousQuery) => {
      const previousKey = previousQuery?.queryKey;
      const same = previousKey !== undefined && previousKey[0] === country && previousKey[2].parent === (parent || null);
      return same ? previous : undefined;
    },
  });
}
