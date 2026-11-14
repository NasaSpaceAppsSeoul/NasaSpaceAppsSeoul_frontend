import { describe, expect, it } from "vitest";
import { calendarLayout, IMAGE } from "./calendarImage";
import { buildGrid } from "./heatmap";
import { calendarFileName, csvFileName } from "./saveFile";
import { dotKind } from "../components/heatmap/calendarPng";

const months = Array.from({ length: 12 * 3 }, (_, i) => {
  const year = 2011 + Math.floor(i / 12);
  const m = (i % 12) + 1;
  return {
    month: `${year}-${String(m).padStart(2, "0")}`,
    value: m === 2 ? null : m,
    source: year < 2012 ? "MODIS→NOAA-20" : "NOAA-20",
    quality: "high" as const,
    estimated: false,
    status: "final" as const,
  };
});
const rows = buildGrid({ months, bins: [2, 5, 9], startYear: 2011, selected: "2012-03", clickRange: { first: "2011-01", last: "2013-12" } });

describe("달력 PNG 배치 (9장)", () => {
  it("해는 왼쪽부터 오래된 순, 달은 위가 1월, 칸은 해 × 12", () => {
    const layout = calendarLayout(rows);
    if (layout === null) throw new Error("빈 배치");
    expect(layout.years.map((y) => y.year)).toEqual([2011, 2012, 2013]);
    expect(layout.months[0]?.month).toBe(1);
    expect(layout.dots).toHaveLength(36);
    const first = layout.dots[0];
    expect(first?.cell.month).toBe("2011-01");
    expect(first?.x).toBe(layout.years[0]?.x);
    expect(layout.width).toBeGreaterThanOrEqual(IMAGE.minWidth);
  });

  it("센서 전환 점선은 2012 칸의 왼쪽 끝(2011과 2012 사이)", () => {
    const layout = calendarLayout(rows);
    const col2012 = layout?.years.find((y) => y.year === 2012);
    expect(layout?.dividers).toEqual([{ x: (col2012?.x ?? 0) - IMAGE.colWidth / 2, key: "snpp" }]);
  });

  it("빈 격자면 null", () => {
    expect(calendarLayout([])).toBeNull();
  });

  it("파일 이름: 나라·지역 ID, 파일에 못 쓰는 글자는 _", () => {
    expect(csvFileName("KOR", "경북")).toBe("burnline_KOR_경북.csv");
    expect(calendarFileName("CHL", "Región de Antofagasta")).toBe("burnline_CHL_Región_de_Antofagasta_calendar.png");
    expect(csvFileName("KOR", "a/b")).toBe("burnline_KOR_a_b.csv");
  });

  it("칸 상태 → 그림 모양(빈칸은 그리지 않음, 환산 점무늬는 모양과 따로)", () => {
    const base = rows[0]?.cells[0];
    if (base === undefined) throw new Error("빈 격자");
    const cell = (state: "blank" | "future" | "noData" | "partial" | "zero" | "value") => ({ cell: { ...base, state } });
    expect(dotKind(cell("blank"))).toBeNull();
    expect(dotKind(cell("future"))).toBe("future");
    expect(dotKind(cell("noData"))).toBe("noData");
    expect(dotKind(cell("partial"))).toBe("partial");
    expect(dotKind(cell("zero"))).toBe("value");
    expect(dotKind(cell("value"))).toBe("value");
  });
});
