import { heatLevel, type HeatLevel } from "./heatmap";
import { monthNumber, monthYear } from "./month";
import { byValueThenName } from "./region";

/*
 * 월간 인사이트 화면의 값 분기 (`docs/plans/insight.md` 2절, 분석 G-3·G-6·G-7).
 * `lib`은 `api`를 가져오지 않으므로 `/insight` 응답 중 쓰는 필드만 구조 타입으로 받는다.
 * `head.rank`·`head.n`은 쓰지 않는다: 드문 지역은 자기 시계열 순위로 채워져 와서 쓰면 3-1을 어긴다.
 */

const VIIRS_START = "2012-02";
const CLUSTER_START = "2018-04";

type RegionTypeValue = "sufficient" | "sparse" | "none";
type StripRow = { year: number; v: number };

/**
 * 집계 중인 달인가. `reason` 하나에 기대지 않는다(스킬 1번): 기록 없는 지역은 집계 중이어도 `NO_RECORD`가 온다.
 * 그 달 나라 시계열의 `status`(달 상태는 나라 단위)와 `head.reason`을 함께 본다.
 */
export function isInProgress(countryStatus: string | null, reason: string | null): boolean {
  return countryStatus === "partial" || reason === "IN_PROGRESS";
}

// ---- 연도별 막대와 감지된 해 표

export type YearBar = StripRow & { partial: boolean };

/** 2026년 달 보충이 필요한가(스킬 `burnline-api` 12번): `strip`이 있고, 선택한 해가 없고, 이 달 값이 있을 때 */
export function needsCurrentYear(strip: readonly StripRow[] | null, year: number, headValue: number | null): boolean {
  return strip !== null && headValue !== null && !strip.some((row) => row.year === year);
}

/** 보충한 한 달(`/series?from=달&to=달`의 그 달 줄)을 `strip`에 붙인다. 붙일 것이 없으면 그대로 */
export function withCurrentYear(
  strip: readonly StripRow[] | null,
  year: number,
  current: { value: number | null; status: string } | null,
): YearBar[] | null {
  if (strip === null) return null;
  const bars: YearBar[] = strip.map((row) => ({ ...row, partial: false }));
  if (current === null || current.value === null || strip.some((row) => row.year === year)) return bars;
  return [...bars, { year, v: current.value, partial: current.status === "partial" }].sort((a, b) => a.year - b.year);
}

export type DetectedYear = { year: number; v: number; selected: boolean };

/** 감지된 해 표: `v > 0`인 해 전부(값 큰 순, 같으면 최근 해 먼저). 선택한 해는 0이어도 맨 위. 순위는 쓰지 않는다 */
export function detectedYears(bars: readonly StripRow[], year: number): DetectedYear[] {
  const selected = bars.find((row) => row.year === year);
  const rest = bars
    .filter((row) => row.year !== year && row.v > 0)
    .sort((a, b) => b.v - a.v || b.year - a.year)
    .map((row) => ({ year: row.year, v: row.v, selected: false }));
  return selected === undefined ? rest : [{ year: selected.year, v: selected.v, selected: true }, ...rest];
}

export type YearsCount = { detected: number; total: number; from: number; to: number };

