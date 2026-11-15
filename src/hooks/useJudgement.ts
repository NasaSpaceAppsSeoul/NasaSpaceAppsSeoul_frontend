import { skipToken, useQuery } from "@tanstack/react-query";
import { keys } from "../api/keys";
import { getJudgement } from "../api/timeseries";
import type { Country, Judgement } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 숫자 카드의 판정(`/judgement/{id}?month=`). 셋 중 하나라도 없으면 요청하지 않는다.
 * 같은 지역에서 달만 바뀔 때는 새 값이 올 때까지 이전 값을 보여 준다(`isPlaceholderData`이면 흐리게).
 * 지역이나 나라가 바뀌면 이전 지역의 숫자를 보여 주지 않는다.
 */
export function useJudgement(country: Country | undefined, id: string | undefined, month: string | undefined) {
  return useQuery({
    queryKey: keys.judgement(country, id, month),
    queryFn:
      country && id && month
        ? ({ signal, client, queryKey }) =>
            getJudgement(country, id, month, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
        : skipToken,
    placeholderData: (previous: Judgement | undefined, previousQuery) => {
      const previousKey = previousQuery?.queryKey;
      const sameRegion = previousKey !== undefined && previousKey[0] === country && previousKey[2] === id;
      return sameRegion ? previous : undefined;
    },
  });
}
