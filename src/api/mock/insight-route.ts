/*
 * 목 `/insight/{id}?month=` (`decisions.md` 10-5).
 *
 * 검사 순서는 백엔드 `/insight`와 같다(`/series`·`/judgement`와 다르다):
 * 달 형식(400 `INVALID_PARAM`, `InsightController.java:46`) → 지역(404 `REGION_NOT_FOUND`)
 * → 시·군·구가 아니면 400 `INVALID_PARAM`(`InsightService.java:56-59`) → 달 범위(400 `MONTH_OUT_OF_RANGE`).
 *
 * 출처: 판정·시계열 쪽은 `judge.ts`·`series-gen.ts`(그래서 `/judgement`·`/series`와 같은 값),
 * 감지 점 쪽은 `insight-spatial.ts`. 백엔드 규칙: 2026년 달은 `strip`·`top_years`가 2025년까지(G-7 1),
 * 드문 지역의 `head.rank`·`n`은 자기 시계열 순위(2026년 달은 `null`), 시·도와 빌린 지역이 같으면 `prov`는 `ref`와 같다.
 * 의성군 2025-03은 백엔드 `api-test/spec_test.py` 673~711줄 기대값으로 덮는다.
 *
 * 지어낸 값
 * - `annual`·`annual_all`·`longterm`·`risk_months`(비중 큰 달부터 합이 절반을 넘을 때까지). 이웃 목록은 `/regions/{id}` 목과 같은 원천(`mock.detail`).
 * - 일부 실패 경우(10-5): 의성군 2024-03은 `spatial`, 의성군 2023-03은 `series`가 실패한 응답.
 * - 의성군 2025-03의 두 번째 공식 기록(면적 0)과 감지율, `daily`의 날짜별 나눔(합 384, 26일 108칸).
 */
import type { Country } from "../../lib/country";
import { ApiError } from "../client";
import type { Insight, InsightProv, JudgementRef, RegionSummary } from "../types";
import { judgement, profileOf } from "./judge";
import { spatialFor, type Spatial } from "./insight-spatial";
import { FIRST_MONTH, monthIndex, regionValues, timeline, VIIRS_START } from "./series-gen";
import { UISEONG } from "./series-overrides";
import type { CountryMock } from "./types";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const STRIP_LAST_YEAR = 2025;

const round1 = (value: number) => Math.round(value * 10) / 10;

type StripRow = { year: number; v: number };

/** 2012~2025년의 같은 달 값(값이 없는 해는 뺀다. 1월은 2013년부터) */
function stripOf(country: Country, region: RegionSummary, monthOfYear: number): StripRow[] {
  const { months, values } = regionValues(country, region);
  const rows: StripRow[] = [];
  months.forEach((month, i) => {
    const year = Number(month.slice(0, 4));
    const value = values[i];
    if (year < 2012 || year > STRIP_LAST_YEAR || Number(month.slice(5, 7)) !== monthOfYear) return;
    if (value !== null && value !== undefined) rows.push({ year, v: value });
  });
  return rows;
}

/** 백엔드 `topYears`: 값 큰 순(같으면 최근 해 먼저) 5개 + 선택한 해. 순위는 더 큰 값의 수 + 1 */
function topYears(strip: StripRow[], year: number): Insight["rank"]["top_years"] {
  const ranked = strip.map((row) => ({
    ...row,
    rank: 1 + strip.filter((other) => other.v > row.v).length,
    tied: strip.filter((other) => other.v === row.v).length > 1,
  }));
  const sorted = [...ranked].sort((a, b) => b.v - a.v || b.year - a.year);
  const top = sorted.slice(0, 5);
  const selected = sorted.find((row) => row.year === year);
  return selected !== undefined && !top.includes(selected) ? [...top, selected] : top;
}

/** 달별 합계(1~12월). `from` 달부터 2025-12까지. `/regions/{id}` 목의 위험 시기도 쓴다 */
export function monthTotals(country: Country, region: RegionSummary, from: string): number[] {
  const { months, values } = regionValues(country, region);
  const totals = Array.from({ length: 12 }, () => 0);
  months.forEach((month, i) => {
    const value = values[i];
    if (month < from || Number(month.slice(0, 4)) > STRIP_LAST_YEAR || value === null || value === undefined) return;
    totals[Number(month.slice(5, 7)) - 1] = round1((totals[Number(month.slice(5, 7)) - 1] ?? 0) + value);
  });
  return totals;
}

/** 비중 큰 달부터 더해 절반을 넘을 때까지의 달(오름차순)과 그 비중 */
export function riskOf(totals: readonly number[]): { months: number[]; share: number | null } {
  const sum = totals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return { months: [], share: null };
  const order = totals.map((v, i) => ({ month: i + 1, v })).sort((a, b) => b.v - a.v);
  const picked: number[] = [];
  let acc = 0;
  for (const { month, v } of order) {
    picked.push(month);
    acc += v;
    if (acc / sum >= 0.5) break;
  }
  return { months: picked.sort((a, b) => a - b), share: Math.round((acc / sum) * 100) / 100 };
}

