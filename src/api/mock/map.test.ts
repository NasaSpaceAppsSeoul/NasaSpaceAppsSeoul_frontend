import { describe, expect, it } from "vitest";
import type { MapResponse, SeriesResponse } from "../types";
import { mockGet } from "./index";
import { kor } from "./kor";
import { lastPointMonth, mockMap } from "./map-route";

const UISEONG = "91817680B75376031789242";
const ULLEUNG = "91817680B98862203953263";

async function map(path: string): Promise<MapResponse> {
  return (await mockGet(path)) as MapResponse;
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("실패해야 하는데 성공했다");
}

describe("목 /map", () => {
  it("검사 순서: month 없음·형식 400 → 범위 400 → parent 404", async () => {
    expect(await caught(mockGet("/KOR/map"))).toMatchObject({ status: 400, code: "INVALID_PARAM" });
    expect(await caught(mockGet("/KOR/map?month=2025-3"))).toMatchObject({ status: 400, code: "INVALID_PARAM" });
    expect(await caught(mockGet("/KOR/map?month=2000-12&parent=x"))).toMatchObject({
      status: 400,
      code: "MONTH_OUT_OF_RANGE",
    });
    expect(await caught(mockGet("/KOR/map?month=2025-03&parent="))).toMatchObject({ status: 404, code: "REGION_NOT_FOUND" });
    expect(await caught(mockGet(`/KOR/map?month=2025-03&parent=${UISEONG}`))).toMatchObject({
      status: 404,
      code: "REGION_NOT_FOUND",
    });
  });

  it("감지 점의 마지막 달은 나라 달 범위보다 한 달 앞이다(5-9)", async () => {
    expect(lastPointMonth("KOR")).toBe("2026-10");
    expect(await caught(mockGet("/KOR/map?month=2026-11"))).toMatchObject({ code: "MONTH_OUT_OF_RANGE" });
    expect((await map("/KOR/map?month=2026-10")).month).toBe("2026-10");
  });

  it("value는 /series와 같고 map_bin은 bins [3, 10, 30]로 나뉜다. 2025-03 울릉군은 빠진다", async () => {
    const res = await map("/KOR/map?month=2025-03");
    expect(res.parent).toBe("KOR");
    expect(res.points.sensor).toBe("NOAA-20");
    expect(res.regions.map((r) => r.id)).not.toContain(ULLEUNG);
    const uiseong = res.regions.find((r) => r.id === UISEONG);
    const series = (await mockGet(`/KOR/series/${UISEONG}?from=2025-03&to=2025-03`)) as SeriesResponse;
    expect(uiseong?.value).toBe(series.months[0]?.value);
    for (const r of res.regions) {
      expect("reason" in r).toBe(false);
      const v = r.value ?? -1;
      const expected = v === 0 ? 0 : v < 3 ? 1 : v < 10 ? 2 : v < 30 ? 3 : 4;
      expect(r.map_bin).toBe(expected);
    }
  });

  it("2012-02 전 달은 값·단계가 null이고 reason 키가 있으며 MODIS 점은 온다", async () => {
    const res = await map("/KOR/map?month=2005-03");
    expect(res.points.sensor).toBe("MODIS");
    expect(res.regions.every((r) => r.value === null && r.map_bin === null && r.reason === "PRE_2012_DISTRICT")).toBe(
      true,
    );
    expect(res.points.items.length).toBeGreaterThan(0);
  });

  it("parent=시·도면 그 시·도의 시·군·구와 그 안의 점만", async () => {
    const res = await map(`/KOR/map?month=2025-03&parent=${encodeURIComponent("경북")}`);
    const gyeongbuk = new Set(kor.regions.filter((r) => r.province === "경북" && r.level === "dist").map((r) => r.id));
    expect(res.parent).toBe("경북");
    expect(res.regions.every((r) => gyeongbuk.has(r.id))).toBe(true);
    expect(res.points.items.every((p) => p[3] !== null && gyeongbuk.has(p[3]))).toBe(true);
  });

  it("나라 전체에는 경계 밖 점(region_id null)이 있다", async () => {
    const res = await map("/KOR/map?month=2025-03");
    expect(res.points.items.some((p) => p[3] === null)).toBe(true);
    expect(res.points.count).toBe(res.points.shown);
  });

  it("상한을 넘으면 상한만큼 날짜순으로 보내고 count는 원래 개수다", () => {
    const res = mockMap("KOR", kor, new URLSearchParams("month=2025-03"), 10);
    expect(res.points.count).toBeGreaterThan(10);
    expect(res.points.shown).toBe(10);
    expect(res.points.items).toHaveLength(10);
    const days = res.points.items.map((p) => p[2]);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("캘리포니아도 같은 모양으로 답한다", async () => {
    const res = await map("/CAL/map?month=2020-09");
    expect(res.parent).toBe("CAL");
    expect(res.regions).toHaveLength(6);
  });
});
