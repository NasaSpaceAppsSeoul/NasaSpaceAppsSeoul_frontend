import { skipToken, useQuery } from "@tanstack/react-query";
import { getInsight } from "../api/insight";
import { keys } from "../api/keys";
import type { Country, Insight } from "../api/types";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * 시·군·구의 월간 인사이트(`/insight/{id}?month=`). 셋 중 하나라도 없으면 요청하지 않는다.
 *
 * - 캐시 모드는 항상 `reload`. 일부 실패한 응답은 `ETag`가 정상 응답과 같아 `no-cache`로는 304와 깨진 본문이
 *   돌아온다(A-3). 쿼리가 지워진 뒤에는 "직전 응답이 일부 실패였는지"를 알 수 없으므로 조건 없이 둔다.
 *   `/insight`는 서버 캐시가 없어 304여도 서버가 본문을 다 만들기 때문에 잃는 것이 없다.
 * - `unavailable`이 있는 응답은 보관하지 않는다(1-2): 바로 낡은 것으로 보고 다시 그릴 때 새로 받는다.
 */
export function useInsight(country: Country | undefined, id: string | undefined, month: string | undefined) {
  return useQuery({
    queryKey: keys.insight(country, id, month),
    queryFn:
      country && id && month ? ({ signal }) => getInsight(country, id, month, { signal, cache: "reload" }) : skipToken,
    staleTime: (query) => (hasUnavailable(query.state.data) ? 0 : FIVE_MINUTES),
  });
}

function hasUnavailable(data: Insight | undefined): boolean {
  return data !== undefined && data.unavailable.length > 0;
}
