import { describe, expect, it } from "vitest";
import { cacheMode } from "./cacheMode";
import { parseCountry } from "./country";
import { errorKind } from "./errorKind";
import { formatFullDate } from "./format";
import { isLastDayOfMonth, parseMonthParam } from "./month";
import { starField } from "./cosmic";
import { revealImmediately } from "./reveal";
import { routeDirection, routeInfo } from "./route";

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

describe("isLastDayOfMonth · formatFullDate", () => {
  it("달 마지막 날(윤년 2월 포함)만 참", () => {
    expect(isLastDayOfMonth("2026-10-31")).toBe(true);
    expect(isLastDayOfMonth("2026-11-14")).toBe(false);
    expect(isLastDayOfMonth("2024-02-29")).toBe(true);
    expect(isLastDayOfMonth("2025-02-28")).toBe(true);
    expect(isLastDayOfMonth("2024-02-28")).toBe(false);
  });

  it("한글은 연·월·일, 영문은 일 달 연", () => {
    expect(formatFullDate("2026-11-14", "ko")).toBe("2026년 11월 14일");
    expect(formatFullDate("2026-11-04", "en")).toBe("4 November 2026");
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
  it("기법 페이지는 소개의 하위라 소개가 켜진다(뒤에 칸이 더 붙으면 없는 주소)", () => {
    expect(routeInfo("/method")).toEqual({ section: "about", country: undefined });
    expect(routeInfo("/en/method")).toEqual({ section: "about", country: undefined });
    expect(routeInfo("/method/x")).toEqual({ section: null, country: undefined });
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

describe("routeDirection", () => {
  it("더 깊은 페이지(첫 화면 → 대시보드 → 인사이트)로 가면 앞으로, 돌아가면 뒤로", () => {
    expect(routeDirection("/", "/dashboard/KOR")).toBe("forward");
    expect(routeDirection("/dashboard/KOR/abc", "/insight/KOR/abc")).toBe("forward");
    expect(routeDirection("/en", "/en/insight/KOR/abc")).toBe("forward");
    expect(routeDirection("/insight/KOR/abc", "/dashboard/KOR/abc")).toBe("back");
    expect(routeDirection("/dashboard/KOR", "/")).toBe("back");
    expect(routeDirection("/", "/nope")).toBe("forward");
    expect(routeDirection("/nope", "/")).toBe("back");
  });
  it("기법 페이지는 첫 화면 다음, 대시보드 앞 깊이", () => {
    expect(routeDirection("/", "/method")).toBe("forward");
    expect(routeDirection("/method", "/")).toBe("back");
    expect(routeDirection("/method", "/dashboard/KOR")).toBe("forward");
    expect(routeDirection("/dashboard/KOR", "/method")).toBe("back");
    expect(routeDirection("/method", "/en/method")).toBe("fade");
    expect(routeDirection("/method", "/method")).toBeNull();
  });
  it("같은 페이지에서 언어만 바뀌면 겹쳐 바뀐다(fade)", () => {
    expect(routeDirection("/dashboard/KOR", "/en/dashboard/KOR")).toBe("fade");
    expect(routeDirection("/", "/en")).toBe("fade");
    expect(routeDirection("/en/insight/KOR/a", "/insight/KOR/a")).toBe("fade");
  });
  it("같은 페이지·같은 언어 안(달·지역 바꾸기)은 전환하지 않는다", () => {
    expect(routeDirection("/dashboard/KOR", "/dashboard/KOR/abc")).toBeNull();

    expect(routeDirection("/insight/KOR/a", "/insight/KOR/b")).toBeNull();

  });
});
