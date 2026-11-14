import type { MapParams } from "./spatial";
import type { SeriesRange } from "./timeseries";
import type { Country, GeoParams } from "./types";

/**
 * 쿼리 키는 이 파일에서만 만든다. 나라를 맨 앞에 두고, 파라미터를 빠짐없이 넣는다.
 * 값이 없는 파라미터는 `null`로 맞춰 `{}`와 `{ parent: undefined }`가 같은 키가 되게 한다.
 */
export const keys = {
  meta: (country: Country | undefined) => [country, "meta"] as const,
  regions: (country: Country | undefined) => [country, "regions"] as const,
  landing: (country: Country | undefined) => [country, "landing"] as const,
  /** `level`의 기본값(`dist`)을 채워 `{}`와 `{ level: "dist" }`가 같은 응답을 두 번 받지 않게 한다. */
  geo: (country: Country | undefined, { level = "dist", parent }: GeoParams = {}) =>
    [country, "geo", { level, parent: parent || null }] as const,
  /** 범위가 없으면 `null`로 맞춰 `{}`와 `{ from: undefined }`가 같은 키가 되게 한다. */
  series: (country: Country | undefined, id: string | undefined, { from, to }: SeriesRange = {}) =>
    [country, "series", id, { from: from || null, to: to || null }] as const,
  judgement: (country: Country | undefined, id: string | undefined, month: string | undefined) =>
    [country, "judgement", id, { month }] as const,
  baseline: (country: Country | undefined, id: string | undefined) => [country, "baseline", id] as const,
  /** `parent`가 없으면 `null`로 맞춘다(지금은 늘 나라 전체, 5-7). */
  map: (country: Country | undefined, month: string | undefined, { parent }: MapParams = {}) =>
    [country, "map", { month, parent: parent || null }] as const,
};
