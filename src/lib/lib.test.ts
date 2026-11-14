import { describe, expect, it } from "vitest";
import { cacheMode } from "./cacheMode";
import { parseCountry } from "./country";
import { errorKind } from "./errorKind";
import { parseMonthParam } from "./month";
import { starField } from "./cosmic";
import { revealImmediately } from "./reveal";
import { routeInfo } from "./route";

describe("parseCountry", () => {
  it("대문자 세 나라만 받는다", () => {
    expect(parseCountry("KOR")).toBe("KOR");
    expect(parseCountry("CAL")).toBe("CAL");
    expect(parseCountry("BC")).toBe("BC");
    expect(parseCountry("kor")).toBeNull();
    expect(parseCountry("JPN")).toBeNull();
    expect(parseCountry("")).toBeNull();
    expect(parseCountry(undefined)).toBeNull();
  });
});

describe("parseMonthParam", () => {
  it("키가 없으면 고르지 않은 것이라 유효하다", () => {
    expect(parseMonthParam(null)).toEqual({ valid: true, month: undefined });
  });

  it("YYYY-MM만 받는다", () => {
    expect(parseMonthParam("2025-03")).toEqual({ valid: true, month: "2025-03" });
    expect(parseMonthParam("2025-12")).toEqual({ valid: true, month: "2025-12" });
    for (const bad of ["", "2025-3", "2025-00", "2025-13", "202503", "2025-03-01", " 2025-03"]) {
      expect(parseMonthParam(bad)).toEqual({ valid: false });
    }
  });
});

describe("errorKind", () => {
  const e = (status: number, code: string) => ({ status, code });

  it("서버에 닿지 않은 경우를 묶는다", () => {
    expect(errorKind(e(0, "NETWORK"))).toBe("offline");
    expect(errorKind(e(0, "TIMEOUT"))).toBe("offline");
    expect(errorKind(e(200, "BAD_BODY"))).toBe("offline");
    expect(errorKind(e(530, "UNKNOWN"))).toBe("offline");
    expect(errorKind(e(503, "UPSTREAM_UNAVAILABLE"))).toBe("offline");
    expect(errorKind(e(500, "INTERNAL"))).toBe("offline");
  });

  it("코드별로 나눈다", () => {
    expect(errorKind(e(404, "COUNTRY_NOT_READY"))).toBe("notReady");
    expect(errorKind(e(404, "REGION_NOT_FOUND"))).toBe("region");
    expect(errorKind(e(400, "MONTH_OUT_OF_RANGE"))).toBe("range");
    expect(errorKind(e(400, "INVALID_PARAM"))).toBe("other");
    expect(errorKind(e(404, "UNKNOWN"))).toBe("other");
  });

  it("ApiError 모양이 아니면 other", () => {
    expect(errorKind(new TypeError("x"))).toBe("other");
    expect(errorKind(null)).toBe("other");
    expect(errorKind("boom")).toBe("other");
  });
});

describe("cacheMode", () => {
  it("직전 요청이 실패했으면 reload, 아니면 no-cache", () => {
    expect(cacheMode(undefined)).toBe("no-cache");
    expect(cacheMode({ fetchFailureCount: 0, errorUpdatedAt: 0, dataUpdatedAt: 0 })).toBe("no-cache");
    expect(cacheMode({ fetchFailureCount: 1, errorUpdatedAt: 0, dataUpdatedAt: 0 })).toBe("reload");
    // 새 요청이 시작되면 실패 횟수는 0으로 돌아가도 마지막 실패 시각은 남는다
    expect(cacheMode({ fetchFailureCount: 0, errorUpdatedAt: 20, dataUpdatedAt: 10 })).toBe("reload");
    expect(cacheMode({ fetchFailureCount: 0, errorUpdatedAt: 10, dataUpdatedAt: 20 })).toBe("no-cache");
  });
});

describe("routeInfo", () => {
  it("언어 접두사를 떼고 화면과 나라를 읽는다", () => {
    expect(routeInfo("/")).toEqual({ section: "about", country: undefined });
    expect(routeInfo("/en")).toEqual({ section: "about", country: undefined });
    expect(routeInfo("/dashboard/CAL")).toEqual({ section: "dashboard", country: "CAL" });
    expect(routeInfo("/en/dashboard/BC/BC-RD-41")).toEqual({ section: "dashboard", country: "BC" });
    expect(routeInfo("/insight/KOR/abc")).toEqual({ section: "dashboard", country: "KOR" });
    expect(routeInfo("/dashboard")).toEqual({ section: "dashboard", country: undefined });
    expect(routeInfo("/dashboard/kor")).toEqual({ section: "dashboard", country: undefined });
    expect(routeInfo("/nope")).toEqual({ section: null, country: undefined });
  });
});

describe("revealImmediately (스크롤 등장)", () => {
  it("움직임 줄이기·관찰자 없음·인쇄 중이면 숨기지 않고 바로 보인다", () => {
    const base = { reducedMotion: false, hasObserver: true, print: false };
    expect(revealImmediately(base)).toBe(false);
    expect(revealImmediately({ ...base, reducedMotion: true })).toBe(true);
    expect(revealImmediately({ ...base, hasObserver: false })).toBe(true);
    expect(revealImmediately({ ...base, print: true })).toBe(true);
  });
});

describe("starField (우주 배경 별)", () => {
  it("108개, 고정된 식이라 매번 같고 viewBox 안에 있다", () => {
    const stars = starField();
    expect(stars).toHaveLength(108);
    expect(starField()).toEqual(stars);
    expect(stars.every((s) => s.x >= 0 && s.x < 1600 && s.y >= 0 && s.y < 1000)).toBe(true);
    // 19번째마다 큰 별, 9번째마다 따뜻한 색
    expect(stars[0]).toMatchObject({ r: 1.15, warm: true });
    expect(stars.filter((s) => s.warm)).toHaveLength(12);
  });
});

