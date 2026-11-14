import { parseCountry, type Country } from "./country";
import { stripLocale } from "./locale";

/** 머리글 메뉴에서 이 주소에 맞는 항목. 월간 인사이트는 대시보드에서 들어가므로 대시보드로 본다. */
export type RouteSection = "about" | "dashboard";

export type RouteInfo = {
  section: RouteSection | null;
  /** 주소에 든 나라. 없거나 잘못된 코드면 `undefined` */
  country: Country | undefined;
};

/**
 * 언어 접두사를 뗀 경로로 화면과 나라를 읽는다. 머리글·푸터처럼 화면 바깥의 틀이 쓴다.
 * 경로가 `/dashboard/:country`·`/insight/:country/...` 모양일 때만 나라를 읽는다.
 */
export function routeInfo(pathname: string): RouteInfo {
  const [first, second] = stripLocale(pathname).split("/").filter(Boolean);
  if (first === undefined) return { section: "about", country: undefined };
  if (first === "dashboard" || first === "insight") {
    return { section: "dashboard", country: parseCountry(second) ?? undefined };
  }
  return { section: null, country: undefined };
}

/** 화면 바탕 테마. 밝은 것이 기본이라 값이 없다 */
export type RouteTheme = "dark";

/**
 * 이 주소의 테마. 소개 구역(첫 화면, 8-2부터 기법 페이지)만 어둡다(`plans/about-revise.md` 9-1).
 * 대시보드·인사이트·없는 주소는 밝은 기본이라 `undefined`.
 */
export function routeTheme(pathname: string): RouteTheme | undefined {
  return routeInfo(pathname).section === "about" ? "dark" : undefined;
}
