import type { RouterNavigateOptions, To, createBrowserRouter } from "react-router-dom";
import { keys } from "../api/keys";
import type { RegionsResponse } from "../api/types";
import { parseCountry } from "../lib/country";
import { routeDirection, type RegionLevelOf } from "../lib/route";
import { queryClient } from "./queryClient";

/*
 * 화면 전환 (`plans/cosmic-redesign.md` 8-1, 시안 v9 `.route-page`). 전환을 할지와 방향은 `lib/route` `routeDirection`이 정하고,
 * 그때만 React Router의 `viewTransition`을 켠다. 페이지 이동(슬라이드)·언어 전환(겹침)에 더해
 * 같은 페이지 안의 지역·달 바꾸기도 전환한다(2026-11-15 사용자: 화면 안 이동에도 모두 같은 애니메이션).
 * 지역 단계(시·도/시·군·구)는 주소로 알 수 없어 이미 받아 둔 `/regions`(쿼리 캐시)에서 찾는다. 아직 없으면 앞으로.
 * 방향(`<html data-route-direction>`)은 라우터가 전환을 시작하기 직전에 알려 주는 "어디서 어디로"로 매번 정한다:
 * 브라우저 뒤로·앞으로 가기는 라우터가 스스로 전환을 켜서 `navigate`를 거치지 않기 때문이다.
 * 전환이 없는 이동인데 라우터가 전환을 켠 경우(뒤로 가기)는 `none`으로 두어 CSS가 애니메이션을 끈다.
 * 모양(오른쪽에서 48px·620ms로 들어오고 420ms로 나감, 배경·머리글은 고정)은 `styles/index.css`의 `::view-transition-*`.
 * 링크·버튼·검색이 모두 라우터의 `navigate`를 거치므로 여기 한 곳에서 켠다(곳곳의 링크마다 붙이지 않게).
 * View Transitions가 없는 브라우저는 라우터가 그냥 이동한다. 움직임 줄이기는 CSS가 애니메이션을 끈다.
 */
type Router = ReturnType<typeof createBrowserRouter>;

/** 받아 둔 지역 목록에서 단계를 찾는다(없으면 `undefined` → 앞으로) */
const levelOf: RegionLevelOf = (country, id) => {
  const code = parseCountry(country);
  if (code === null) return undefined;
  return queryClient.getQueryData<RegionsResponse>(keys.regions(code))?.items.find((r) => r.id === id)?.level;
};

/** 이동할 곳의 "경로?쿼리". 상대 경로는 지금 주소 기준으로 푼다. 숫자(앞뒤로 가기)는 `null` */
function targetLocation(to: To | null, current: string): string | null {
  if (to === null) return null;
  const base = `${window.location.origin}${current}`;
  if (typeof to === "string") {
    const url = new URL(to, base);
    return url.pathname + url.search;
  }
  const url = new URL(to.pathname ?? new URL(base).pathname, base);
  // 객체 이동은 `search`를 적지 않으면 쿼리가 비어진다(라우터 규칙과 같게)
  return url.pathname + (to.search ?? "");
}

const here = (location: { pathname: string; search: string }) => location.pathname + location.search;

export function withRouteTransitions(router: Router): void {
  const navigate = router.navigate.bind(router);
  function transitioned(delta: number): Promise<void>;
  function transitioned(to: To | null, opts?: RouterNavigateOptions): Promise<void>;
  function transitioned(to: To | null | number, opts?: RouterNavigateOptions): Promise<void> {
    // 앞뒤로 가기(숫자)는 그대로
    if (typeof to === "number") return navigate(to);
    const current = here(router.state.location);
    const target = targetLocation(to, current);
    const direction = target === null ? null : routeDirection(current, target, levelOf);
    if (direction === null) return navigate(to, opts);
    return navigate(to, { ...opts, viewTransition: true });
  }
  router.navigate = transitioned;
  // `RouterProvider`보다 먼저 구독하므로 전환이 시작되기 전에 방향이 적힌다.
  // 라우터가 넘기는 `viewTransitionOpts`는 뒤로 가기에서 앞뒤를 뒤집어 주므로(RR 설계), 방향은 직전 주소와 새 주소로 정한다
  let last = here(router.state.location);
  router.subscribe((state, { viewTransitionOpts }) => {
    const next = here(state.location);
    if (viewTransitionOpts !== undefined) {
      document.documentElement.dataset.routeDirection = routeDirection(last, next, levelOf) ?? "none";
    }
    last = next;
  });
}
