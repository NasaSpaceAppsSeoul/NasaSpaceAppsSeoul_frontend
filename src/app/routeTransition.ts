import type { RouterNavigateOptions, To, createBrowserRouter } from "react-router-dom";
import { routeDirection } from "../lib/route";

/*
 * 페이지 전환 슬라이드 (`plans/cosmic-redesign.md` 8-1, 시안 v9 `.route-page`): 첫 화면·대시보드·인사이트·없는 주소 사이.
 * 페이지가 바뀌거나 언어가 바뀌는 이동에만(`lib/route` `routeDirection`) React Router의 `viewTransition`을 켠다.
 * 방향(`<html data-route-direction>`)은 라우터가 전환을 시작하기 직전에 알려 주는 "어디서 어디로"로 매번 정한다:
 * 브라우저 뒤로·앞으로 가기는 라우터가 스스로 전환을 켜서 `navigate`를 거치지 않기 때문이다.
 * 같은 페이지 안의 이동인데 라우터가 전환을 켠 경우(뒤로 가기)는 `none`으로 두어 CSS가 애니메이션을 끈다.
 * 모양(오른쪽에서 48px·620ms로 들어오고 420ms로 나감, 배경·머리글은 고정)은 `styles/index.css`의 `::view-transition-*`.
 * 링크·버튼·검색이 모두 라우터의 `navigate`를 거치므로 여기 한 곳에서 켠다(곳곳의 링크마다 붙이지 않게).
 * View Transitions가 없는 브라우저는 라우터가 그냥 이동한다. 움직임 줄이기는 CSS가 애니메이션을 끈다.
 */
type Router = ReturnType<typeof createBrowserRouter>;

/** 이동할 곳의 경로. 상대 경로는 지금 주소 기준으로 푼다. 숫자(앞뒤로 가기)는 `null` */
function targetPath(to: To | null, current: string): string | null {
  if (to === null) return null;
  const raw = typeof to === "string" ? to : (to.pathname ?? current);
  return new URL(raw, `${window.location.origin}${current}`).pathname;
}

export function withRouteTransitions(router: Router): void {
  const navigate = router.navigate.bind(router);
  function transitioned(delta: number): Promise<void>;
  function transitioned(to: To | null, opts?: RouterNavigateOptions): Promise<void>;
  function transitioned(to: To | null | number, opts?: RouterNavigateOptions): Promise<void> {
    // 앞뒤로 가기(숫자)는 그대로
    if (typeof to === "number") return navigate(to);
    const current = router.state.location.pathname;
    const target = targetPath(to, current);
    const direction = target === null ? null : routeDirection(current, target);
    if (direction === null) return navigate(to, opts);
    return navigate(to, { ...opts, viewTransition: true });
  }
  router.navigate = transitioned;
  // `RouterProvider`보다 먼저 구독하므로 전환이 시작되기 전에 방향이 적힌다.
  // 라우터가 넘기는 `viewTransitionOpts`는 뒤로 가기에서 앞뒤를 뒤집어 주므로(RR 설계), 방향은 직전 주소와 새 주소로 정한다
  let last = router.state.location.pathname;
  router.subscribe((state, { viewTransitionOpts }) => {
    const next = state.location.pathname;
    if (viewTransitionOpts !== undefined) {
      document.documentElement.dataset.routeDirection = routeDirection(last, next) ?? "none";
    }
    last = next;
  });
}
