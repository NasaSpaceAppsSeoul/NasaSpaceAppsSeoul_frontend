import { describe, expect, it } from "vitest";
import { keys } from "../keys";
import type { Landing, SeriesResponse } from "../types";
import { mockGet } from "./index";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("실패해야 하는데 성공했다");
}

describe("목 /landing", () => {
  it("한국은 백엔드 기대값(spec_test.py 758–777행)과 같다", async () => {
    const l = (await mockGet("/KOR/landing")) as Landing;
    const stats = Object.fromEntries(l.stats.map((s) => [s.key, s]));
    expect(stats.burned_area_record).toMatchObject({ year: 2025, value: 105099, unit: "ha", source: "KOSIS" });
    expect(stats.case_month_ratio).toMatchObject({ month: "2025-03", value: 6.28, rank: 1, n: 25 });
    expect(stats.risk_share).toMatchObject({ value: 0.64, months: [2, 3, 4] });
    expect([l.official_break.before, l.official_break.after]).toEqual([2.67, 1.04]);
    expect(l.break_test.before).toEqual({ ratio: 0.92, ci95: [0.86, 0.98] });
    expect(l.break_test.after).toEqual({ ratio: 0.99, ci95: [0.92, 1.05] });
    expect(l.detect_by_size.find((d) => d.bin.startsWith("100 ha"))).toMatchObject({ n: 35, detected: 0.91 });
    expect(l.annual.years).toHaveLength(25);
    expect(l.annual.before).toHaveLength(25);
    expect(l.annual.after).toHaveLength(25);
  });

  it("detect_n은 단계별 n의 합이다(백엔드와 같은 규칙)", async () => {
    const l = (await mockGet("/KOR/landing")) as Landing;
    expect(l.detect_n).toBe(l.detect_by_size.reduce((sum, d) => sum + d.n, 0));
  });

  it("after는 나라 시계열 목의 해별 합(소수 한 자리)이다", async () => {
    const l = (await mockGet("/KOR/landing")) as Landing;
    const series = (await mockGet("/KOR/series/KOR?from=2013-01&to=2013-12")) as SeriesResponse;
    const sum = series.months.reduce((acc, m) => acc + (m.value ?? 0), 0);
    expect(l.annual.after[l.annual.years.indexOf(2013)]).toBe(Math.round(sum * 10) / 10);
  });

  it("목이 없는 나라는 mock: not implemented", async () => {
    const error = await caught(mockGet("/CAL/landing"));
    expect(error).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(String((error as Error).message)).toMatch(/^mock: not implemented/);
  });

  it("쿼리 키는 나라가 맨 앞이다", () => {
    expect(keys.landing("KOR")).toEqual(["KOR", "landing"]);
  });
});
