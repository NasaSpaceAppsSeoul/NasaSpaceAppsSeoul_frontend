import { skipToken, useQuery } from "@tanstack/react-query";
import { keys } from "../api/keys";
import { getBulkJudgement } from "../api/timeseries";
import type { BulkJudgement, Country } from "../api/types";
import { cacheMode } from "../lib/cacheMode";

/**
 * 지도 "평소 대비"의 일괄 판정(`/judgement?month=`). `enabled`가 아니면(화재 칸 보기) 요청하지 않는다.
 * 달이 바뀌면 새 값이 올 때까지 같은 나라의 이전 달을 보여 준다(`isPlaceholderData`이면 흐리게). 나라가 바뀌면 보여 주지 않는다.
 * 요청하지 않는 달(`enabled`가 아님)에는 이전 값도 주지 않는다(TanStack은 꺼진 쿼리에도 placeholder를 씌워 계속 "받는 중"이 된다).
 */
export function useBulkJudgement(country: Country | undefined, month: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: keys.bulkJudgement(country, month),
    queryFn:
      enabled && country && month
        ? ({ signal, client, queryKey }) =>
            getBulkJudgement(country, month, { signal, cache: cacheMode(client.getQueryState(queryKey)) })
        : skipToken,
    placeholderData: (previous: BulkJudgement | undefined, previousQuery) =>
      enabled && previousQuery?.queryKey[0] === country ? previous : undefined,
  });
}
