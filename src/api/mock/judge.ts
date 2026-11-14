/*
 * 목 판정 계산. 생성기(`series-gen.ts`)의 월값 하나로 `/series`의 줄과 `/judgement`를 함께 만든다.
 *
 * 출처: 백엔드 `JudgeService.java`(칩·reason·ref·ytd_ratio), `SeriesService.java`(줄의 rank·ratio),
 * `Rules.java`(estimated·quality·status), 분석 C-2~C-6, D-1, D-4.
 *
 * 백엔드 규칙 중 단순화한 것 (지어낸 값)
 * - 평년·범위는 파이프라인 값 대신 여기서 계산한다: median = 비교 기간 같은 달 값의 중앙값(소수 두 자리),
 *   범위 = 15·85 퍼센타일(선형 보간) ∓ 2√median(소수 한 자리). 하한은 음수일 수 있다.
 * - rank·n: 비교 기간의 같은 달 값에 그 달 자신을 더한 집합(기간 밖 해면 n이 하나 늘어 2026년 달은 26).
 *   같은 값은 같은 순위. 값이 `null`이면 n도 `null`.
 * - 나라의 달별 품질: 2012-02 전 `medium`, 그 뒤 `high`. 그다음 그 지역 같은 달 평년이 5칸 미만이면 한 단계 낮춘다.
 * - 판정 기준: 한국 시·도는 경기·경북·충남만 25년, 시·군·구 `sufficient`는 자체 판정.
 *   한국 시·군·구 중 `sufficient`가 아니면 소속 시·도(`province`), 그 시·도가 `sufficient`가 아니면
 *   중심이 가장 가까운 `sufficient` 시·도(`nearby_province`). 부족한 시·도도 가장 가까운 `sufficient` 시·도.
 *   CAL·BC의 카운티·지역구는 주 전체(`province`).
 */
import type {
  Basis, Chip, Country, JudgeUnit, Judgement, JudgementRef, Quality, RegionSummary, Reason, SeriesMonth, Source, Status,
} from "../types";
import { NOAA20_START, VIIRS_START, regionValues, timeline } from "./series-gen";

const KOR_25Y_PROVINCES: readonly string[] = ["경기", "경북", "충남"];
const LOW_COUNT = 5;

type Profile = {
  region: RegionSummary;
  self: boolean;
  judgeUnit: JudgeUnit;
  refId: string | null;
  basis: Basis;
  period: [number, number];
};

type MonthStats = { periodValues: number[]; median: number | null; bandLow: number | null; bandHigh: number | null };

const round = (value: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

function distance(a: RegionSummary, b: RegionSummary): number {
  if (a.center === null || b.center === null) return Number.POSITIVE_INFINITY;
  return Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1]);
}

/** 중심이 가장 가까운 `sufficient` 시·도. 같은 거리면 목록 순서가 앞선 쪽(고정). */
function nearestSufficientProvince(from: RegionSummary, all: readonly RegionSummary[]): string | null {
  let best: RegionSummary | null = null;
  for (const r of all) {
    if (r.level !== "prov" || r.region_type !== "sufficient" || r.id === from.id) continue;
    if (best === null || distance(from, r) < distance(from, best)) best = r;
  }
  return best?.id ?? null;
}

export function profileOf(country: Country, region: RegionSummary, all: readonly RegionSummary[]): Profile {
  const sufficient = region.region_type === "sufficient";
  const long: Pick<Profile, "basis" | "period"> = { basis: "harmonized_25y", period: [2001, 2025] };
  const viirs: Pick<Profile, "basis" | "period"> = { basis: "viirs_2012", period: [2012, 2025] };

  if (region.level === "nat") return { region, self: true, judgeUnit: "self", refId: null, ...long };
  if (region.level === "prov") {
    const basisPeriod = KOR_25Y_PROVINCES.includes(region.id) ? long : viirs;
    if (sufficient) return { region, self: true, judgeUnit: "self", refId: null, ...basisPeriod };
    return {
      region, self: false, judgeUnit: "nearby_province", refId: nearestSufficientProvince(region, all), ...basisPeriod,
    };
  }
  if (sufficient) return { region, self: true, judgeUnit: "self", refId: null, ...viirs };
  if (country !== "KOR" || region.province === null) {
    return { region, self: false, judgeUnit: "province", refId: country, ...viirs };
  }
  const province = all.find((r) => r.level === "prov" && r.id === region.province);
  if (province?.region_type === "sufficient") {
    return { region, self: false, judgeUnit: "province", refId: province.id, ...viirs };
  }
  const from = province ?? region;
  return { region, self: false, judgeUnit: "nearby_province", refId: nearestSufficientProvince(from, all), ...viirs };
}

