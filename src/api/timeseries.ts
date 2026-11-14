import { get, withQuery, type GetOptions } from "./client";
import type { Country, Judgement, SeriesResponse } from "./types";

/** 시계열 범위. 둘 다 없으면 전체 기간(2001-01부터 마지막 달까지)이 온다. 값이 없으면 키를 뺀다. */
export type SeriesRange = { from?: string; to?: string };

/** `/series/{id}`: 달별 값·상태·관측 위성. 나라 ID로 부르면 그 나라의 달 범위가 된다. */
export function getSeries(
  country: Country,
  id: string,
  range: SeriesRange = {},
  options?: GetOptions,
): Promise<SeriesResponse> {
  return get<SeriesResponse>(
    withQuery(`/${country}/series/${encodeURIComponent(id)}`, { from: range.from, to: range.to }),
    options,
  );
}

/** `/judgement/{id}?month=`: 숫자 카드의 판정. 관측 위성(`source`)은 없으므로 나라 시계열에서 찾는다. */
export function getJudgement(country: Country, id: string, month: string, options?: GetOptions): Promise<Judgement> {
  return get<Judgement>(withQuery(`/${country}/judgement/${encodeURIComponent(id)}`, { month }), options);
}
