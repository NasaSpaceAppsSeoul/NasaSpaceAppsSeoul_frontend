import { get, withQuery, type GetOptions } from "./client";
import type { Country, MapResponse } from "./types";

/** `/map`의 범위. `parent`가 없으면 나라 전체(`decisions.md` 5-7). 시·군·구 ID를 주면 404다. */
export type MapParams = { parent?: string };

/** `/map?month=&parent=`: 시·군·구별 그 달 화재 칸·색 단계와 감지 점. 4,000개를 넘으면 점은 표본이다. */
export function getMap(country: Country, month: string, params: MapParams = {}, options?: GetOptions): Promise<MapResponse> {
  return get<MapResponse>(withQuery(`/${country}/map`, { month, parent: params.parent }), options);
}
