import { get, withQuery, type GetOptions } from "./client";
import type { Country, MapResponse, TopResponse } from "./types";

/** `/map`의 범위. `parent`가 없으면 나라 전체(`decisions.md` 5-7). 시·군·구 ID를 주면 404다. */
export type MapParams = { parent?: string };

/** `/map?month=&parent=`: 시·군·구별 그 달 화재 칸·색 단계와 감지 점. 4,000개를 넘으면 점은 표본이다. */
export function getMap(country: Country, month: string, params: MapParams = {}, options?: GetOptions): Promise<MapResponse> {
  return get<MapResponse>(withQuery(`/${country}/map`, { month, parent: params.parent }), options);
}

/**
 * `/top?month=&parent=`: 시·도 ID면 그 시·도에서 평소보다 두드러진 3곳(그 지역의 같은 달 순위 → 값 순),
 * 시·군·구 ID면 맞닿은 지역 전부(값 순, 0칸 포함). `rank`는 목록 순번이 아니다(E-3).
 */
export function getTop(country: Country, month: string, parent: string, options?: GetOptions): Promise<TopResponse> {
  return get<TopResponse>(withQuery(`/${country}/top`, { month, parent }), options);
}
