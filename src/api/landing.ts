import { get, type GetOptions } from "./client";
import type { Country, Landing } from "./types";

/**
 * `/landing`: 소개 화면의 숫자. 하나라도 실패하면 전체가 503이다(부분 응답 없음, `H-landing.md` H-6).
 * insight 서비스 쪽 경로라 `catalog.ts`·`timeseries.ts`와 나눈다.
 */
export function getLanding(country: Country, options?: GetOptions): Promise<Landing> {
  return get<Landing>(`/${country}/landing`, options);
}
