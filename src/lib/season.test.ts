import { describe, expect, it } from "vitest";
import { monthlyChartData } from "./monthlyChart";
import { peakMonth, riskMonthRuns } from "./season";

describe("riskMonthRuns", () => {
  it("이어진 달끼리 묶고, 해를 넘기는 시기는 하나로", () => {
    expect(riskMonthRuns([3, 4])).toEqual([[3, 4]]);
    expect(riskMonthRuns([3])).toEqual([[3, 3]]);
    expect(riskMonthRuns([3, 4, 11])).toEqual([
      [3, 4],
      [11, 11],
    ]);
    // 백엔드는 오름차순으로 준다
    expect(riskMonthRuns([1, 2, 12])).toEqual([[12, 2]]);
    expect(riskMonthRuns([12, 1])).toEqual([[12, 1]]);
    expect(riskMonthRuns([])).toEqual([]);
  });

  it("12달 전부는 그대로 한 묶음", () => {
    expect(riskMonthRuns([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual([[1, 12]]);
  });
});

describe("peakMonth", () => {
  const base = [
    { month: 3, median: 74 },
    { month: 4, median: 80 },
    { month: 5, median: null },
  ];
  it("위험 달 중 중앙값이 가장 큰 달, 없으면 null", () => {
    expect(peakMonth([3, 4], base)).toBe(4);
    expect(peakMonth([5], base)).toBeNull();
    expect(peakMonth([], base)).toBeNull();
  });
});

describe("monthlyChartData", () => {
  const baseline = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, median: 10, band_low: i === 0 ? -2 : 5, band_high: 20 }));
  const series = [
    { month: "2026-01", value: 4, status: "final", source: "NOAA-20" },
    { month: "2026-02", value: 19, status: "final", source: "NOAA-20" },
    { month: "2026-03", value: 47, status: "partial", source: "NOAA-20" },
    { month: "2011-03", value: 30, status: "final", source: "MODIS→NOAA-20" },
  ];

  it("자료 마지막 달 뒤는 값 없이 집계 전, 범위 하한은 0으로 자른다", () => {
    const chart = monthlyChartData(series, baseline, 2026, "2026-03");
    expect(chart?.points.map((p) => p.value).slice(0, 4)).toEqual([4, 19, 47, null]);
    expect(chart?.points[2]?.partial).toBe(true);
    expect(chart?.points[3]?.future).toBe(true);
    expect(chart?.pendingFrom).toBe(4);
    expect(chart?.points[0]?.low).toBe(0);
    expect(chart?.anyConverted).toBe(false);
  });

  it("환산값이 있는 해, 값이 하나도 없는 해는 null", () => {
    expect(monthlyChartData(series, baseline, 2011, "2026-03")?.anyConverted).toBe(true);
    expect(monthlyChartData(series, baseline, 2011, "2026-03")?.pendingFrom).toBeNull();
    expect(monthlyChartData(series, baseline, 2005, "2026-03")).toBeNull();
  });

  it("범위가 한쪽이라도 없으면 둘 다 null", () => {
    const partialBand = [{ month: 1, median: 3, band_low: null, band_high: 9 }];
    expect(monthlyChartData(series, partialBand, 2026, "2026-03")?.points[0]).toMatchObject({ low: null, high: null, median: 3 });
  });
});
