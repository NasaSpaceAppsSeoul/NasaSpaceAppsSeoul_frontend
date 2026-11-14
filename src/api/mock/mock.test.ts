import { describe, expect, it } from "vitest";
import { ApiError } from "../client";
import type { GeoFeatureCollection, Meta, RegionsResponse } from "../types";
import { bc } from "./bc";
import { cal } from "./cal";
import { createMockGet, mockGet } from "./index";
import { kor } from "./kor";

const ids = (fc: GeoFeatureCollection) => fc.features.map((f) => f.properties.id);

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("실패해야 하는데 성공했다");
}

async function regions(path: string): Promise<RegionsResponse> {
  return (await mockGet(path)) as RegionsResponse;
}

async function geo(path: string): Promise<GeoFeatureCollection> {
  return (await mockGet(path)) as GeoFeatureCollection;
}

describe("/meta", () => {
  it("세 나라의 labels는 백엔드 Country.java 값이다", async () => {
    const korMeta = (await mockGet("/KOR/meta")) as Meta;
    expect(korMeta.labels).toMatchObject({ single: false, lv1: "시·도", lv2: "시·군·구", bins: [3, 10, 30] });
    const calMeta = (await mockGet("/CAL/meta")) as Meta;
    expect(calMeta.labels).toMatchObject({ single: true, lv2: "카운티", bins: [3, 8, 18] });
    const bcMeta = (await mockGet("/BC/meta")) as Meta;
    expect(bcMeta.labels).toMatchObject({ single: true, lv2: "지역구", bins: [2, 8, 47] });
  });

  it("받은 쪽이 고쳐도 목 원본은 그대로다", async () => {
    const meta = (await mockGet("/KOR/meta")) as Meta;
    meta.labels.country = "바뀜";
    expect(((await mockGet("/KOR/meta")) as Meta).labels.country).toBe("대한민국");
  });
});

describe("/regions", () => {
  it("한국은 나라 1 + 시·도 17 + 시·군·구 229, 나라 → 시·도 → 시·군·구 순서", async () => {
    const { items } = await regions("/KOR/regions");
    expect(items).toHaveLength(247);
    expect(items[0]).toMatchObject({ id: "KOR", level: "nat", label_ko: "대한민국" });
    expect(items.filter((r) => r.level === "prov")).toHaveLength(17);
    expect(items.filter((r) => r.level === "dist")).toHaveLength(229);
    expect(items.findIndex((r) => r.level === "dist")).toBe(18);
  });

  it("같은 이름의 시·군·구가 시·도로 구분된다", async () => {
    const { items } = await regions("/KOR/regions?level=dist");
    const goseong = items.filter((r) => r.label_ko === "고성군").map((r) => r.province);
    expect(goseong.sort()).toEqual(["강원", "경남"]);
  });

  it("level과 q로 거른다", async () => {
    expect((await regions("/KOR/regions?level=prov")).items).toHaveLength(17);
    const uiseong = (await regions(`/KOR/regions?q=${encodeURIComponent("의성")}`)).items;
    expect(uiseong.map((r) => r.label_ko)).toEqual(["의성군"]);
    expect((await regions("/CAL/regions?level=prov")).items).toEqual([]);
  });

  it("캘리포니아·캐나다는 주 전체 1 + 6곳, province는 null, 주 전체 이름만 한글", async () => {
    for (const code of ["CAL", "BC"]) {
      const { items } = await regions(`/${code}/regions`);
      expect(items).toHaveLength(7);
      expect(items[0]).toMatchObject({ id: code, level: "nat" });
      expect(items.every((r) => r.province === null)).toBe(true);
    }
    expect((await regions("/BC/regions")).items.some((r) => r.id === "BC-RD-41")).toBe(true);
  });

  it("목 데이터 파일은 읽을 때 타입 검사를 통과한다", () => {
    expect(kor.regions.length).toBe(247);
    expect(cal.regions.length).toBe(7);
    expect(bc.regions.length).toBe(7);
  });
});

