/*
 * 목 `/top?month=&parent=` (`reference/api/E-map-top.md` E-3·E-4, 백엔드 `SpatialService.top`).
 *
 * 백엔드 그대로인 것
 * - 검사 순서: 달 없음·형식(400) → 감지 점 달 범위(400 `MONTH_OUT_OF_RANGE`, `/map`과 같은 범위)
 *   → `parent`가 나라·시·도·시·군·구가 아니면 404 `REGION_NOT_FOUND`.
 * - `parent` 없음·나라 → 전체 시·군·구, 시·도 → 그 시·도의 시·군·구: 값 > 0만, `rank` 작은 순 → 값 큰 순, 3개.
 *   이름은 한국 "경북 의성군", CAL·BC는 이름만.
 * - `parent`가 시·군·구 → 맞닿은 지역 전부(자기 제외, 0칸 포함), 값 큰 순, 이름만("안동시").
 * - 값이 없는 달(시·군·구의 2012-02 전)은 행이 없어 빈 목록(`SpatialLoader.java:97-107`).
 * - `rank`는 그 지역의 같은 달 순위(값이 0이면 `null`), `n`은 비교한 해의 수.
 *
 * 값은 `/series`·`/judgement`·`/map`과 같은 생성기다(숫자 카드·히트맵·지도와 맞는다).
 * 동률 순서: 백엔드는 정해져 있지 않다(E-4 8). 목은 `/regions` 목록 순서로 고정한다.
 */
import type { Country } from "../../lib/country";
import { ApiError } from "../client";
import type { RegionSummary, TopItem, TopResponse } from "../types";
import { profileOf, seriesMonth } from "./judge";
import { checkSpatialMonth } from "./map-route";
import { monthIndex, regionValues } from "./series-gen";
import type { CountryMock } from "./types";

const TOP_COUNT = 3;

export function mockTop(country: Country, mock: CountryMock | undefined, query: URLSearchParams): TopResponse {
  const month = checkSpatialMonth(country, query.get("month"));
  const all = mock?.regions ?? [];
  const parent = query.get("parent");
  const parentRegion = parent === null ? undefined : all.find((r) => r.id === parent);
  // 빈 `parent=`와 모르는 ID는 404(백엔드 `childrenOf`). 프론트는 빈 값을 보내지 않는다
  if (parent !== null && parent !== country && parentRegion === undefined) {
    throw new ApiError(404, "REGION_NOT_FOUND", `region not found: ${country}/${parent}`);
  }
  const distView = parentRegion?.level === "dist";
  const single = mock?.meta.labels.single ?? true;

  const neighborIds = distView ? new Set(mock?.detail(parentRegion.id)?.neighbors ?? []) : null;
  const pool = all.filter(
    (r) =>
      r.level === "dist" &&
      (neighborIds !== null
        ? neighborIds.has(r.id) && r.id !== parentRegion?.id
        : parentRegion === undefined || parentRegion.level === "nat" || r.province === parentRegion.id),
  );

  const index = monthIndex(month);
  const items: TopItem[] = [];
  for (const region of pool) {
    const value = regionValues(country, region).values[index] ?? null;
    if (value === null || (!distView && value <= 0)) continue;
    const row = seriesMonth(country, profileOf(country, region, all), index);
    items.push({ id: region.id, label_ko: labelOf(region, single || distView), value, rank: value > 0 ? row.rank : null, n: row.n });
  }

  if (distView) items.sort((a, b) => b.value - a.value);
  else items.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.value - a.value);

  return {
    month,
    parent: parent ?? country,
    data_version: mock?.meta.data_version ?? "",
    items: distView ? items : items.slice(0, TOP_COUNT),
  };
}

function labelOf(region: RegionSummary, bare: boolean): string {
  return bare || region.province === null ? region.label_ko : `${region.province} ${region.label_ko}`;
}
