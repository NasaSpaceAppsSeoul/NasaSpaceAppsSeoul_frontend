import { describe, expect, it } from "vitest";
import { ApiError } from "../client";
import type { Insight, Judgement } from "../types";
import { mockGet } from "./index";
import { ANDONG, UISEONG } from "./series-overrides";

async function insight(path: string): Promise<Insight> {
  return (await mockGet(path)) as Insight;
}

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof ApiError) return e;
    throw e;
  }
  throw new Error("실패해야 하는데 성공했다");
}

describe("/insight 목: 의성 2025-03 (spec_test.py 기대값)", () => {
  it("머리·빌린 판정·묶음·연도·계절·공식 기록·이웃", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2025-03`);
    expect(r.head).toMatchObject({
      value: 384, chip: null, region_type: "sparse", judge_unit: "province",
      fire_days: 7, dmax_date: "2025-03-26", annual: 2.6, annual_all: 30.0, rank: 1, n: 14,
    });
    expect([r.ref?.id, r.ref?.chip, r.ref?.ratio_to_median]).toEqual(["경북", "record", 72.64]);
    expect(r.prov).toEqual(r.ref);
    expect(r.calendar?.main_cluster).toMatchObject({
      start: "2025-03-22", end: "2025-03-29", days: 8, cells: 919, peak_cells: 551, peak_date: "2025-03-26",
    });
    expect(r.calendar?.clusters).toMatchObject({ events: 3, big_events: 1 });
    expect(r.calendar?.daily["26"]).toBe(r.head.dmax);
    expect(r.years).toMatchObject({ band_low: null, band_high: null, yrs_fire: 3, median: 0 });
    expect(r.years.longterm).toEqual({ fire_cells_2001_2025: 477.3, annual_avg: 19.1, quality: "high" });
    expect(r.season.own_mt).toHaveLength(12);
    expect(r.season.ref_mt).toHaveLength(12);
    expect([r.season.risk_months, r.season.risk_from]).toEqual([[3], "province"]);
    expect(r.official?.[0]).toEqual({
      date: "2025-03-22", place: "경북 의성 안계", cause: "농산폐기물 태우기", area_ha: 52707.3, region_id: UISEONG,
    });
    expect(r.map?.points[0]).toHaveLength(3);
    expect(r.neighbors.find((n) => n.id === ANDONG)?.v).toBe(220);
    expect(r.unavailable).toEqual([]);
  });

  it("머리 값과 판정은 /judgement와 같다", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2025-03`);
    const j = (await mockGet(`/KOR/judgement/${UISEONG}?month=2025-03`)) as Judgement;
    expect([r.head.value, r.head.chip, r.head.reason]).toEqual([j.value, j.chip, j.reason]);
  });
});

describe("/insight 목: 달에 따라", () => {
  it("2026년 달은 strip·top_years에 2026이 없고, 드문 지역 head.rank·n은 null", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2026-03`);
    expect(r.years.strip?.some((row) => row.year === 2026)).toBe(false);
    expect(r.rank.top_years?.some((row) => row.year === 2026)).toBe(false);
    expect([r.head.rank, r.head.n]).toEqual([null, null]);
    expect(r.head.value).not.toBeNull();
  });

  it("2012-02 전: 값·fire_days·dmax는 null인데 달력에 MODIS 점이 있다. 묶음은 null", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2010-05`);
    expect([r.head.value, r.head.fire_days, r.head.dmax, r.head.reason]).toEqual([null, null, null, "PRE_2012_DISTRICT"]);
    expect(Object.keys(r.calendar?.daily ?? {}).length).toBeGreaterThan(0);
    expect(r.calendar?.main_cluster).toBeNull();
  });

  it("이웃은 백엔드 정렬(값 큰 순, null은 0보다 앞)", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2025-03`);
    const key = (v: number | null) => (v === null ? -0.5 : v);
    const values = r.neighbors.map((n) => key(n.v));
    expect([...values].sort((a, b) => b - a)).toEqual(values);
    expect(r.neighbors.some((n) => n.id === UISEONG)).toBe(false);
  });
});

describe("/insight 목: 일부 실패 (10-5)", () => {
  it("의성 2024-03: spatial 실패", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2024-03`);
    expect(r.unavailable).toEqual(["spatial"]);
    expect([r.calendar, r.official, r.detect_rate, r.map, r.data_version]).toEqual([null, null, null, null, null]);
    expect([r.head.fire_days, r.head.dmax, r.years.yrs_fire]).toEqual([null, null, null]);
    expect(r.years.strip).not.toBeNull();
  });

  it("의성 2023-03: series 실패", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2023-03`);
    expect(r.unavailable).toEqual(["series"]);
    expect([r.years.strip, r.rank.top_years, r.season.own_mt, r.head.rank, r.head.n]).toEqual([null, null, null, null, null]);
    expect(r.calendar).not.toBeNull();
  });

  it("의성 2022-03: judge 실패(이웃 판정도 모두 빠짐)", async () => {
    const r = await insight(`/KOR/insight/${UISEONG}?month=2022-03`);
    expect(r.unavailable).toEqual(["judge", "neighbors"]);
    expect([r.head.value, r.head.chip, r.head.reason, r.ref, r.prov, r.years.median]).toEqual([null, null, null, null, null, null]);
    expect(r.neighbors).toEqual([]);
    expect(r.map).not.toBeNull();
  });
});

describe("/insight 목: 에러 순서 (백엔드: 달 형식 → 지역 → 시·군·구 → 달 범위)", () => {
  it("없는 지역 + 잘못된 달 형식은 400 INVALID_PARAM", async () => {
    const e = await caught(mockGet("/KOR/insight/NOPE?month=2025-3"));
    expect([e.status, e.code]).toEqual([400, "INVALID_PARAM"]);
  });

  it("없는 지역은 404 REGION_NOT_FOUND", async () => {
    const e = await caught(mockGet("/KOR/insight/NOPE?month=2025-03"));
    expect([e.status, e.code]).toEqual([404, "REGION_NOT_FOUND"]);
  });

  it("시·도 ID는 400 INVALID_PARAM", async () => {
    const e = await caught(mockGet(`/KOR/insight/${encodeURIComponent("경북")}?month=2025-03`));
    expect([e.status, e.code]).toEqual([400, "INVALID_PARAM"]);
  });

  it("범위 밖 달은 400 MONTH_OUT_OF_RANGE", async () => {
    const e = await caught(mockGet(`/KOR/insight/${UISEONG}?month=2030-01`));
    expect([e.status, e.code]).toEqual([400, "MONTH_OUT_OF_RANGE"]);
  });

  it("캘리포니아 카운티도 답한다(prov 없음, 주 전체를 빌림)", async () => {
    const regions = (await mockGet("/CAL/regions?level=dist")) as { items: { id: string; region_type: string }[] };
    const sparse = regions.items.find((r) => r.region_type === "sparse");
    expect(sparse).toBeDefined();
    const r = await insight(`/CAL/insight/${encodeURIComponent(sparse?.id ?? "")}?month=2025-08`);
    expect(r.prov).toBeNull();
    expect(r.ref?.id).toBe("CAL");
  });
});
