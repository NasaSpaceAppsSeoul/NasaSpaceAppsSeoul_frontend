import { parseCountry, type Country } from "./country";
import { localeFromPath, stripLocale } from "./locale";

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
  // 기법 페이지는 소개의 하위 페이지라 머리글에서 "소개"가 켜진다(`plans/method-page.md` 0절)
  if (first === "method" && second === undefined) return { section: "about", country: undefined };
  if (first === "dashboard" || first === "insight") {
    return { section: "dashboard", country: parseCountry(second) ?? undefined };
  }
  return { section: null, country: undefined };
}

/**
 * 화면 전환 모양. 더 깊은 페이지로 가면 앞으로(오른쪽에서 슬라이드), 돌아가면 뒤로,
 * 같은 페이지에서 언어만 바뀌면 부드럽게 겹쳐 바뀐다(2026-11-15 사용자: 언어 전환이 너무 휙 바뀜)
 */
export type RouteDirection = "forward" | "back" | "fade";

/** 슬라이드로 오가는 페이지. 같은 페이지 안의 달·지역·언어 바꾸기는 페이지 이동이 아니다 */
export type RoutePage = "about" | "method" | "dashboard" | "insight" | "other";

/**
 * 깊이 순서: 첫 화면 → 기법 페이지 → 대시보드 → 월간 인사이트. 없는 주소 안내는 가장 깊은 쪽으로 둔다.
 * 기법 페이지는 첫 화면에서 들어가는 하위 페이지라 첫 화면 바로 다음(2026-11-15 사용자 권장안)
 */
const PAGE_DEPTH: Record<RoutePage, number> = { about: 0, method: 1, dashboard: 2, insight: 3, other: 4 };

export function routePage(pathname: string): RoutePage {
  const [first, second] = stripLocale(pathname).split("/").filter(Boolean);
  if (first === undefined) return "about";
  if (first === "method" && second === undefined) return "method";
  if (first === "dashboard" || first === "insight") return first;
  return "other";
}

/**
 * 두 주소 사이에 슬라이드를 할지와 방향(`plans/cosmic-redesign.md` 8-1, 시안 v9 화면 전환).
 * 페이지가 바뀌는 이동이면 모두(2026-11-15 사용자: 페이지가 전환되는 곳에는 모두 동일하게). 같은 페이지에서 언어만
 * 바뀌면 `fade`. 같은 페이지·같은 언어 안(달·지역 바꾸기)은 `null`.
 */
export function routeDirection(fromPath: string, toPath: string): RouteDirection | null {
  const from = routePage(fromPath);
  const to = routePage(toPath);
  if (from === to) return localeFromPath(fromPath) === localeFromPath(toPath) ? null : "fade";
  return PAGE_DEPTH[to] > PAGE_DEPTH[from] ? "forward" : "back";
}