/** numpy 기본(선형 보간) 퍼센타일. `sorted`는 오름차순. */
function percentile(sorted: readonly number[], q: number): number {
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const a = sorted[lo] ?? 0;
  const b = sorted[Math.min(lo + 1, sorted.length - 1)] ?? a;
  return a + (b - a) * (pos - lo);
}

function median(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid] ?? 0;
  return sorted.length % 2 === 1 ? upper : ((sorted[mid - 1] ?? upper) + upper) / 2;
}

const statsCache = new Map<string, MonthStats[]>();

/** 1~12월 각각의 평년·범위(비교 기간의 같은 달 값). 지역별로 캐시한다. */
function monthStats(country: Country, profile: Profile): MonthStats[] {
  const key = `${country}/${profile.region.id}`;
  const hit = statsCache.get(key);
  if (hit !== undefined) return hit;
  const { months, values } = regionValues(country, profile.region);
  const [start, end] = profile.period;
  const buckets: number[][] = Array.from({ length: 12 }, () => []);
  months.forEach((month, i) => {
    const year = Number(month.slice(0, 4));
    const value = values[i];
    if (year < start || year > end || value === null || value === undefined) return;
    buckets[Number(month.slice(5, 7)) - 1]?.push(value);
  });
  const stats = buckets.map((bucket): MonthStats => {
    if (bucket.length === 0) return { periodValues: [], median: null, bandLow: null, bandHigh: null };
    const sorted = [...bucket].sort((a, b) => a - b);
    const med = median(sorted);
    const noise = 2 * Math.sqrt(med);
    return {
      periodValues: bucket,
      median: round(med, 2),
      bandLow: round(percentile(sorted, 0.15) - noise, 1),
      bandHigh: round(percentile(sorted, 0.85) + noise, 1),
    };
  });
  statsCache.set(key, stats);
  return stats;
}

function sourceOf(month: string): Source {
  if (month < VIIRS_START) return "MODIS→NOAA-20";
  if (month < NOAA20_START) return "S-NPP→NOAA-20";
  return "NOAA-20";
}

function statusOf(country: Country, month: string): Status {
  const { last, nrtFrom } = timeline(country);
  if (month === last) return "partial";
  return month >= nrtFrom ? "nrt" : "final";
}

function estimatedOf(region: RegionSummary, month: string): boolean {
  return month < (region.level === "prov" ? NOAA20_START : VIIRS_START);
}

function qualityOf(month: string, med: number | null): Quality {
  const base: Quality = month < VIIRS_START ? "medium" : "high";
  if (med === null || med >= LOW_COUNT) return base;
  return base === "high" ? "medium" : "low";
}

function chipOf(value: number, rank: number | null, bandLow: number | null, bandHigh: number | null): Chip {
  if (value > 0 && rank === 1) return "record";
  if (bandHigh !== null && value > bandHigh) return "above";
  if (bandLow !== null && value < bandLow) return "below";
  return "normal";
}

/** 한 지역 한 달의 저장 값(백엔드 DB 줄에 해당). 응답마다 이 값에서 필요한 것만 고른다. */
type Row = {
  month: string;
  value: number | null;
  rank: number | null;
  n: number | null;
  ratio: number | null;
  stats: MonthStats;
  status: Status;
  quality: Quality | null;
  estimated: boolean;
};

const EMPTY_STATS: MonthStats = { periodValues: [], median: null, bandLow: null, bandHigh: null };

function rowAt(country: Country, profile: Profile, index: number): Row {
  const { months, values } = regionValues(country, profile.region);
  const month = months[index] ?? "";
  const value = values[index] ?? null;
  const stats = monthStats(country, profile)[Number(month.slice(5, 7)) - 1] ?? EMPTY_STATS;
  const status = statusOf(country, month);
  const estimated = estimatedOf(profile.region, month);
  if (value === null) return { month, value, rank: null, n: null, ratio: null, stats, status, quality: null, estimated };

  const year = Number(month.slice(0, 4));
  const [start, end] = profile.period;
  const compared = year >= start && year <= end ? stats.periodValues : [...stats.periodValues, value];
  const rank = 1 + compared.filter((v) => v > value).length;
  const ratio = stats.median !== null && stats.median > 0 ? round(value / stats.median, 2) : null;
  return {
    month, value, rank, n: compared.length, ratio, stats, status, quality: qualityOf(month, stats.median), estimated,
  };
}

