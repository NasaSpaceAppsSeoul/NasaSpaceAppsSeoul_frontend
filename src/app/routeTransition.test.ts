import { createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { withRouteTransitions } from "./routeTransition";

/*
 * 페이지 전환 슬라이드: 페이지가 바뀌는 이동에만 전환을 켜고, 방향은 라우터가 알려 주는 "어디서 어디로"로 정한다.
 * 화면 없이 라우터만 움직인다(전환 그림은 진짜 브라우저의 일이다).
 */
const routes = [
  { path: "/", element: null },
  { path: "/dashboard/*", element: null },
  { path: "/insight/*", element: null },
  { path: "/en/*", element: null },
];

const direction = () => document.documentElement.dataset.routeDirection;

afterEach(() => {
  delete document.documentElement.dataset.routeDirection;
});

describe("withRouteTransitions", () => {
  it("첫 화면 → 대시보드는 앞으로, 대시보드 → 인사이트도 앞으로, 돌아오면 뒤로", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    withRouteTransitions(router);
    await router.navigate("/dashboard/KOR");
    expect(direction()).toBe("forward");
    await router.navigate("/insight/KOR/a");
    expect(direction()).toBe("forward");
    await router.navigate("/dashboard/KOR");
    expect(direction()).toBe("back");
  });

  it("같은 페이지 안의 이동은 전환을 켜지 않는다(방향을 건드리지 않음), 옵션은 그대로 넘긴다", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/dashboard/KOR"] });
    withRouteTransitions(router);
    await router.navigate("/dashboard/KOR/b?month=2025-03", { replace: true, preventScrollReset: true });
    expect(direction()).toBeUndefined();
    expect(router.state.location.search).toBe("?month=2025-03");
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("브라우저 뒤로 가기(숫자 이동)도 방향을 다시 정한다", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    withRouteTransitions(router);
    await router.navigate("/dashboard/KOR");
    expect(direction()).toBe("forward");
    await router.navigate(-1);
    expect(router.state.location.pathname).toBe("/");
    expect(direction()).toBe("back");
  });
});

describe("withRouteTransitions: 언어 전환", () => {
  it("같은 페이지에서 언어만 바뀌면 겹쳐 바뀐다(fade)", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/dashboard/KOR"] });
    withRouteTransitions(router);
    await router.navigate("/en/dashboard/KOR?month=2025-03");
    expect(direction()).toBe("fade");
  });
});
