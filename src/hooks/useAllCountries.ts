import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import type { Country, Landing, Meta, RegionsResponse } from "../api/types";
import { COUNTRIES } from "../lib/country";
import { landingQuery } from "./useLanding";
import { metaQuery } from "./useMeta";
import { regionsQuery } from "./useRegions";

export type CountryQueries<T> = Record<Country, UseQueryResult<T>>;

/** 실패한 요청들: 첫 에러(문구 종류용)와 모두 다시 묻는 함수. 실패가 없거나 다시 묻는 중이면 `null` */
export type FailedQueries = { error: unknown; retry: () => void } | null;

function byCountry<T>(results: UseQueryResult<T>[]): CountryQueries<T> {
  return Object.fromEntries(COUNTRIES.map((c, i) => [c, results[i]])) as CountryQueries<T>;
}

/** 다시 묻는 중인 요청이 있으면 에러 상자를 내리고(누른 것이 받아들여졌음을 보인다) 칸은 "…"로 둔다 */
export function failedOf(queries: readonly UseQueryResult<unknown>[]): FailedQueries {
  const failed = queries.filter((q) => q.isError && !q.isFetching);
  const first = failed[0];
  if (first === undefined) return null;
  return { error: first.error, retry: () => failed.forEach((q) => void q.refetch()) };
}

/*
 * 기법 페이지 03·04·05 표의 원천 (9장 3차). 대시보드·소개·기법 그림과 같은 키라 이미 받은 나라는 다시 묻지 않는다.
 * 03·04는 `/meta`만, 05는 `/landing`(`break_test.jump_raw`)도 쓴다.
 */

/** 여섯 지역의 `/meta`(`method_stats`·`validation`) */
export function useAllMeta() {
  const list = useQueries({ queries: COUNTRIES.map((c) => metaQuery(c)) });
  return { byCountry: byCountry<Meta>(list), list };
}

/** 여섯 지역의 `/landing` */
export function useAllLanding() {
  const list = useQueries({ queries: COUNTRIES.map((c) => landingQuery(c)) });
  return { byCountry: byCountry<Landing>(list), list };
}

/** 여섯 지역의 `/regions`. `enabled`가 거짓이면 묻지 않는다(첫 화면 검색 대화상자가 "전체" 칩으로 열려 있는 동안만 묻는다, 입력 전에도) */
export function useAllRegions(enabled: boolean) {
  const list = useQueries({ queries: COUNTRIES.map((c) => ({ ...regionsQuery(c), enabled })) });
  return { byCountry: byCountry<RegionsResponse>(list), list };
}
