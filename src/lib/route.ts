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
