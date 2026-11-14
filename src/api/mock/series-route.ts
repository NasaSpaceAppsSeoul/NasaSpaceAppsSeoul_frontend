/*
 * 목 `/series/{id}?from=&to=`와 `/judgement/{id}?month=`의 파라미터 검사와 응답.
 * 검사 순서는 백엔드와 같다(`SeriesService.series`, `JudgeService.judge`, `Months.check`, `Params.monthRange`):
 * 지역(404 `REGION_NOT_FOUND`) → 달 형식·`from > to`(400 `INVALID_PARAM`) → 달 범위(400 `MONTH_OUT_OF_RANGE`).
 * 달 범위는 나라마다 2001-01~2026-11(지어낸 값, `series-gen.ts`).
 */
import type { Country } from "../../lib/country";
import { ApiError } from "../client";
import type { Judgement, RegionSummary, SeriesMonth, SeriesResponse } from "../types";
import { judgement, profileOf, seriesMonth } from "./judge";
import { FIRST_MONTH, monthIndex, timeline } from "./series-gen";
import type { CountryMock } from "./types";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function findRegion(country: Country, mock: CountryMock | undefined, id: string): RegionSummary {
  const region = mock?.regions.find((r) => r.id === id);
  if (region === undefined) throw new ApiError(404, "REGION_NOT_FOUND", `region not found: ${country}/${id}`);
  return region;
}

/** `null`은 선택 파라미터라 통과. 빈 값이나 형식이 틀리면 400. */
function checkFormat(value: string | null, name: string): void {
  if (value !== null && !MONTH.test(value)) {
    throw new ApiError(400, "INVALID_PARAM", `${name}: expected YYYY-MM, got '${value}'`);
  }
}

function checkRange(country: Country, value: string | null): void {
  const { last } = timeline(country);
  if (value !== null && (value < FIRST_MONTH || value > last)) {
    throw new ApiError(400, "MONTH_OUT_OF_RANGE", `month '${value}' is outside ${FIRST_MONTH}..${last}`);
  }
}

export function mockSeries(
  country: Country,
  mock: CountryMock | undefined,
  id: string,
  query: URLSearchParams,
): SeriesResponse {
  const region = findRegion(country, mock, id);
  const from = query.get("from");
  const to = query.get("to");
  checkFormat(from, "from");
  checkFormat(to, "to");
  if (from !== null && to !== null && from > to) {
    throw new ApiError(400, "INVALID_PARAM", `from must not be after to: from=${from}, to=${to}`);
  }
  checkRange(country, from);
  checkRange(country, to);

  const profile = profileOf(country, region, mock?.regions ?? []);
  const start = from === null ? 0 : monthIndex(from);
  const end = monthIndex(to ?? timeline(country).last);
  const months: SeriesMonth[] = [];
  for (let i = start; i <= end; i += 1) months.push(seriesMonth(country, profile, i));
  return { id: region.id, level: region.level, months };
}

export function mockJudgement(
  country: Country,
  mock: CountryMock | undefined,
  id: string,
  query: URLSearchParams,
): Judgement {
  const region = findRegion(country, mock, id);
  const month = query.get("month");
  if (month === null || month === "") throw new ApiError(400, "INVALID_PARAM", "month is required");
  checkFormat(month, "month");
  checkRange(country, month);
  return judgement(country, region, mock?.regions ?? [], monthIndex(month));
}
