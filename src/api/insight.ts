import { get, withQuery, type GetOptions } from "./client";
import type { Country, Insight } from "./types";

/** `/insight`는 내부 호출이 많아 느릴 수 있다(G-7 8). 제한 시간을 20초로 둔다(스킬 `burnline-api`). */
export const INSIGHT_TIMEOUT_MS = 20_000;

/** `/insight/{id}?month=`: 시·군·구의 월간 인사이트. 일부가 실패해도 200이고 `unavailable`에 이름이 온다. */
export function getInsight(country: Country, id: string, month: string, options?: GetOptions): Promise<Insight> {
  return get<Insight>(withQuery(`/${country}/insight/${encodeURIComponent(id)}`, { month }), {
    timeoutMs: INSIGHT_TIMEOUT_MS,
    ...options,
  });
}