function annualOf(strip: StripRow[], country: Country, region: RegionSummary): { annual: number | null; all: number | null } {
  const { months, values } = regionValues(country, region);
  const byYear = new Map<number, number>();
  months.forEach((month, i) => {
    const year = Number(month.slice(0, 4));
    const value = values[i];
    if (year < 2012 || year > STRIP_LAST_YEAR || value === null || value === undefined) return;
    byYear.set(year, (byYear.get(year) ?? 0) + value);
  });
  const sums = [...byYear.values()];
  if (sums.length === 0 || strip.length === 0) return { annual: null, all: null };
  const total = sums.reduce((a, b) => a + b, 0);
  const max = Math.max(...sums);
  return {
    all: round1(total / sums.length),
    annual: sums.length > 1 ? round1((total - max) / (sums.length - 1)) : round1(total),
  };
}

/**
 * 이웃은 `/regions/{id}`와 같은 원천(`mock.detail`, 한국은 파이프라인 이웃, 5장).
 * 백엔드 정렬 그대로: 값 큰 순인데 `null`이 0칸보다 앞에 온다(G-7 9)
 */
function neighborsOf(
  country: Country,
  mock: CountryMock | undefined,
  region: RegionSummary,
  all: readonly RegionSummary[],
  index: number,
): Insight["neighbors"] {
  const ids = new Set(mock?.detail(region.id)?.neighbors ?? []);
  const touching = all.filter((r) => r.level === "dist" && ids.has(r.id));
  const key = (v: number | null) => (v === null ? -0.5 : v);
  return touching
    .map((r) => {
      const j = judgement(country, r, all, index);
      return { id: r.id, label_ko: r.label_ko, province: r.province, region_type: r.region_type, v: j.value, rank: j.rank, n: j.n };
    })
    .sort((a, b) => key(b.v) - key(a.v));
}

function provOf(country: Country, region: RegionSummary, all: readonly RegionSummary[], index: number): InsightProv | null {
  if (country !== "KOR" || region.province === null) return null;
  const province = all.find((r) => r.level === "prov" && r.id === region.province);
  if (province === undefined) return null;
  const j = judgement(country, province, all, index);
  const basis = profileOf(country, province, all).basis;
  return { id: province.id, label_ko: province.label_ko, value: j.value, chip: j.chip, rank: j.rank, n: j.n, ratio_to_median: j.ratio_to_median, basis };
}

function checkMonth(month: string | null): string {
  if (month === null || month === "" || !MONTH.test(month)) {
    throw new ApiError(400, "INVALID_PARAM", `month: expected YYYY-MM, got '${month ?? ""}'`);
  }
  return month;
}

/** 의성군 2025-03: 백엔드 기대값(`spec_test.py`)으로 덮는다 */
function uiseong202503(spatial: Spatial): Spatial {
  const daily = { "22": 12, "23": 40, "24": 66, "25": 95, "26": 108, "27": 45, "28": 18 };
  return {
    ...spatial,
    calendar: {
      daily,
      main_cluster: {
        start: "2025-03-22",
        end: "2025-03-29",
        days: 8,
        cells: 919,
        peak_cells: 551,
        peak_date: "2025-03-26",
        regions: [
          { id: UISEONG, label_ko: "의성군" },
          { id: "91817680B16014600177045", label_ko: "안동시" },
        ],
      },
      clusters: { fire_days: 7, peak_day_cells: 108, events: 3, big_events: 1 },
      near50: { n: 330, first: 21 },
    },
    official: [
      { date: "2025-03-22", place: "경북 의성 안계", cause: "농산폐기물 태우기", area_ha: 52707.3, region_id: UISEONG },
      { date: "2025-03-25", place: "경북 의성 단촌", cause: "원인 미상", area_ha: 0, region_id: UISEONG },
    ],
    detect_rate: { n: 41, detected: 17, rate: 0.41, since: "2018-04", window_days: 2 },
    fire_days: 7,
    dmax: 108,
    dmax_date: "2025-03-26",
  };
}

