import { createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { keys } from "../api/keys";
import { queryClient } from "./queryClient";
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
  queryClient.removeQueries({ queryKey: keys.regions("KOR") });
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

  it("같은 페이지 안 지역 바꾸기(2026-11-15)도 전환한다: 받아 둔 목록으로 단계를 찾고, 같은 단계·모르는 단계도 앞으로. 옵션은 그대로 넘긴다", async () => {
    queryClient.setQueryData(keys.regions("KOR"), {
      items: [{ id: "경북", label_ko: "경북", name_en: null, level: "prov", province: "경북", region_type: "sufficient", center: null, bbox: null }],
    });
    const router = createMemoryRouter(routes, { initialEntries: ["/dashboard/KOR"] });
    withRouteTransitions(router);
    await router.navigate(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`, { replace: true, preventScrollReset: true });
    expect(direction()).toBe("forward");
    expect(router.state.location.search).toBe("?month=2025-03");
    expect(router.state.historyAction).toBe("REPLACE");
    await router.navigate("/dashboard/KOR/b?month=2025-03");
    expect(direction()).toBe("forward");
    await router.navigate(`/dashboard/KOR/${encodeURIComponent("경북")}`);
    expect(direction()).toBe("forward");
    await router.navigate("/dashboard/KOR");
    // 받아 둔 목록에 "경북"이 시·도로 있어 나라로 돌아가면 뒤로
    expect(direction()).toBe("back");
  });

  it("달 없이 들어온 뒤 최신 달을 붙이는 자동 이동(replace)은 전환을 켜지 않는다", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/dashboard/KOR"] });
    withRouteTransitions(router);
    await router.navigate("/dashboard/KOR?month=2026-11", { replace: true });
    expect(direction()).toBeUndefined();
  });

  it("같은 지역에서 달만 바꾸면 뒤의 달로 앞, 앞의 달로 뒤. 해시만 바꾸면 전환 없음", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/dashboard/KOR?month=2025-03"] });
    withRouteTransitions(router);
    await router.navigate("/dashboard/KOR?month=2025-04");
    expect(direction()).toBe("forward");
    await router.navigate("/dashboard/KOR?month=2024-01");
    expect(direction()).toBe("back");
    delete document.documentElement.dataset.routeDirection;
    await router.navigate({ search: "?month=2024-01", hash: "#map" });
    expect(direction()).toBeUndefined();
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
