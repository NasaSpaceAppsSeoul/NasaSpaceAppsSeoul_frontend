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
 * 언어 접두사를 뗀 경로로 화면과 나라를 읽는다. 지금 화면 코드에서는 쓰지 않는다(머리글 메뉴·푸터 출처가 빠진 뒤, 지울지 사용자 확인 대기).
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

/** 페이지 종류. 같은 페이지 안의 달·지역 바꾸기는 페이지 이동이 아니라 화면 안 이동으로 따로 정한다(`routeDirection`) */
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

/** 지역 단계(나라 → 시·도 → 시·군·구). 주소만으로는 시·도와 시·군·구를 가를 수 없어 부르는 쪽이 받아 둔 목록에서 찾는다 */
export type RegionLevelOf = (country: string, id: string) => "nat" | "prov" | "dist" | undefined;

const LEVEL_DEPTH = { nat: 0, prov: 1, dist: 2 } as const;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** "경로?쿼리"를 경로·달·나라·지역 ID로. 달은 `?month=`(없으면 최신 달이라 `null`) */
function parseLocation(location: string) {
  const url = new URL(location, "http://x");
  const [first, country, rawId] = stripLocale(url.pathname).split("/").filter(Boolean);
  // 주소의 지역 ID는 퍼센트 인코딩돼 있다("경북" → %EA%B2…). 목록의 ID와 비교하려고 푼다
  const id = rawId === undefined ? undefined : safeDecode(rawId);
  return { pathname: url.pathname, month: url.searchParams.get("month"), page: first, country, id };
}

/**
 * 두 주소 사이에 전환을 할지와 방향(`plans/cosmic-redesign.md` 8-1, 시안 v9 화면 전환). 인자는 "경로?쿼리".
 * - 페이지가 바뀌면 깊이로 앞·뒤 슬라이드(첫 화면 → 기법 → 대시보드 → 인사이트).
 * - 같은 페이지에서 언어만 바뀌면 `fade`.
 * - 같은 페이지 안(2026-11-15 사용자: 화면 안 이동에도 모두 같은 전환):
 *   지역이 바뀌면 더 넓은 단계(시·군·구 → 시·도 → 나라)는 뒤로, 그 밖(더 좁은 단계, 같은 단계의 다른 지역, 다른 나라,
 *   단계를 모름)은 앞으로 슬라이드. 같은 단계 이동을 겹침으로 두었더니 회색 자리와 겹쳐 전환이 없는 것처럼 보였다(2026-11-15 사용자).
 *   지역이 같고 달만 바뀌면 앞의 달은 뒤로, 뒤의 달은 앞으로, 달 → "최신 달"(쿼리 없음)은 앞으로.
 *   "최신 달" → 달은 전환하지 않는다: 달 없이 들어오면 화면이 최신 달을 붙이는 자동 이동(`<Navigate replace>`)이라
 *   들어오는 전환에 이어 한 번 더 미끄러지지 않게.
 *   같은 나라 화면끼리(`/dashboard/KOR/KOR` → `/dashboard/KOR` 정리 이동)도 전환하지 않는다.
 *   겹침(`fade`)은 언어 전환에만 쓴다.
 * - 그 밖(해시만 바뀌는 목차 이동, 같은 주소)은 `null`.
 */
export function routeDirection(from: string, to: string, levelOf?: RegionLevelOf): RouteDirection | null {
  const a = parseLocation(from);
  const b = parseLocation(to);
  const pageA = routePage(a.pathname);
  const pageB = routePage(b.pathname);
  if (pageA !== pageB) return PAGE_DEPTH[pageB] > PAGE_DEPTH[pageA] ? "forward" : "back";
  if (localeFromPath(a.pathname) !== localeFromPath(b.pathname)) return "fade";
  if (pageA !== "dashboard" && pageA !== "insight") return null;
  if (a.pathname !== b.pathname) {
    if (a.country !== b.country || a.country === undefined) return "forward";
    // 인사이트는 시·군·구 화면이라 같은 단계(이웃 이동)
    const level = (id: string | undefined) =>
      pageA === "insight" ? "dist" : id === undefined ? "nat" : (levelOf?.(a.country ?? "", id) ?? undefined);
    const la = level(a.id);
    const lb = level(b.id);
    if (la === "nat" && lb === "nat") return null;
    if (la === undefined || lb === undefined) return "forward";
    return LEVEL_DEPTH[lb] < LEVEL_DEPTH[la] ? "back" : "forward";
  }
  if (a.month === b.month) return null;
  if (a.month === null) return null;
  if (b.month === null) return "forward";
  return b.month < a.month ? "back" : "forward";
}
