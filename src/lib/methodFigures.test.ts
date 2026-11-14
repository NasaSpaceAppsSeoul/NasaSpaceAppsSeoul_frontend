import { describe, expect, it } from "vitest";
import { caseMonth, chipFigureModel, sameMonthBars } from "./methodFigures";

const m = (month: string, value: number | null, rank: number | null = null) => ({ month, value, rank });

describe("sameMonthBars", () => {
  it("고른 달의 2001–2025만, 값이 없는 해는 빼고, 칩은 백엔드 순서(1위 → 위 끝 → 아래 끝 → 평소)", () => {
    const months = [
      m("2000-03", 9),
      m("2001-03", 50, 3),
      m("2002-03", 300, 2),
      m("2003-03", 5, 20),
      m("2004-03", null),
      m("2005-03", 900, 1),
      m("2005-04", 999, 1),
      m("2026-03", 2000, 1),
    ];
    expect(sameMonthBars(months, 3, { median: 100, low: 20, high: 250 })).toEqual([
      { year: 2001, value: 50, chip: "normal" },
      { year: 2002, value: 300, chip: "above" },
      { year: 2003, value: 5, chip: "below" },
      { year: 2005, value: 900, chip: "record" },
    ]);
  });

  it("0칸은 1위여도 최고 기록이 아니다. 아래 끝 음수는 0으로 자른다. 범위가 없으면 평소", () => {
    expect(sameMonthBars([m("2010-07", 0, 1)], 7, { median: 1, low: -2, high: 3 })).toEqual([
      { year: 2010, value: 0, chip: "normal" },
    ]);
    expect(sameMonthBars([m("2010-07", 4, 2)], 7, null)).toEqual([{ year: 2010, value: 4, chip: "normal" }]);
  });
});

describe("caseMonth", () => {
  it("키로 대표 달을 찾고, 없거나 달이 숫자가 아니거나 범위 밖이면 null", () => {
    const stats = [
      { key: "risk_share", value: 0.6, months: [8] },
      { key: "case_month_ratio", month: "2020-09", value: 15.94, cells: 1, rank: 1, n: 25 },
    ];
    expect(caseMonth(stats)).toEqual({ year: 2020, month: 9 });
    expect(caseMonth([{ key: "risk_share" }])).toBeNull();
    const bad = [{ key: "case_month_ratio", month: "2020-13", value: 1, rank: 1, n: 25 }];
    expect(caseMonth(bad)).toBeNull();
    expect(caseMonth([{ key: "case_month_ratio", month: "2020-xx" }])).toBeNull();
    expect(caseMonth([{ key: "case_month_ratio" }])).toBeNull();
  });
});

describe("chipFigureModel", () => {
  const row = (month: string, value: number | null, rank: number | null, ratio: number | null) => ({
    month,
    value,
    rank,
    n: 25,
    ratio_to_median: ratio,
  });
  const byMonth = [{ month: 3, median: 174, band_low: -5, band_high: 294.8 }];

  it("대표 달이 1위면 그 줄의 배수·해 수로 긴 제목, 범위 아래 끝은 0으로 자른다", () => {
    const model = chipFigureModel([row("2024-03", 100, 9, 0.57), row("2025-03", 1093, 1, 6.28)], byMonth, { year: 2025, month: 3 });
    expect(model.headline).toEqual({ ratio: 6.28, n: 25 });
    expect(model.band).toEqual({ median: 174, low: 0, high: 294.8 });
    expect(model.bars.map((b) => b.chip)).toEqual(["normal", "record"]);
  });

  it("대표 달이 1위가 아니거나 배수가 없으면 짧은 제목, 그 달 범위가 없으면 band null", () => {
    expect(chipFigureModel([row("2020-09", 802, 7, 1.22)], byMonth, { year: 2020, month: 9 })).toMatchObject({
      headline: null,
      band: null,
    });
    expect(chipFigureModel([row("2025-03", 5, 1, null)], byMonth, { year: 2025, month: 3 }).headline).toBeNull();
  });
});
