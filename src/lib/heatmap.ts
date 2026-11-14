import { isInRange, makeMonth, monthYear, type MonthRange } from "./month";

/*
 * 히트맵 (`decisions.md` 4절, `D-series.md` D-3). `lib`은 `api`를 가져오지 않으므로 쓰는 필드만 구조 타입으로 받는다.
 */

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/**
 * 색 단계 (4-1). 0은 0단계, 그 위는 경계 세 개로 1~4단계. 경계와 같은 값은 위 단계.
 * 경계가 비어 있으면(전 기간에 0이 아닌 값이 없던 지역, 4-2) 0보다 큰 값은 방어적으로 1단계.
 */
export function heatLevel(value: number, bins: readonly number[]): HeatLevel {
  if (value <= 0) return 0;
  const [a, b, c] = bins;
  if (a === undefined || b === undefined || c === undefined) return 1;
  if (value < a) return 1;
  if (value < b) return 2;
  if (value < c) return 3;
  return 4;
}

/** 범례 한 칸. `from`·`to`가 `null`이면 그쪽이 열려 있다(1단계는 0 초과, 4단계는 끝 없음). */
export type LegendItem = { level: HeatLevel; from: number | null; to: number | null };

/** 그 지역의 경계 숫자로 범례를 만든다. 경계가 겹쳐 빈 단계는 뺀다(4-2). 경계가 비면 "0" 하나뿐. */
export function heatLegend(bins: readonly number[]): LegendItem[] {
  const zero: LegendItem = { level: 0, from: 0, to: 0 };
  const [a, b, c] = bins;
  if (a === undefined || b === undefined || c === undefined) return [zero];
  const items: LegendItem[] = [zero, { level: 1, from: null, to: a }];
  if (b > a) items.push({ level: 2, from: a, to: b });
  if (c > b) items.push({ level: 3, from: b, to: c });
  items.push({ level: 4, from: c, to: null });
  return items;
}

type QualityValue = "high" | "medium" | "low";

export type SeriesMonthLike = {
  month: string;
  value: number | null;
  source: string | null;
  quality: QualityValue | null;
  estimated: boolean;
  status: "final" | "partial" | "nrt";
};

/**
 * 칸 상태 (4-4). 먼저 맞는 것 하나:
 * 아직 집계 전(그 지역 시계열 마지막 달 뒤) → 빈칸(시계열 첫 달 앞) → 관측 자료 없음(값 `null`) → 집계 중 → 감지 없음(0) → 값.
 */
export type CellState = "future" | "blank" | "noData" | "partial" | "zero" | "value";

export type HeatCell = {
  month: string;
  state: CellState;
  value: number | null;
  level: HeatLevel;
  /** 센서 환산값: 그 달 관측 위성에 "→"(4-3). 값이 없으면 붙이지 않는다 */
  converted: boolean;
  estimated: boolean;
  quality: QualityValue | null;
  nrt: boolean;
  selected: boolean;
  /** 누르면 그 달로 간다(4-5): 값·0·집계 중 칸이고 나라 달 범위 안일 때만 */
  clickable: boolean;
};

export type HeatRow = { year: number; cells: HeatCell[] };

type GridInput = {
  months: readonly SeriesMonthLike[];
  bins: readonly number[];
  /** 맨 아래 해(표시 연도) */
  startYear: number;
  /** 주소의 달 */
  selected: string;
  /** 누를 수 있는 달 범위(나라 달 범위. 밖이면 숫자 카드가 400) */
  clickRange: MonthRange;
};

function cellOf(month: string, data: SeriesMonthLike | undefined, first: string, last: string, input: GridInput): HeatCell {
  const state: CellState =
    month > last
      ? "future"
      : month < first
        ? "blank"
        : data === undefined || data.value === null
          ? "noData"
          : data.status === "partial"
            ? "partial"
            : data.value === 0
              ? "zero"
              : "value";
  const value = data?.value ?? null;
  const hasValue = value !== null && (state === "value" || state === "zero" || state === "partial");
  return {
    month,
    state,
    value: hasValue ? value : null,
    level: hasValue ? heatLevel(value, input.bins) : 0,
    converted: hasValue && data !== undefined && data.source !== null && data.source.includes("→"),
    estimated: hasValue && data !== undefined && data.estimated,
    quality: hasValue && data !== undefined ? data.quality : null,
    nrt: hasValue && data !== undefined && data.status === "nrt",
    selected: month === input.selected,
    clickable: hasValue && isInRange(month, input.clickRange),
  };
}

/** 해 × 12달 격자. 위가 최근 해, 맨 아래가 `startYear`. 시계열은 시간순(D-1). */
export function buildGrid(input: GridInput): HeatRow[] {
  const first = input.months[0]?.month;
  const last = input.months[input.months.length - 1]?.month;
  if (first === undefined || last === undefined) return [];
  const byMonth = new Map(input.months.map((m) => [m.month, m]));
  const rows: HeatRow[] = [];
  for (let year = monthYear(last); year >= input.startYear; year -= 1) {
    const cells = Array.from({ length: 12 }, (_, i) => {
      const month = makeMonth(year, i + 1);
      return cellOf(month, byMonth.get(month), first, last, input);
    });
    rows.push({ year, cells });
  }
  return rows;
}

/** 센서 전환(4-3, 4-9). 선은 그 해 행의 아래(그 해와 앞 해 사이)에 긋는다. */
export const SENSOR_CHANGES = [
  { year: 2018, key: "noaa20" },
  { year: 2012, key: "snpp" },
] as const;

export type SensorChangeKey = (typeof SENSOR_CHANGES)[number]["key"];

/** 그 해 행 아래에 그을 구분선. 선 양쪽 해가 모두 보일 때만. */
export function dividerAfter(year: number, visibleYears: ReadonlySet<number>): SensorChangeKey | null {
  const change = SENSOR_CHANGES.find((c) => c.year === year);
  if (change === undefined) return null;
  return visibleYears.has(year) && visibleYears.has(year - 1) ? change.key : null;
}

/** 표시 연도 (4-7). "viirs"는 2012년부터. 시·군·구는 늘 비교 기간 시작 해부터. */
export type YearMode = "all" | "viirs";

export const VIIRS_START_YEAR = 2012;

export function startYearFor(mode: YearMode, firstYear: number, districtStart: number | null): number {
  if (districtStart !== null) return Math.max(firstYear, districtStart);
  return mode === "viirs" ? Math.max(firstYear, VIIRS_START_YEAR) : firstYear;
}
