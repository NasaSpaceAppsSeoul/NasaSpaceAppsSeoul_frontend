/*
 * 목 `/baseline/{id}` 응답. 판정과 같은 평년·범위 계산(`judge.ts`의 `monthStats`)을 다시 써서
 * `/judgement`의 `median`·`band_low`·`band_high`와 숫자가 어긋나지 않게 한다.
 *
 * 출처: 백엔드 `SeriesService.baseline`(자체 판정이 아니면 범위 `null`),
 * `TimeseriesLoader.heatBins`(전체 시계열의 0이 아닌 월값으로 50·75·90 퍼센타일, 선형 보간, 소수 한 자리,
 * 0이 아닌 값이 없으면 `[]`), 분석 D-2·D-6, 기대값 `spec_test.py`(KOR 3월 174.0, 95.6–294.8).
 *
 * 단순화한 점
 * - 평년·범위·비교 기간은 파이프라인 값 대신 목 판정 규칙(`judge.ts` 머리 주석)으로 계산한다.
 * - `heat_bins`는 생성기의 전체 월값(집계 중인 달·2026년·2012-02 전 추정값 포함)에서 계산한다(D-6 4번과 같음).
 */
import type { Country } from "../../lib/country";
import type { BaselineResponse } from "../types";
import { monthStats, percentile, profileOf } from "./judge";
import { regionValues } from "./series-gen";
import { findRegion } from "./series-route";
import type { CountryMock } from "./types";

const HEAT_QUANTILES = [0.5, 0.75, 0.9] as const;

const round1 = (value: number) => Math.round(value * 10) / 10;

/** 0이 아닌 값의 50·75·90 퍼센타일. 하나도 없으면 `[]`. */
export function heatBins(values: readonly (number | null)[]): number[] {
  const sorted = values.filter((v): v is number => v !== null && v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  return HEAT_QUANTILES.map((q) => round1(percentile(sorted, q)));
}

export function mockBaseline(country: Country, mock: CountryMock | undefined, id: string): BaselineResponse {
  const region = findRegion(country, mock, id);
  const profile = profileOf(country, region, mock?.regions ?? []);
  const stats = monthStats(country, profile);
  const by_month = Array.from({ length: 12 }, (_, i) => {
    const s = stats[i];
    return {
      month: i + 1,
      median: s?.median ?? null,
      band_low: profile.self ? (s?.bandLow ?? null) : null,
      band_high: profile.self ? (s?.bandHigh ?? null) : null,
    };
  });
  return {
    id: region.id,
    period: profile.period,
    by_month,
    heat_bins: heatBins(regionValues(country, region).values),
  };
}
