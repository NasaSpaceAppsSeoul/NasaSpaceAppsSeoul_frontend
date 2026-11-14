import { makeMonth } from "./month";

/*
 * 나라 화면 월별 선 그래프 재료 (5장): 그 해의 달별 값 + 평년 중앙값 + 보통 해 범위(`/baseline`).
 * 범위의 하한이 음수면 0으로 자른다(`reference/api/D-series.md` 2번, `decisions.md` 3-6).
 */
type SeriesMonthLike = { month: string; value: number | null; status: string; source: string | null };
type BaselineMonthLike = { month: number; median: number | null; band_low: number | null; band_high: number | null };

export type MonthlyPoint = {
  /** 1~12 */
  month: number;
  /** 그 해 값. 자료 마지막 달 뒤(`future`)와 관측 자료가 없는 달은 `null` */
  value: number | null;
  /** 집계 중(`status === "partial"`) */
  partial: boolean;
  /** 센서 환산값(`source`에 "→", 4-3) */
  converted: boolean;
  /** 자료 마지막 달 뒤 = 아직 집계 전 */
  future: boolean;
  median: number | null;
  /** 보통 해 범위. 둘 중 하나라도 없으면 둘 다 `null` */
  low: number | null;
  high: number | null;
};

export type MonthlyChart = {
  points: MonthlyPoint[];
  /** 아직 집계 전인 첫 달(없으면 `null`). "8–12월: 아직 집계 전" */
  pendingFrom: number | null;
  /** 그 해에 환산값이 하나라도 있는지(범례 문구) */
  anyConverted: boolean;
};

/** `lastMonth`는 자료 마지막 달("YYYY-MM"). 그 해에 그릴 값이 하나도 없으면 `null`. */
export function monthlyChartData(
  series: readonly SeriesMonthLike[],
  baseline: readonly BaselineMonthLike[],
  year: number,
  lastMonth: string,
): MonthlyChart | null {
  const byMonth = new Map(series.map((s) => [s.month, s]));
  const points = Array.from({ length: 12 }, (_, i): MonthlyPoint => {
    const m = i + 1;
    const key = makeMonth(year, m);
    const future = key > lastMonth;
    const row = future ? undefined : byMonth.get(key);
    const base = baseline.find((b) => b.month === m);
    const low = base?.band_low ?? null;
    const high = base?.band_high ?? null;
    const band = low !== null && high !== null ? { low: Math.max(0, low), high } : { low: null, high: null };
    return {
      month: m,
      value: row?.value ?? null,
      partial: row?.status === "partial",
      converted: row?.source?.includes("→") ?? false,
      future,
      median: base?.median ?? null,
      ...band,
    };
  });
  if (points.every((p) => p.value === null)) return null;
  const pending = points.find((p) => p.future);
  return { points, pendingFrom: pending?.month ?? null, anyConverted: points.some((p) => p.converted && p.value !== null) };
}