describe("/geo", () => {
  it("parent 없는 dist는 전체 경계, 영광군은 도형이 없다(목의 한계)", async () => {
    const all = await geo("/KOR/geo");
    expect(all.features).toHaveLength(228);
    expect(ids(all)).not.toContain("PATCH-KOR-Yeonggwang");
    expect(ids(await geo("/KOR/geo?level=dist"))).toEqual(ids(all));
  });

  it("parent는 상위 ID와 정확히 비교한다", async () => {
    const gyeongbuk = await geo(`/KOR/geo?parent=${encodeURIComponent("경북")}`);
    expect(gyeongbuk.features.length).toBeGreaterThan(0);
    expect(gyeongbuk.features.every((f) => f.properties.province === "경북")).toBe(true);
    expect((await geo("/KOR/geo?parent=KOR")).features).toEqual([]);
    expect((await geo("/KOR/geo?parent=")).features).toEqual([]);
    expect((await geo("/CAL/geo?parent=CAL")).features).toHaveLength(6);
  });

  it("level=nat: 한국은 빈 목록, 캘리포니아·캐나다는 주 경계 하나", async () => {
    expect((await geo("/KOR/geo?level=nat")).features).toEqual([]);
    expect(ids(await geo("/CAL/geo?level=nat"))).toEqual(["CAL"]);
    expect(ids(await geo("/BC/geo?level=nat"))).toEqual(["BC"]);
    expect((await geo("/BC/geo?level=prov")).features).toEqual([]);
  });

  it("한국 시·도 경계는 아직 목에 없다(4장)", async () => {
    expect(await caught(mockGet("/KOR/geo?level=prov"))).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("잘못된 level은 400 INVALID_PARAM", async () => {
    expect(await caught(mockGet("/KOR/geo?level=city"))).toMatchObject({ status: 400, code: "INVALID_PARAM" });
  });
});

describe("목에 없는 요청 (decisions 10-6)", () => {
  it("모르는 나라 코드는 어느 경로든 COUNTRY_NOT_READY", async () => {
    for (const path of ["/JPN/meta", "/JPN/regions", "/kor/geo"]) {
      const error = await caught(mockGet(path));
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 404, code: "COUNTRY_NOT_READY" });
    }
  });

  it("목 묶음이 없는 나라(준비 안 된 나라)는 /meta만 404이고 /regions·/geo는 빈 목록", async () => {
    const onlyKorea = createMockGet({ KOR: kor }, 0);
    expect(await caught(onlyKorea("/BC/meta"))).toMatchObject({ status: 404, code: "COUNTRY_NOT_READY" });
    expect(await onlyKorea("/BC/regions")).toEqual({ items: [] });
    expect(await onlyKorea("/BC/geo")).toEqual({ type: "FeatureCollection", features: [] });
  });

  it("모르는 지역 ID는 REGION_NOT_FOUND", async () => {
    expect(await caught(mockGet("/KOR/regions/NOPE"))).toMatchObject({ status: 404, code: "REGION_NOT_FOUND" });
  });

  it("목에 아직 없는 경로는 NOT_FOUND이고 message로 구분한다", async () => {
    const error = await caught(mockGet("/KOR/judgement/KOR?month=2025-03"));
    expect(error).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(error instanceof ApiError && error.message.startsWith("mock: not implemented")).toBe(true);
  });

  it("취소하면 지연 중에 멈춘다", async () => {
    const slow = createMockGet({ KOR: kor }, 1000);
    const controller = new AbortController();
    const pending = caught(slow("/KOR/meta", controller.signal));
    controller.abort();
    // jsdom과 Node의 DOMException은 서로 다른 클래스라 instanceof 대신 이름을 본다
    expect(await pending).toMatchObject({ name: "AbortError" });
  });
});
