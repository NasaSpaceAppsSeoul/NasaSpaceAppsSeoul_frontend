import { describe, expect, it } from "vitest";
import { basisValue, buildGrid, dividerAfter, hasRawValues, heatLegend, heatLevel, startYearFor, type SeriesMonthLike } from "./heatmap";

describe("색 단계 (4-1, 4-2)", () => {
  const bins = [5, 33, 160];

  it("0은 0단계, 경계와 같은 값은 위 단계", () => {
    expect(heatLevel(0, bins)).toBe(0);
    expect(heatLevel(0.4, bins)).toBe(1);
    expect(heatLevel(5, bins)).toBe(2);
    expect(heatLevel(32.9, bins)).toBe(2);
    expect(heatLevel(33, bins)).toBe(3);
    expect(heatLevel(160, bins)).toBe(4);
  });

  it("경계가 비면 0보다 큰 값은 방어적으로 1단계, 범례는 0 하나", () => {
    expect(heatLevel(3, [])).toBe(1);
    expect(heatLegend([])).toEqual([{ level: 0, from: 0, to: 0 }]);
  });

  it("범례는 그 지역 경계 숫자. 겹친 경계는 빈 단계를 빼고 단계 번호(색)를 지킨다", () => {
    expect(heatLegend(bins).map((i) => i.level)).toEqual([0, 1, 2, 3, 4]);
    const overlapped = heatLegend([2, 2, 5]);
    expect(overlapped).toEqual([
      { level: 0, from: 0, to: 0 },
      { level: 1, from: null, to: 2 },
      { level: 3, from: 2, to: 5 },
      { level: 4, from: 5, to: null },
    ]);
    expect(heatLevel(2, [2, 2, 5])).toBe(3);
  });
});

const m = (month: string, value: number | null, extra: Partial<SeriesMonthLike> = {}): SeriesMonthLike => ({
  month,
  value,
  raw_before: value,
  source: "NOAA-20",
  quality: "high",
  estimated: false,
  status: "final",
  ...extra,
});

describe("격자와 칸 상태 (4-4, 4-5)", () => {
  // 2012-02부터 시작하는 시·군·구, 2013-02에서 끝나고 그 달은 집계 중
  const months: SeriesMonthLike[] = [
    m("2012-02", 0, { source: "S-NPP→NOAA-20" }),
    m("2012-03", 7, { source: "S-NPP→NOAA-20", estimated: true }),
    m("2012-04", null),
    ...Array.from({ length: 8 }, (_, i) => m(`2012-${String(i + 5).padStart(2, "0")}`, 1)),
    m("2013-01", 2, { status: "nrt" }),
    m("2013-02", 4, { status: "partial" }),
  ];
  const rows = buildGrid({
    months,
    bins: [1, 3, 6],
    basis: "harmonized",
    startYear: 2012,
    selected: "2012-03",
    clickRange: { first: "2001-01", last: "2013-01" },
  });
  const cell = (month: string) => rows.flatMap((r) => r.cells).find((c) => c.month === month);

  it("위가 최근 해, 한 해에 12칸", () => {
    expect(rows.map((r) => r.year)).toEqual([2013, 2012]);
    expect(rows.every((r) => r.cells.length === 12)).toBe(true);
  });

  it("첫 달 앞은 빈칸, 마지막 달 뒤는 아직 집계 전(앞쪽을 집계 전으로 칠하지 않는다)", () => {
    expect(cell("2012-01")?.state).toBe("blank");
    expect(cell("2013-03")?.state).toBe("future");
  });

  it("값 null은 관측 자료 없음, 0은 감지 없음, 집계 중, 값", () => {
    expect(cell("2012-04")?.state).toBe("noData");
    expect(cell("2012-02")?.state).toBe("zero");
    expect(cell("2013-02")?.state).toBe("partial");
    expect(cell("2012-03")).toMatchObject({ state: "value", level: 4, converted: true, estimated: true, selected: true });
    expect(cell("2013-01")?.nrt).toBe(true);
  });

  it("누를 수 있는 칸: 값·0·집계 중이고 나라 달 범위 안", () => {
    expect(cell("2012-03")?.clickable).toBe(true);
    expect(cell("2012-02")?.clickable).toBe(true);
    expect(cell("2012-04")?.clickable).toBe(false);
    expect(cell("2013-03")?.clickable).toBe(false);
    // 집계 중이지만 나라 범위(2013-01까지) 밖
    expect(cell("2013-02")?.clickable).toBe(false);
  });

  it("빈칸·자료 없음에는 환산 표시를 붙이지 않는다", () => {
    expect(cell("2012-04")?.converted).toBe(false);
  });
});

