import { isLastDayOfMonth } from "./month";

/*
 * 소개 화면 계산 (`H-landing.md` H-3, H-5). `lib`은 `api`를 가져오지 않으므로 필요한 필드만 구조 타입으로 둔다.
 */

/** 위성이 MODIS에서 S-NPP로 바뀐 해. 응답에 없어 상수로 둔다(H-3). */
export const BREAK_YEAR = 2012;

export type AnnualInput = { years: readonly number[]; before: readonly number[]; after: readonly number[] };
export type AnnualBar = { year: number; before: number; after: number; era: "pre" | "post" };

/** 해별로 묶는다. 배열 길이가 서로 다르면 짧은 쪽에 맞춘다. */
export function annualBars({ years, before, after }: AnnualInput): AnnualBar[] {
  const length = Math.min(years.length, before.length, after.length);
  const bars: AnnualBar[] = [];
  for (let i = 0; i < length; i += 1) {
    const year = years[i] ?? 0;
    bars.push({ year, before: before[i] ?? 0, after: after[i] ?? 0, era: year < BREAK_YEAR ? "pre" : "post" });
  }
  return bars;
}

/** MODIS로만 관측한 마지막 해. 첫 화면 01 비교 카드가 이 해의 연간 값을 쓴다(`plans/about-revise.md` 10절 ①). */
export const READOUT_YEAR = BREAK_YEAR - 1;

export type Readout = { year: number; before: number; after: number };

/**
 * 01 비교 카드 값: `READOUT_YEAR`의 연간 보정 전 → 후. 그 해가 없거나 어느 한쪽이라도 0이면 `null` = "값 없음".
 * 0은 자료 없는 해다(9-5). 보정 전과 후는 출처가 달라(전: 위성 원값, 후: 나라 시계열 합) 한쪽만 0일 수 있는데,
 * 그대로 보이면 "302 → 0"처럼 보정이 값을 지운 것으로 읽힌다.
 * 처음에는 9장에서 `/series` `raw_before`의 최근 달 값으로 바꾸려 했지만 그대로 둔다(2026-11-15 사용자): 2018-04부터는
 * NOAA-20이 보정 기준 위성이라 보정 전과 후가 늘 같다(서버 확인, 한국 2026-10 76 → 76). 이 해의 값은 `/series`
 * `raw_before` 2011년 합(302)과도 같다.
 */
export function readoutYear(annual: AnnualInput): Readout | null {
  const bar = annualBars(annual).find((b) => b.year === READOUT_YEAR);
  if (bar === undefined || bar.before === 0 || bar.after === 0) return null;
  return { year: bar.year, before: bar.before, after: bar.after };
}

/** 모든 값이 0이면(자료 없음과 구분되지 않는다, H-3) 그래프 대신 안내를 보인다. */
export function hasAnnualData(bars: readonly AnnualBar[]): boolean {
  return bars.some((bar) => bar.before > 0 || bar.after > 0);
}

const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** 세로축 위 끝: 최댓값 이상인 가장 작은 "깔끔한 수"(1·1.2·1.5·2·2.5·3·4·5·6·8 × 10ⁿ). 모두 0이거나 비면 1. */
export function niceMax(values: readonly number[]): number {
  const max = Math.max(0, ...values);
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = NICE_STEPS.find((s) => s * power >= max - power * 1e-9) ?? 10;
  return Number((step * power).toPrecision(12));
}

/** 02 월별 막대에 쓰는 `/series` 달 하나(필요한 필드만) */
export type YtdMonthInput = { month: string; value: number | null; status: string };

export type YtdBar = {
  /** 1~12 */
  month: number;
  /** "YYYY-MM" */
  key: string;
  /** `null`이면 값 없음(막대 없음) */
  value: number | null;
  /**
   * 확정 전 상태: 집계 중(`partial`, 그 달이 아직 진행 중) / 준실시간(`nrt`, 확정 자료가 끝난 뒤의 달). 점선 테두리.
   * 값이 없는 달은 `null`("값 없음"만)
   */
  pending: "partial" | "nrt" | null;
};

export type Ytd = {
  year: number;
  bars: YtdBar[];
  total: number;
  /** 합계에 확정 전 달이 들어갔는지. 집계 중이 하나라도 있으면 `partial`, 아니면 준실시간이 있으면 `nrt` */
  totalPending: "partial" | "nrt" | null;
};

/**
 * 02 월별 막대 (`plans/about-revise.md` 9-5): `/series`의 마지막 달이 속한 해의 1월~그 달.
 * 9-5는 `monthlyChartData`를 다시 쓰라고 했지만 그 함수는 `partial`만 집계 중으로 보고 `nrt`(준실시간)를 놓쳐 따로 둔다.
 * `data_end`가 아니라 시계열 마지막 달로 정한다(둘이 다를 수 있다). 마지막 달이 1월이면 1월 하나만 보인다.
 * 합계는 값이 있는 달만 더해 소수 한 자리(스킬 7). 확정 전 달이 들어가면 `totalPending`(집계 중이 있으면 `partial`, 아니면 `nrt`).
 * 그 해에 값이 하나도 없으면 `null`.
 */
