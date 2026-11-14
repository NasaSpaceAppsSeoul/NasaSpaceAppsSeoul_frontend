import { describe, expect, it } from "vitest";
import { ApiError } from "../client";
import type { RegionDetail, TopResponse } from "../types";
import { mockGet } from "./index";
import { lastPointMonth } from "./map-route";
import { UISEONG } from "./series-overrides";

const ANDONG = "91817680B16014600177045";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("실패해야 하는데 성공했다");
}

const detail = async (path: string) => (await mockGet(path)) as RegionDetail;
const top = async (path: string) => (await mockGet(path)) as TopResponse;

describe("/regions/{id} 목 (B-3)", () => {
  it("나라: 이웃 없음, 위험 시기는 파이프라인 national_risk", async () => {
    const r = await detail("/KOR/regions/KOR");
    expect(r.neighbors).toEqual([]);
    expect(r.risk_months).toEqual([3, 4]);
    // 원천 0.562 → 백엔드처럼 소수 둘째 자리
    expect(r.risk_share).toBe(0.56);
    expect(r.risk_from).toBe("self");
  });

  it("시·군·구: 파이프라인 이웃, 다른 시·도 이웃에만 province 키", async () => {
    const r = await detail(`/KOR/regions/${UISEONG}`);
    expect(r.neighbors.map((n) => n.id)).toContain(ANDONG);
    const andong = r.neighbors.find((n) => n.id === ANDONG);
    expect(andong !== undefined && "province" in andong).toBe(false);
    const other = r.neighbors.filter((n) => "province" in n);
    other.forEach((n) => expect(n.province).not.toBe("경북"));
    expect(r.judge_unit).toBeDefined();
  });

  it("다른 시·도와 맞닿은 시·군·구는 그 이웃에 province가 붙는다", async () => {
    const regions = (await mockGet("/KOR/regions")) as { items: { id: string; label_ko: string; province: string | null }[] };
    const gunwi = regions.items.find((r) => r.label_ko === "군위군");
    expect(gunwi).toBeDefined();
    const r = await detail(`/KOR/regions/${gunwi?.id ?? ""}`);
    expect(r.neighbors.some((n) => n.province !== undefined && n.province !== gunwi?.province)).toBe(true);
  });

  it("시·도: 이웃은 시·도 ID", async () => {
    const r = await detail(`/KOR/regions/${encodeURIComponent("경북")}`);
    expect(r.neighbors.map((n) => n.id)).toContain("강원");
    expect(r.neighbors.every((n) => n.province === n.id)).toBe(true);
  });

  it("CAL: 격자에서 맞닿은 칸이 이웃이고 위험 시기를 만든다", async () => {
    const r = await detail("/CAL/regions/52423323B10000000000001");
    expect(r.neighbors.length).toBeGreaterThan(0);
    expect(r.neighbors.every((n) => !("province" in n))).toBe(true);
    expect(r.risk_months.length).toBeGreaterThan(0);
  });

  it("7장 /insight의 위험 시기와 같은 값(백엔드는 같은 카탈로그 값을 쓴다)", async () => {
    const d = await detail(`/KOR/regions/${ANDONG}`);
    const insight = (await mockGet(`/KOR/insight/${ANDONG}?month=2024-03`)) as { season: { risk_months: number[]; risk_share: number | null } };
    expect(insight.season.risk_months).toEqual(d.risk_months);
    expect(insight.season.risk_share).toBe(d.risk_share);
  });

  it("모르는 ID는 404 REGION_NOT_FOUND", async () => {
    expect(await caught(mockGet("/KOR/regions/NOPE"))).toMatchObject({ status: 404, code: "REGION_NOT_FOUND" });
  });
});

describe("/top 목 (E-3)", () => {
  it("시·도: 값 > 0인 3곳, 순위 → 값 순, 이름에 시·도", async () => {
    const r = await top(`/KOR/top?month=2025-03&parent=${encodeURIComponent("경북")}`);
    expect(r.items.length).toBeLessThanOrEqual(3);
    expect(r.items.every((i) => i.value > 0 && i.label_ko.startsWith("경북 "))).toBe(true);
    for (let i = 1; i < r.items.length; i += 1) {
      const a = r.items[i - 1];
      const b = r.items[i];
      if (a === undefined || b === undefined) continue;
      expect((a.rank ?? 99) < (b.rank ?? 99) || ((a.rank ?? 99) === (b.rank ?? 99) && a.value >= b.value)).toBe(true);
    }
  });

  it("시·군·구: 맞닿은 지역 전부, 값 큰 순, 0 포함, 이름만", async () => {
    const r = await top(`/KOR/top?month=2025-03&parent=${UISEONG}`);
    const d = await detail(`/KOR/regions/${UISEONG}`);
    expect(r.items.map((i) => i.id).sort()).toEqual(d.neighbors.map((n) => n.id).sort());
    expect(r.items.some((i) => i.id === UISEONG)).toBe(false);
    expect(r.items.map((i) => i.value)).toEqual([...r.items.map((i) => i.value)].sort((a, b) => b - a));
    expect(r.items.every((i) => !i.label_ko.startsWith("경북 "))).toBe(true);
  });

  it("2012-02 전 달은 시·군·구 parent도 빈 목록", async () => {
    expect((await top(`/KOR/top?month=2010-03&parent=${UISEONG}`)).items).toEqual([]);
    expect((await top(`/KOR/top?month=2010-03&parent=${encodeURIComponent("경북")}`)).items).toEqual([]);
  });

  it("검사 순서: 형식 400 → 범위 400 → 모르는 parent 404", async () => {
    expect(await caught(mockGet("/KOR/top?month=2025-3&parent=NOPE"))).toMatchObject({ status: 400, code: "INVALID_PARAM" });
    expect(await caught(mockGet("/KOR/top?month=1999-01&parent=NOPE"))).toMatchObject({ status: 400, code: "MONTH_OUT_OF_RANGE" });
    expect(await caught(mockGet(`/KOR/top?month=${lastPointMonth("KOR")}&parent=NOPE`))).toMatchObject({
      status: 404,
      code: "REGION_NOT_FOUND",
    });
  });

  it("CAL: 이름만", async () => {
    const r = await top("/CAL/top?month=2025-08&parent=CAL");
    const regions = (await mockGet("/CAL/regions")) as { items: { id: string; label_ko: string }[] };
    const names = new Map(regions.items.map((x) => [x.id, x.label_ko]));
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((i) => i.label_ko === names.get(i.id))).toBe(true);
    expect(await caught(mockGet("/CAL/top?month=2025-08&parent="))).toBeInstanceOf(ApiError);
  });
});