describe("보정 전 격자 (9장 2차)", () => {
  // 시·군·구처럼 2012년 전 value는 null인데 raw_before는 0으로 온다(서버 2026-11-15)
  const months: SeriesMonthLike[] = [
    m("2011-12", null, { raw_before: 0, source: "MODIS→NOAA-20" }),
    m("2012-02", 10, { raw_before: 4, source: "S-NPP→NOAA-20", estimated: true }),
    m("2012-03", 8, { raw_before: null, source: "S-NPP→NOAA-20" }),
    m("2018-04", 7, { raw_before: 7, source: "NOAA-20" }),
  ];
  const grid = (basis: "harmonized" | "raw") =>
    buildGrid({ months, bins: [1, 3, 6], basis, startYear: 2011, selected: "2012-02", clickRange: { first: "2001-01", last: "2018-12" } });
  const cell = (basis: "harmonized" | "raw", month: string) => grid(basis).flatMap((r) => r.cells).find((c) => c.month === month);

  it("보정 전은 raw_before로 칠하고 같은 색 구간을 쓴다", () => {
    expect(cell("harmonized", "2012-02")).toMatchObject({ value: 10, level: 4 });
    expect(cell("raw", "2012-02")).toMatchObject({ value: 4, level: 3 });
  });

  it("보정 전에는 환산 점무늬·추정을 붙이지 않고, 관측 위성을 적는다", () => {
    expect(cell("harmonized", "2012-02")).toMatchObject({ converted: true, estimated: true, sensor: null });
    expect(cell("raw", "2012-02")).toMatchObject({ converted: false, estimated: false, sensor: "S-NPP" });
    expect(cell("raw", "2018-04")?.sensor).toBe("NOAA-20");
  });

  it("보정 후 값이 없는 달은 raw_before가 0이어도 관측 자료 없음, 보정 전 값이 없으면 관측 자료 없음", () => {
    expect(cell("raw", "2011-12")).toMatchObject({ state: "noData", value: null, sensor: null });
    // 보정 전 값이 없어 칠하지는 않지만, 달 이동은 보정 후 값 기준이라 그대로 누를 수 있다
    expect(cell("raw", "2012-03")).toMatchObject({ state: "noData", clickable: true });
    expect(cell("raw", "2011-12")?.clickable).toBe(false);
  });

  it("보정 전 값이 한 달도 없으면(시·도) 전환할 수 없다", () => {
    expect(hasRawValues(months)).toBe(true);
    expect(hasRawValues(months.map((x) => ({ ...x, raw_before: null })))).toBe(false);
    expect(basisValue(months[0] as SeriesMonthLike, "raw")).toBeNull();
    // 보정 후 값이 없는 달의 보정 전 0만 있으면(시·군·구 2012년 전) 전환해도 빈 격자라 막는다
    expect(hasRawValues([m("2011-12", null, { raw_before: 0 }), m("2012-02", 3, { raw_before: null })])).toBe(false);
  });
});

describe("구분선과 표시 연도", () => {
  it("선은 그 해 행의 아래, 양쪽 해가 모두 보일 때만", () => {
    const all = new Set([2019, 2018, 2017, 2013, 2012, 2011]);
    expect(dividerAfter(2018, all)).toBe("noaa20");
    expect(dividerAfter(2012, all)).toBe("snpp");
    expect(dividerAfter(2012, new Set([2013, 2012]))).toBeNull();
    expect(dividerAfter(2015, all)).toBeNull();
  });

  it("시·군·구는 비교 기간 시작 해부터, 나라·시·도는 전체 또는 2012년부터", () => {
    expect(startYearFor("all", 2001, null)).toBe(2001);
    expect(startYearFor("viirs", 2001, null)).toBe(2012);
    expect(startYearFor("all", 2001, 2012)).toBe(2012);
  });
});