/** `/series`의 한 줄 (SeriesService: rank는 값 > 0일 때, ratio는 자체 판정일 때) */
export function seriesMonth(country: Country, profile: Profile, index: number): SeriesMonth {
  const row = rowAt(country, profile, index);
  return {
    month: row.month,
    value: row.value,
    source: row.value === null ? null : sourceOf(row.month),
    quality: row.quality,
    estimated: row.estimated,
    status: row.status,
    rank: row.value !== null && row.value > 0 ? row.rank : null,
    n: row.n,
    ratio_to_median: profile.self ? row.ratio : null,
  };
}

type Core = {
  value: number | null; chip: Chip | null; rank: number | null; n: number | null;
  median: number | null; bandLow: number | null; bandHigh: number | null; ratio: number | null;
  quality: Quality | null; estimated: boolean; status: Status; reason: Reason | null;
};

/** JudgeService.core와 같은 순서 */
function core(country: Country, profile: Profile, index: number): Core {
  const row = rowAt(country, profile, index);
  const base: Core = {
    value: row.value, chip: null, rank: null, n: row.n, median: null, bandLow: null, bandHigh: null, ratio: null,
    quality: row.quality, estimated: row.estimated, status: row.status, reason: null,
  };
  if (row.value === null) {
    return { ...base, reason: row.month < VIIRS_START ? "PRE_2012_DISTRICT" : null };
  }
  const value = row.value;
  const med = row.stats.median;
  let reason: Reason | null = null;
  if (profile.region.region_type === "none") reason = "NO_RECORD";
  else if (row.status === "partial") reason = "IN_PROGRESS";
  else if (value === 0) reason = "NO_DETECTION";
  else if (profile.self && med === 0) reason = "ZERO_BASELINE";

  if (!profile.self) return { ...base, median: med, reason };
  const { bandLow, bandHigh } = row.stats;
  return {
    ...base,
    median: med,
    reason,
    bandLow,
    bandHigh,
    rank: value > 0 ? row.rank : null,
    ratio: value > 0 && med !== null && med > 0 ? row.ratio : null,
    chip: chipOf(value, row.rank, bandLow, bandHigh),
  };
}

function ytdRatio(ytd: number | null, baselineYtd: number | null): number | null {
  if (ytd === null || baselineYtd === null || baselineYtd <= 0) return null;
  return round(ytd / baselineYtd, 2);
}

/** 그해 1월~그달 합(반올림 안 함)과 같은 기간 평년 합 */
function ytd(country: Country, profile: Profile, index: number): { sum: number; baseline: number | null } {
  const { values } = regionValues(country, profile.region);
  const stats = monthStats(country, profile);
  const first = index - (index % 12);
  let sum = 0;
  let baseline: number | null = 0;
  for (let i = first; i <= index; i += 1) {
    const v = values[i];
    if (v !== null && v !== undefined) sum += v;
    const med = stats[i % 12]?.median ?? null;
    baseline = baseline === null || med === null ? null : baseline + med;
  }
  return { sum, baseline };
}

function refOf(country: Country, refRegion: RegionSummary, all: readonly RegionSummary[], index: number): JudgementRef {
  const profile = profileOf(country, refRegion, all);
  const j = core(country, profile, index);
  return {
    id: refRegion.id,
    label_ko: refRegion.label_ko,
    value: j.value,
    chip: j.chip,
    rank: j.rank,
    n: j.n,
    ratio_to_median: j.ratio,
    basis: profile.basis,
  };
}

/** `/judgement`. `index`는 나라 달 목록의 번호(범위 검사는 부르는 쪽이 한다). */
export function judgement(
  country: Country,
  region: RegionSummary,
  all: readonly RegionSummary[],
  index: number,
): Judgement {
  const profile = profileOf(country, region, all);
  const j = core(country, profile, index);
  const refRegion = profile.refId === null ? undefined : all.find((r) => r.id === profile.refId);
  const ref = refRegion === undefined ? null : refOf(country, refRegion, all, index);
  const y = j.value === null ? null : ytd(country, profile, index);
  return {
    id: region.id,
    label_ko: region.label_ko,
    month: regionValues(country, region).months[index] ?? "",
    value: j.value,
    region_type: region.region_type,
    chip: j.chip,
    judge_unit: profile.judgeUnit,
    ref_id: ref?.id ?? null,
    ref_chip: ref?.chip ?? null,
    rank: j.rank,
    n: j.n,
    rank_period: profile.self ? profile.period : null,
    median: j.median,
    band_low: j.bandLow,
    band_high: j.bandHigh,
    ratio_to_median: j.ratio,
    ytd_sum: y?.sum ?? null,
    ytd_ratio: profile.self && y !== null ? ytdRatio(y.sum, y.baseline) : null,
    quality: j.quality,
    estimated: j.estimated,
    status: j.status,
    reason: j.reason,
    ref,
  };
}