export function ytdBars(months: readonly YtdMonthInput[]): Ytd | null {
  const last = months.reduce<YtdMonthInput | undefined>((a, m) => (a === undefined || m.month > a.month ? m : a), undefined);
  if (last === undefined) return null;
  const year = Number(last.month.slice(0, 4));
  const lastMonth = Number(last.month.slice(5, 7));
  const byKey = new Map(months.map((m) => [m.month, m]));
  const bars = Array.from({ length: lastMonth }, (_, i): YtdBar => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const row = byKey.get(key);
    const value = row?.value ?? null;
    const status = row?.status;
    return {
      month: i + 1,
      key,
      value,
      // 값이 없는 달은 확정 전 표시를 붙이지 않는다("값 없음"만)
      pending: value === null ? null : status === "partial" ? "partial" : status === "nrt" ? "nrt" : null,
    };
  });
  const shown = bars.filter((b) => b.value !== null);
  if (shown.length === 0) return null;
  const total = Math.round(shown.reduce((sum, b) => sum + (b.value ?? 0), 0) * 10) / 10;
  const totalPending = shown.some((b) => b.pending === "partial") ? "partial" : shown.some((b) => b.pending === "nrt") ? "nrt" : null;
  return { year, bars, total, totalPending };
}

/**
 * 세로축 눈금: 0부터 깔끔한 간격(1·2·2.5·5 × 10ⁿ)으로 5칸 안팎, 맨 위는 최댓값 이상.
 * 시안처럼 0·10·…·50 같은 눈금이 나온다. 모두 0이거나 비면 [0, 1].
 * 눈금 글자는 소수 한 자리까지라(스킬 7) 간격이 1보다 작으면 2.5배(0.25 같은 둘째 자리)를 쓰지 않는다.
 */
export function axisTicks(values: readonly number[]): number[] {
  const max = Math.max(0, ...values);
  if (max <= 0) return [0, 1];
  const rough = max / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  const steps = power >= 1 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10];
  const step = (steps.find((s) => s * power >= rough - power * 1e-9) ?? 10) * power;
  const count = Math.ceil(max / step - 1e-9);
  return Array.from({ length: count + 1 }, (_, i) => Number((i * step).toPrecision(12)));
}

export type DetectInput = { bin: string; detected: number | null; chance: number | null; n?: number };

/**
 * 단계 이름: 화면 문구 표(`i18n`)에서 찾고, 표에 없으면 받은 문자열 그대로(나라마다 단계 이름이 다를 수 있다, H-5).
 * 순서는 받은 그대로 둔다.
 */
export function binLabel(bin: string, names: Readonly<Record<string, string>>): string {
  return Object.hasOwn(names, bin) ? (names[bin] ?? bin) : bin;
}

export type DetectRow = {
  bin: string;
  label: string;
  /** 막대 길이 0~1(값이 없으면 0) */
  width: number;
  /** 세로선 자리 0~1(값이 없으면 `null`, 선을 그리지 않는다) */
  chanceAt: number | null;
  detected: number | null;
  chance: number | null;
  /** 그 단계의 공식 기록 수(받은 값에 있을 때) */
  n: number | null;
};

/** 감지율 줄. 받은 순서 그대로, 이름은 표에서 찾는다(H-5). */
export function detectRows(items: readonly DetectInput[], names: Readonly<Record<string, string>>): DetectRow[] {
  return items.map((item) => ({
    bin: item.bin,
    label: binLabel(item.bin, names),
    width: clampRatio(item.detected),
    chanceAt: item.chance === null ? null : clampRatio(item.chance),
    detected: item.detected,
    chance: item.chance,
    n: item.n ?? null,
  }));
}

/** 막대 길이(0~1). `null`이나 범위 밖 값은 잘라 둔다. */
export function clampRatio(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 03 안내의 자료 기준일(UI 다듬기 2026-11-15): 여러 지역 `/meta` `data_end` 중 가장 이른 날과 늦은 날,
 * 가장 최근 달이 집계 중인지(그 달에서 멈춘 지역 가운데 하나라도 달 끝 전이면 `true`).
 * 하나라도 받지 못했거나(`undefined`) 값이 없거나 날짜 모양이 아니면 `null`: 일부 지역만으로 범위를 좁게 말하지 않는다.
 */
export function dataEndSpan(
  ends: readonly (string | null | undefined)[],
): { first: string; last: string; collecting: boolean } | null {
  if (ends.length === 0 || !ends.every((d): d is string => typeof d === "string" && DATE.test(d))) return null;
  const dates = [...ends].sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first === undefined || last === undefined) return null;
  const lastMonth = last.slice(0, 7);
  const collecting = dates.some((d) => d.startsWith(lastMonth) && !isLastDayOfMonth(d));
  return { first, last, collecting };
}
