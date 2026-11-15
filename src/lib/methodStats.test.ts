import { describe, expect, it } from "vitest";
import {
  CELL_LOADING,
  CELL_MISSING,
  corrCell,
  formatPct,
  gridCell,
  officialCell,
  pctCell,
  queryCell,
  satelliteCell,
} from "./methodStats";

const grid = [
  { "격자(도)": 0.1, "월별 R²": 0.74, "연간 오차 %": 16.3 },
  { "격자(도)": 0.01, "월별 R²": 0.923, "연간 오차 %": 14.9 },
  { "격자(도)": 0.05, "월별 R²": null, "연간 오차 %": 15.8 },
];
const done = <T>(data: T) => ({ isPending: false, isError: false, isFetching: false, data });

describe("기법 표 칸 글자 (9장 3차)", () => {
  it("칸 크기 줄: R² 둘째 자리 · 오차 첫째 자리, 줄이나 값이 없으면 null", () => {
    expect(gridCell(grid, 0.01, "ko")).toBe("0.92 · 14.9%");
    expect(gridCell(grid, 0.1, "en")).toBe("0.74 · 16.3%");
    expect(gridCell(grid, 0.05, "ko")).toBeNull();
    expect(gridCell(grid, 0.02, "ko")).toBeNull();
    expect(gridCell(null, 0.01, "ko")).toBeNull();
  });

  it("백분율은 .0도 남기고, 순위 상관은 하나라도 없으면 null", () => {
    expect(formatPct(14, "ko")).toBe("14.0%");
    expect(pctCell(7.4, "ko")).toBe("7.4%");
    expect(pctCell(null, "ko")).toBeNull();
    expect(pctCell(undefined, "ko")).toBeNull();
    expect(corrCell([0.4, 0.93], "ko")).toBe("0.40 / 0.93");
    expect(corrCell([0.75], "ko")).toBe("0.75");
    expect(corrCell([0.69, null], "ko")).toBeNull();
  });

  it("단절: 보정 전 → 후 [범위], 범위가 없으면 뺀다. 공식 기록은 두 값만", () => {
    expect(satelliteCell(2.8, { ratio: 1.01, ci95: [0.98, 1.04] }, "ko")).toBe("2.80 → 1.01 [0.98–1.04]");
    expect(satelliteCell(2.61, { ratio: 0.99, ci95: null }, "ko")).toBe("2.61 → 0.99");
    expect(satelliteCell(null, { ratio: 0.99, ci95: null }, "ko")).toBeNull();
    expect(satelliteCell(2.61, { ratio: null, ci95: null }, "ko")).toBeNull();
    expect(officialCell({ before: 1.96, after: 0.71, inconclusive: true }, "ko")).toBe("1.96 → 0.71");
    expect(officialCell(null, "ko")).toBeNull();
  });

  it("요청 상태: 받는 중·다시 묻는 중은 …, 실패·값 없음은 —", () => {
    const pick = (n: number) => (n > 0 ? String(n) : null);
    expect(queryCell({ isPending: true, isError: false, isFetching: true, data: undefined }, pick)).toBe(CELL_LOADING);
    expect(queryCell({ isPending: false, isError: true, isFetching: true, data: undefined }, pick)).toBe(CELL_LOADING);
    expect(queryCell({ isPending: false, isError: true, isFetching: false, data: undefined }, pick)).toBe(CELL_MISSING);
    expect(queryCell(done(0), pick)).toBe(CELL_MISSING);
    expect(queryCell(done(3), pick)).toBe("3");
  });
});