/** 머리 칸 ②와 표 설명이 함께 쓰는 개수. 보충 전 `strip`(백엔드가 준 해들)으로 센다(결정 ③) */
export function yearsCount(strip: readonly StripRow[] | null): YearsCount | null {
  if (strip === null || strip.length === 0) return null;
  const years = strip.map((row) => row.year);
  return { detected: strip.filter((row) => row.v > 0).length, total: strip.length, from: Math.min(...years), to: Math.max(...years) };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export type YearSummary = { current: number | null; previousYears: number; previousSum: number; from: number; to: number };

/**
 * 막대 아래 요약: 선택한 해의 값과 그보다 앞선 해들의 합(소수 한 자리, 스킬 7번).
 * 선택한 해가 없으면 `current`가 `null`이고 모든 해의 합
 */
export function yearSummary(bars: readonly StripRow[], year: number): YearSummary | null {
  if (bars.length === 0) return null;
  const years = bars.map((row) => row.year);
  const current = bars.find((row) => row.year === year);
  const others = current === undefined ? [...bars] : bars.filter((row) => row.year < year);
  return {
    current: current?.v ?? null,
    previousYears: others.length,
    previousSum: round1(others.reduce((sum, row) => sum + row.v, 0)),
    from: Math.min(...years),
    to: Math.max(...years),
  };
}

// ---- 머리 숫자 칸 4개

export type NoneReason = "preDistrict" | "failed" | "preCluster" | "noCluster";
export type Tile<T> = { kind: "value"; value: T } | { kind: "none"; reason: NoneReason };

type ClusterLike = { start: string; end: string; cells: number; regions: readonly unknown[] };

export type HeadInput = {
  month: string;
  head: { value: number | null; reason: string | null; fire_days: number | null; dmax: number | null; dmax_date: string | null };
  calendar: { main_cluster: ClusterLike | null } | null;
  strip: readonly StripRow[] | null;
};

export type HeadTiles = {
  total: Tile<number>;
  years: Tile<YearsCount>;
  days: Tile<{ fireDays: number; dmax: number | null; dmaxDate: string | null }>;
  cluster: Tile<{ cells: number; start: string; end: string; multiRegion: boolean }>;
};

const none = (reason: NoneReason) => ({ kind: "none", reason }) as const;

export function headTiles({ month, head, calendar, strip }: HeadInput): HeadTiles {
  const preDistrict = head.reason === "PRE_2012_DISTRICT" || month < VIIRS_START;
  const count = yearsCount(strip);
  const cluster = calendar?.main_cluster ?? null;
  return {
    total: head.value !== null ? { kind: "value", value: head.value } : none(preDistrict ? "preDistrict" : "failed"),
    years: count !== null ? { kind: "value", value: count } : none("failed"),
    days: preDistrict
      ? none("preDistrict")
      : calendar === null || head.fire_days === null
        ? none("failed")
        : // 점이 없는 달은 `dmax`가 0이다. 보조 줄을 그리지 않도록 `null`로 맞춘다
          { kind: "value", value: { fireDays: head.fire_days, dmax: head.dmax !== null && head.dmax > 0 ? head.dmax : null, dmaxDate: head.dmax_date } },
    cluster:
      month < CLUSTER_START
        ? none("preCluster")
        : calendar === null
          ? none("failed")
          : cluster === null
            ? none("noCluster")
            : { kind: "value", value: { cells: cluster.cells, start: cluster.start, end: cluster.end, multiRegion: cluster.regions.length > 1 } },
  };
}

// ---- 일별 달력

/** 달력 칸 색 단계: 디자인 고정 0 / 1 / 2 / 3 / 4+ (결정 ①, 하루 칸 수의 척도는 백엔드에 없다) */
export const DAY_BINS: readonly number[] = [2, 3, 4];
export const DAY_LEGEND: readonly { level: HeatLevel; label: string }[] = [
  { level: 0, label: "0" },
  { level: 1, label: "1" },
  { level: 2, label: "2" },
  { level: 3, label: "3" },
  { level: 4, label: "4+" },
];

export type DayCell = {
  day: number;
  value: number;
  level: HeatLevel;
  inCluster: boolean;
  isPeak: boolean;
  official: string | null;
  future: boolean;
};

export type CalendarInput = {
  month: string;
  daily: Readonly<Record<string, number>>;
  cluster: { start: string; end: string } | null;
  dmaxDate: string | null;
  official: readonly { date: string; place: string }[];
  /** 집계 중인 달(`head.reason === "IN_PROGRESS"`) */
  inProgress: boolean;
  /** `meta.data_end` ("YYYY-MM-DD") */
  dataEnd: string | null;
};

function daysIn(month: string): number {
  return new Date(Date.UTC(monthYear(month), monthNumber(month), 0)).getUTCDate();
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 달과 일로 날짜("YYYY-MM-DD")를 만든다(`daily` 키와 `near50.first`는 일 숫자다) */
export function dayDate(month: string, day: number): string {
  return `${month}-${pad(day)}`;
}

/** 묶음이 전달·다음 달에 걸치면 이 달 안으로 자른 시작·끝 일. 이 달과 겹치지 않으면 `null` */
export function clusterRange(cluster: { start: string; end: string } | null, month: string): { from: number; to: number } | null {
  if (cluster === null) return null;
  const first = `${month}-01`;
  const last = `${month}-${pad(daysIn(month))}`;
  if (cluster.end < first || cluster.start > last) return null;
  const from = cluster.start < first ? 1 : Number(cluster.start.slice(8, 10));
  const to = cluster.end > last ? daysIn(month) : Number(cluster.end.slice(8, 10));
  return { from, to };
}

/** 1일의 요일(일요일 0)만큼 앞을 비우는 7열 달력 */
export function calendarCells(input: CalendarInput): { leading: number; cells: DayCell[] } {
  const { month, daily, dmaxDate, official, inProgress, dataEnd } = input;
  const leading = new Date(Date.UTC(monthYear(month), monthNumber(month) - 1, 1)).getUTCDay();
  const range = clusterRange(input.cluster, month);
  const cells = Array.from({ length: daysIn(month) }, (_, i): DayCell => {
    const day = i + 1;
    const date = dayDate(month, day);
    const value = daily[String(day)] ?? 0;
    return {
      day,
      value,
      level: heatLevel(value, DAY_BINS),
      // 묶음은 이웃 지역에 걸친 기간이라 이 지역은 0인 날이 섞인다. 밑줄은 이 지역에서도 감지된 날만
      inCluster: range !== null && day >= range.from && day <= range.to && value > 0,
      isPeak: dmaxDate === date,
      official: official.find((record) => record.date === date)?.place ?? null,
      future: inProgress && dataEnd !== null && date > dataEnd && value === 0,
    };
  });
  return { leading, cells };
}

export type ClusterSummary =
  | { kind: "preCluster" }
  | { kind: "unknown" }
  | { kind: "none" }
  | { kind: "events"; events: number; big: number };

/** 요약 줄의 "감지 묶음" 칸. 0은 자료 없음일 수 있어 "없었다"로 단정하지 않는다(G-7 10) */
export function clusterSummary(
  month: string,
  clusters: { events: number; big_events: number } | null,
): ClusterSummary {
  if (month < CLUSTER_START) return { kind: "preCluster" };
  if (clusters === null) return { kind: "unknown" };
  if (clusters.events === 0) return { kind: "none" };
  return { kind: "events", events: clusters.events, big: clusters.big_events };
}

export type CalendarSummary = {
  fireDays: number | null;
  peak: { date: string; cells: number } | null;
  clusters: ClusterSummary;
  near50: { date: string; cells: number } | null;
};

/** 달력 아래 요약 줄 4칸. 값이 없는 칸은 `null`("—") */
export function calendarSummary(
  month: string,
  head: { fire_days: number | null; dmax: number | null; dmax_date: string | null },
  calendar: { clusters: { events: number; big_events: number } | null; near50: { n: number; first: number | null } },
): CalendarSummary {
  return {
    fireDays: head.fire_days,
    peak: head.dmax_date !== null && head.dmax !== null ? { date: head.dmax_date, cells: head.dmax } : null,
    clusters: clusterSummary(month, calendar.clusters),
    near50: calendar.near50.first === null ? null : { date: dayDate(month, calendar.near50.first), cells: calendar.near50.n },
  };
}

// ---- 계절

type SeasonLike = {
  own_mt: readonly number[] | null;
  ref_mt: readonly number[] | null;
  ref_id: string | null;
  risk_months: readonly number[];
  risk_from: "self" | "province" | "nearby_province";
};

export type SeasonView = {
  values: number[];
  borrowed: boolean;
  /** `null`이면 기간을 쓰지 않는다(빌린 판정을 모름) */
  period: [number, number] | null;
  riskMonths: number[];
  /** 위험 시기 문장의 주어(백엔드 `risk_from`): 자기 지역, 자기 시·도, 가까운 시·도(빌린 지역) */
  riskFrom: "self" | "province" | "nearby_province";
  empty: boolean;
};

/**
 * 8-6: 충분 지역은 자기 값, 그 밖은 빌린 지역 값. 고른 배열이 `null`이면 `null`(다른 배열로 대신하지 않는다).
 * 드문 지역인데 빌릴 곳이 없으면(`ref_id === null`, 백엔드가 자체 판정으로 둔 경우) 자기 값을 쓴다. 실패가 아니다.
 * 기간: 자기 값은 2012–2025, 빌린 값은 빌린 지역의 `basis`로(25년이면 2001부터).
 */
export function seasonView(
  season: SeasonLike,
  regionType: RegionTypeValue,
  refBasis: "harmonized_25y" | "viirs_2012" | null,
): SeasonView | null {
  const borrowed = regionType !== "sufficient" && season.ref_id !== null;
  const values = borrowed ? season.ref_mt : season.own_mt;
  if (values === null) return null;
  const period: [number, number] | null = !borrowed
    ? [2012, 2025]
    : refBasis === "harmonized_25y"
      ? [2001, 2025]
      : refBasis === "viirs_2012"
        ? [2012, 2025]
        : null;
  return {
    values: [...values],
    borrowed,
    period,
    riskMonths: [...season.risk_months],
    riskFrom: season.risk_from,
    empty: values.every((v) => v === 0),
  };
}

// ---- 주변 지역

type NeighborLike = { id: string; region_type: RegionTypeValue; v: number | null; rank: number | null; n: number | null };

export type NeighborBasis = "self" | "sparse" | "none";
export type NeighborRow = {
  id: string;
  value: number | null;
  isSelf: boolean;
  basis: NeighborBasis;
  rank: { rank: number; n: number } | null;
};

const BASIS: Record<RegionTypeValue, NeighborBasis> = { sufficient: "self", sparse: "sparse", none: "none" };

/**
 * 첫 줄은 선택 지역. 이웃은 값 큰 순, `null`은 맨 뒤(G-7 9), 같으면 `nameOf` 순.
 * 순위는 충분 지역이고 집계 중인 달이 아닐 때만(3-1, 3절 집계 중 순위 없음).
 */
export function neighborRows(
  self: { id: string; region_type: RegionTypeValue; value: number | null },
  neighbors: readonly NeighborLike[],
  inProgress: boolean,
  compareNames: (a: string, b: string) => number,
): NeighborRow[] {
  const sorted = [...neighbors].sort(byValueThenName((n) => n.v, compareNames));
  return [
    { id: self.id, value: self.value, isSelf: true, basis: BASIS[self.region_type], rank: null },
    ...sorted.map((n): NeighborRow => ({
      id: n.id,
      value: n.v,
      isSelf: false,
      basis: BASIS[n.region_type],
      rank: n.region_type === "sufficient" && !inProgress && n.rank !== null && n.n !== null ? { rank: n.rank, n: n.n } : null,
    })),
  ];
}

// ---- 공식 기록

type OfficialLike = { date: string; place: string; cause: string; area_ha: number };
export type OfficialRow = { key: string; date: string; place: string; cause: string; area: number | null };

/**
 * 면적을 소수 한 자리로 쓰면 0이 되는 작은 값의 경계. 이보다 작은 면적은 "0.1 미만"으로 쓴다(9장 2차: 그리스 기록에 0.01~0.03 ha가 많다).
 * 기법 페이지 감지율 구간 "0.1 ha 미만"과 같은 경계
 */
export const SMALL_AREA_HA = 0.1;

/** 면적 0은 "모름"일 수 있어 빈칸(`null`, 8-4). 기록에 ID가 없어 key는 날짜·장소·순번 */
export function officialRows(items: readonly OfficialLike[]): OfficialRow[] {
  return items.map((item, i) => ({
    key: `${item.date}|${item.place}|${i}`,
    date: item.date,
    place: item.place,
    cause: item.cause,
    area: item.area_ha > 0 ? item.area_ha : null,
  }));
}

export type DetectRate = { since: string; n: number; detected: number; percent: number; windowDays: number };

/** 감지율 상자. 응답이 없거나 기록이 없어 `rate`가 `null`이면 상자를 그리지 않는다. `rate`는 0~1 */
export function detectRateLine(
  rate: { n: number; detected: number; rate: number | null; since: string; window_days: number } | null,
): DetectRate | null {
  if (rate === null || rate.rate === null) return null;
  return { since: rate.since, n: rate.n, detected: rate.detected, percent: Math.round(rate.rate * 100), windowDays: rate.window_days };
}

// ---- 읽는 법

export type GuideKey = "period" | "unit" | "baseline" | "usualActivity" | "whySparse" | "alternative" | "sources";

/** 읽는 법 줄. 드문 지역 설명 세 줄은 충분 지역이 아닐 때만 */
export function guideRows(regionType: RegionTypeValue): GuideKey[] {
  const common: GuideKey[] = ["period", "unit", "baseline"];
  const sparse: GuideKey[] = regionType === "sufficient" ? [] : ["usualActivity", "whySparse", "alternative"];
  return [...common, ...sparse, "sources"];
}

/** 감지된 해 표 아래 줄("감지가 드문 지역은…")은 충분 지역이 아닐 때만 */
export function showSparseNote(regionType: RegionTypeValue): boolean {
  return regionType !== "sufficient";
}