export function mockInsight(country: Country, mock: CountryMock | undefined, id: string, query: URLSearchParams): Insight {
  const month = checkMonth(query.get("month"));
  const region = mock?.regions.find((r) => r.id === id);
  if (region === undefined) throw new ApiError(404, "REGION_NOT_FOUND", `region not found: ${country}/${id}`);
  if (region.level !== "dist") throw new ApiError(400, "INVALID_PARAM", `insight is for districts only: ${id}`);
  const { last } = timeline(country);
  if (month < FIRST_MONTH || month > last) {
    throw new ApiError(400, "MONTH_OUT_OF_RANGE", `month '${month}' is outside ${FIRST_MONTH}..${last}`);
  }

  const all = mock?.regions ?? [];
  const index = monthIndex(month);
  const year = Number(month.slice(0, 4));
  const monthOfYear = Number(month.slice(5, 7));
  const profile = profileOf(country, region, all);
  const j = judgement(country, region, all, index);
  const strip = stripOf(country, region, monthOfYear);
  const own = strip.find((row) => row.year === year);
  const neighbors = neighborsOf(country, mock, region, all, index);
  const isUiseong202503 = country === "KOR" && region.id === UISEONG && month === "2025-03";
  const baseSpatial = spatialFor(country, region, month, j.value, all.find((r) => r.id === neighbors[0]?.id) ?? null);
  const spatial = isUiseong202503 ? uiseong202503(baseSpatial) : baseSpatial;
  const refRegion = profile.refId === null ? undefined : all.find((r) => r.id === profile.refId);
  const refBasis = refRegion === undefined ? null : profileOf(country, refRegion, all).basis;
  const ownTotals = monthTotals(country, region, VIIRS_START);
  const refTotals = refRegion === undefined ? null : monthTotals(country, refRegion, refBasis === "harmonized_25y" ? FIRST_MONTH : VIIRS_START);
  // 백엔드는 위험 시기를 `/regions/{id}`와 같은 카탈로그 값에서 가져온다(`InsightService.java:131-132`).
  // 원천(한국 파이프라인)에 있으면 그 값(소수 둘째 자리), 없으면(CAL·BC) 지어낸 값
  const sourced = mock?.detail(region.id)?.risk;
  const risk = sourced
    ? { months: [...sourced.months], share: sourced.share === null ? null : Math.round(sourced.share * 100) / 100 }
    : riskOf(refTotals ?? ownTotals);
  const annual = annualOf(strip, country, region);
  const ref: JudgementRef | null = j.ref;
  const prov = ref !== null && ref.id === region.province ? { ...ref } : provOf(country, region, all, index);
  // 드문 지역은 판정 순위가 없어 자기 시계열 순위로 채운다(2026년 달은 `strip`에 없어 `null`)
  const ownRank = own === undefined ? null : 1 + strip.filter((row) => row.v > own.v).length;
  const rank = j.rank ?? (j.value === null ? null : ownRank);
  const n = j.rank !== null ? j.n : rank === null ? null : strip.length;

  const response: Insight = {
    id: region.id,
    country,
    month,
    label_ko: region.label_ko,
    province: region.province,
    data_version: mock?.meta.data_version ?? null,
    head: {
      value: j.value,
      chip: j.chip,
      region_type: region.region_type,
      judge_unit: profile.judgeUnit,
      rank,
      n,
      reason: j.reason,
      fire_days: spatial.fire_days,
      dmax: spatial.dmax,
      dmax_date: spatial.dmax_date,
      annual: annual.annual,
      annual_all: annual.all,
    },
    prov,
    ref,
    calendar: spatial.calendar,
    years: {
      strip,
      median: j.median,
      band_low: j.band_low,
      band_high: j.band_high,
      yrs_fire: strip.filter((row) => row.v > 0).length,
      longterm:
        annual.all === null
          ? null
          : { fire_cells_2001_2025: round1(strip.reduce((a, row) => a + row.v, 0)), annual_avg: annual.all, quality: "high" },
    },
    rank: { top_years: topYears(strip, year) },
    season: {
      own_mt: ownTotals,
      ref_mt: refTotals,
      ref_id: profile.refId,
      risk_months: risk.months,
      risk_share: risk.share,
      risk_from: profile.judgeUnit,
    },
    official: spatial.official,
    detect_rate: spatial.detect_rate,
    map: spatial.map,
    neighbors,
    unavailable: [],
  };

  if (isUiseong202503) return uiseongExpected(response);
  if (country === "KOR" && region.id === UISEONG && month === "2024-03") return spatialFailed(response);
  if (country === "KOR" && region.id === UISEONG && month === "2023-03") return seriesFailed(response);
  return response;
}

function uiseongExpected(r: Insight): Insight {
  return {
    ...r,
    head: { ...r.head, annual: 2.6, annual_all: 30.0, rank: 1, n: 14 },
    years: { ...r.years, yrs_fire: 3, longterm: { fire_cells_2001_2025: 477.3, annual_avg: 19.1, quality: "high" } },
    season: { ...r.season, risk_months: [3], risk_from: "province" },
  };
}

/** spatial 실패: 감지 점 쪽 필드가 모두 `null`(G-2 표) */
function spatialFailed(r: Insight): Insight {
  return {
    ...r,
    data_version: null,
    head: { ...r.head, fire_days: null, dmax: null, dmax_date: null, annual: null, annual_all: null },
    calendar: null,
    years: { ...r.years, yrs_fire: null, longterm: null },
    official: null,
    detect_rate: null,
    map: null,
    unavailable: ["spatial"],
  };
}

/** series 실패: 자기 시계열 쪽 필드가 `null`. 드문 지역이라 `head.rank`·`n`도 `null`(G-2 표) */
function seriesFailed(r: Insight): Insight {
  return {
    ...r,
    head: { ...r.head, rank: null, n: null },
    years: { ...r.years, strip: null },
    rank: { top_years: null },
    season: { ...r.season, own_mt: null },
    unavailable: ["series"],
  };
}
