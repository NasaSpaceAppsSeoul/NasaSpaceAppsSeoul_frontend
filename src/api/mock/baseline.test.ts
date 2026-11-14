import { describe, expect, it } from "vitest";
import { ApiError } from "../client";
import type { BaselineResponse, Judgement, SeriesResponse } from "../types";
import { heatBins } from "./baseline-route";
import { mockGet } from "./index";
import { GUNPO, UISEONG } from "./series-overrides";

const FRESNO = "52423323B10000000000004";

// 목 응답 모양은 이 파일이 검사하는 대상이라 기존 목 테스트처럼 단언으로 받는다
async function baseline(country: string, id: string): Promise<BaselineResponse> {
  return (await mockGet(`/${country}/baseline/${encodeURIComponent(id)}`)) as BaselineResponse;
}

async function series(country: string, id: string): Promise<SeriesResponse> {
  return (await mockGet(`/${country}/series/${encodeURIComponent(id)}`)) as SeriesResponse;
}

async function judge(country: string, id: string, month: string): Promise<Judgement> {
  return (await mockGet(`/${country}/judgement/${encodeURIComponent(id)}?month=${month}`)) as Judgement;
}

describe("목 /baseline", () => {
  it("KOR 나라: spec_test.py 기대값과 같다", async () => {
    const b = await baseline("KOR", "KOR");
    expect(b.id).toBe("KOR");
    expect(b.period).toEqual([2001, 2025]);
    expect(b.by_month).toHaveLength(12);
    expect(b.by_month.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(b.by_month[2]).toEqual({ month: 3, median: 174, band_low: 95.6, band_high: 294.8 });
    expect(b.heat_bins).toHaveLength(3);
    expect(b.heat_bins).toEqual([...b.heat_bins].sort((x, y) => x - y));
    expect(b.heat_bins.every((v) => v > 0)).toBe(true);
  });

  it("period는 단계와 판정 기준에 따른다", async () => {
    expect((await baseline("KOR", "경북")).period).toEqual([2001, 2025]);
    expect((await baseline("KOR", "강원")).period).toEqual([2012, 2025]);
    expect((await baseline("KOR", "서울")).period).toEqual([2012, 2025]);
    expect((await baseline("KOR", UISEONG)).period).toEqual([2012, 2025]);
    expect((await baseline("CAL", "CAL")).period).toEqual([2001, 2025]);
    expect((await baseline("CAL", FRESNO)).period).toEqual([2012, 2025]);
    expect((await baseline("BC", "BC")).period).toEqual([2001, 2025]);
  });

  it("자체 판정이 아니면 범위가 null (드문 시·군·구, 빌린 판정 시·도)", async () => {
    for (const id of [UISEONG, "서울"]) {
      const b = await baseline("KOR", id);
      expect(b.by_month).toHaveLength(12);
      for (const m of b.by_month) {
        expect(m.band_low).toBeNull();
        expect(m.band_high).toBeNull();
      }
    }
  });

  it("median이 같은 달 /judgement의 median과 같다", async () => {
    for (const id of ["KOR", "경북", "서울", UISEONG]) {
      const b = await baseline("KOR", id);
      for (let m = 1; m <= 12; m += 1) {
        const j = await judge("KOR", id, `2024-${String(m).padStart(2, "0")}`);
        const row = b.by_month[m - 1];
        expect(row?.median).toBe(j.median);
        if (j.band_low !== null) expect(row?.band_low).toBe(j.band_low);
        if (j.band_high !== null) expect(row?.band_high).toBe(j.band_high);
      }
    }
  });

  it("heat_bins는 같은 지역 /series 전체의 0이 아닌 값으로 계산한다", async () => {
    for (const [country, id] of [["KOR", "KOR"], ["KOR", "경북"], ["KOR", UISEONG], ["CAL", FRESNO]] as const) {
      const values = (await series(country, id)).months.map((m) => m.value);
      expect((await baseline(country, id)).heat_bins).toEqual(heatBins(values));
    }
  });

  it("heatBins 식: 선형 보간, 소수 한 자리, 0과 null은 뺀다, 없으면 []", () => {
    expect(heatBins([null, 0, 0])).toEqual([]);
    expect(heatBins([])).toEqual([]);
    expect(heatBins([0, 1, 2, 3, 4, null])).toEqual([2.5, 3.3, 3.7]);
    expect(heatBins([7])).toEqual([7, 7, 7]);
  });

  it("감지 기록 없는 지역(군포)은 heat_bins가 [] 또는 길이 3", async () => {
    const b = await baseline("KOR", GUNPO);
    expect([0, 3]).toContain(b.heat_bins.length);
  });

  it("전 기간 0이 아닌 값이 없는 지역은 heat_bins가 [] (그런 지역이 목에 실제로 있다)", async () => {
    const { items } = (await mockGet("/KOR/regions?level=dist")) as { items: { id: string }[] };
    const empties: string[] = [];
    for (const r of items) {
      const b = await baseline("KOR", r.id);
      if (b.heat_bins.length === 0) empties.push(r.id);
      else expect(b.heat_bins).toHaveLength(3);
    }
    expect(empties.length).toBeGreaterThan(0);
  });

  it("없는 지역은 404 REGION_NOT_FOUND", async () => {
    const error = await mockGet("/KOR/baseline/NOPE").then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "REGION_NOT_FOUND" });
  });
});
