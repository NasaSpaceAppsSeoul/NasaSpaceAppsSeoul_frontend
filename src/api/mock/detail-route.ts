/*
 * 목 `/regions/{id}` (`reference/api/B-catalog.md` B-3, 5장).
 *
 * 백엔드 그대로인 것 (`CatalogService.region`, `CatalogLoader`)
 * - 모르는 ID → 404 `REGION_NOT_FOUND`.
 * - `neighbors`는 같은 단계의 이웃 `{id, label_ko}`이고, **다른 시·도의 이웃에만 `province` 키가 붙는다**
 *   (`CatalogService.java:131-133`). 시·도의 이웃은 시·도 ID, 나라는 빈 배열. 순서는 `/regions` 목록 순서.
 * - `judge_unit`·`ref_province`·`basis`는 `judge.ts` `profileOf`(숫자 카드와 같은 규칙).
 *
 * 출처: 한국 이웃·위험 시기는 파이프라인(`kor.ts`의 `detail`). CAL·BC 이웃은 임시 격자(`grid.ts`),
 * 위험 시기는 지어낸 값(시계열 달별 합에서 비중 큰 달부터 절반을 넘을 때까지, `insight-route.ts` `riskOf`).
 */
import type { Country } from "../../lib/country";
import { ApiError } from "../client";
import type { RegionDetail, RegionSummary } from "../types";
import { monthTotals, riskOf } from "./insight-route";
import { profileOf } from "./judge";
import { FIRST_MONTH, VIIRS_START } from "./series-gen";
import type { CountryMock } from "./types";

type Risk = { months: readonly number[]; share: number | null; from: RegionDetail["risk_from"] };

/** 빌린 판정이면 그 지역의 달별 합으로(백엔드 `risk_from`과 같은 뜻) */
function generatedRisk(country: Country, region: RegionSummary, all: readonly RegionSummary[]): Risk {
  const profile = profileOf(country, region, all);
  const ref = profile.refId === null ? undefined : all.find((r) => r.id === profile.refId);
  const source = ref ?? region;
  const from = profileOf(country, source, all).basis === "harmonized_25y" ? FIRST_MONTH : VIIRS_START;
  const risk = riskOf(monthTotals(country, source, from));
  return { months: risk.months, share: risk.share, from: profile.judgeUnit };
}

export function mockRegionDetail(country: Country, mock: CountryMock | undefined, id: string): RegionDetail {
  const all = mock?.regions ?? [];
  const region = all.find((r) => r.id === id);
  if (region === undefined || mock === undefined) throw new ApiError(404, "REGION_NOT_FOUND", `region not found: ${country}/${id}`);

  const source = mock.detail(id);
  const wanted = new Set(source?.neighbors ?? []);
  const neighbors = all
    .filter((r) => r.level === region.level && r.id !== region.id && wanted.has(r.id))
    .map((n): RegionDetail["neighbors"][number] =>
      n.province !== null && n.province !== region.province
        ? { id: n.id, label_ko: n.label_ko, province: n.province }
        : { id: n.id, label_ko: n.label_ko },
    );
  const profile = profileOf(country, region, all);
  // 원천에 재료가 없는 지역(한국 영광군)은 이웃·위험 시기 없이
  const risk: Risk = source?.risk ?? (source === undefined ? { months: [], share: null, from: profile.judgeUnit } : generatedRisk(country, region, all));

  return {
    ...region,
    neighbors,
    judge_unit: profile.judgeUnit,
    ref_province: profile.refId,
    basis: profile.basis,
    risk_months: [...risk.months],
    // 백엔드는 소수 둘째 자리로 반올림해 보낸다(`CatalogService.java:142` `round2`). 원천 값은 세 자리일 수 있다
    risk_share: risk.share === null ? null : Math.round(risk.share * 100) / 100,
    risk_from: risk.from,
  };
}
