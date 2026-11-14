import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock";
import type { RegionDetail } from "../../api/types";
import { fakeMaps, type FakeMap } from "../../test/fakeMaplibre";
import { renderRoute } from "../../test/render";

/*
 * 시·도·시·군·구 대시보드의 지역 지도 (5장, `plans/dashboard-sections.md` 4-1·11절).
 */
const UISEONG = "91817680B75376031789242";
const ANDONG = "91817680B16014600177045";
const YEONGJU = "91817680B73468767289539";

async function loadedMap(name: RegExp): Promise<FakeMap> {
  await screen.findByRole("img", { name });
  return waitFor(() => {
    const map = fakeMaps.at(-1);
    if (map === undefined || map.sources.get("regions")?.data === null) throw new Error("아직");
    return map;
  });
}

const regionIds = (map: FakeMap) =>
  ((map.sources.get("regions")?.data as { features: { properties: { id: string } }[] } | null)?.features ?? []).map((f) => f.properties.id);

describe("지역 지도 (5장)", () => {
  afterEach(() => {
    fakeMaps.length = 0;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("시·도: 그 시·도의 시·군·구만, 확대·끌기 없음, 선택 테두리·범례 줄 없음", async () => {
    renderRoute(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    expect(await screen.findByRole("heading", { name: "경북의 시·군·구" })).toBeTruthy();
    const map = await loadedMap(/경북의 시·군·구/);
    await waitFor(() => expect(regionIds(map)).toContain(UISEONG));
    expect(regionIds(map)).toContain(YEONGJU);
    const regions = (await mockGet("/KOR/regions")) as { items: { id: string; province: string | null; level: string }[] };
    const others = regions.items.filter((r) => r.level === "dist" && r.province !== "경북").map((r) => r.id);
    expect(regionIds(map).some((id) => others.includes(id))).toBe(false);
    // 고정 지도, 처음부터 점(2026-11-14 사용자 결정)
    expect(map.options).toMatchObject({ dragPan: false, scrollZoom: false, cooperativeGestures: false });
    expect(screen.queryByRole("button", { name: "확대" })).toBeNull();
    await waitFor(() => expect(map.paint.get("points.circle-opacity")).toBe(0.95));
    expect(map.paint.get("points-heat.heatmap-opacity")).toBe(0);
    expect(screen.queryByText(/확대하면 점으로 보입니다/)).toBeNull();
    expect(map.filters.get("selected-line")).toEqual(["==", ["get", "id"], ""]);
    expect(screen.queryByText("선택 지역 · 파란 테두리")).toBeNull();
  });

  it("시·군·구: 자기 + 맞닿은 지역, 자기에 파란 테두리와 범례 줄", async () => {
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByRole("heading", { name: "의성군과 주변 지역" })).toBeTruthy();
    const map = await loadedMap(/의성군과 주변 지역/);
    const detail = (await mockGet(`/KOR/regions/${UISEONG}`)) as RegionDetail;
    await waitFor(() => expect(regionIds(map).sort()).toEqual([UISEONG, ...detail.neighbors.map((n) => n.id)].sort()));
    expect(regionIds(map)).toContain(ANDONG);
    await waitFor(() => expect(map.filters.get("selected-line")).toEqual(["==", ["get", "id"], UISEONG]));
    expect(screen.getByText("선택 지역 · 파란 테두리")).toBeTruthy();
    // 도형은 이웃이 온 뒤 한 번만 넣고 맞춘다
    expect(map.fitCalls.length).toBe(1);
  });

  it("점은 처음부터 보여 바로 점 툴팁. 이웃을 누르면 그 지역으로(자기는 무시)", async () => {
    const { router } = renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    const map = await loadedMap(/의성군과 주변 지역/);
    map.hits = [{ layer: "region-fill", properties: { id: UISEONG } }];
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    expect((await screen.findByRole("tooltip")).textContent).toMatch(/경북 의성군.*화재 칸/);
    // 자기 지역은 눌러도 아무 일이 없어 손가락 커서가 없다
    expect(map.canvas.style.cursor).toBe("");
    map.hits = [
      { layer: "points", properties: { index: 0 } },
      { layer: "region-fill", properties: { id: UISEONG } },
    ];
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    await waitFor(() => expect(screen.getByRole("tooltip").textContent).toMatch(/이 칸의 첫 감지일.*2025-03-\d{2}/));
    act(() => map.emit("click", { point: { x: 10, y: 10 } }));
    expect(router.state.location.pathname).toBe(`/dashboard/KOR/${UISEONG}`);
    map.hits = [{ layer: "region-fill", properties: { id: ANDONG } }];
    act(() => map.emit("click", { point: { x: 10, y: 10 } }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${ANDONG}`));
    expect(router.state.location.search).toBe("?month=2025-03");
  });

  it("달이 바뀌면 지난 응답의 점 툴팁을 버린다", async () => {
    const { router } = renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    const map = await loadedMap(/의성군과 주변 지역/);
    map.hits = [{ layer: "points", properties: { index: 0 } }];
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    expect((await screen.findByRole("tooltip")).textContent).toMatch(/이 칸의 첫 감지일/);
    await act(() => router.navigate(`/dashboard/KOR/${UISEONG}?month=2025-04`));
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("이웃을 못 받으면 자기만 그리고 안내와 다시 시도", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    let fail = true;
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        if (path === `/KOR/regions/${UISEONG}` && fail) return new Response(JSON.stringify({ code: "INTERNAL", message: "x" }), { status: 500 });
        return new Response(JSON.stringify(await mockGet(path)), { status: 200 });
      }),
    );
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByText("주변 지역을 불러오지 못해 이 지역만 표시합니다.", {}, { timeout: 4000 })).toBeTruthy();
    const map = await loadedMap(/의성군과 주변 지역/);
    expect(regionIds(map)).toEqual([UISEONG]);
    fail = false;
    const retry = screen.getAllByRole("button", { name: "다시 시도" }).at(-1);
    if (retry === undefined) throw new Error("다시 시도 없음");
    fireEvent.click(retry);
    // 다시 받는 동안에도 자리 표시로 바꾸지 않고 같은 지도에 이웃을 더한다
    await waitFor(() => expect(regionIds(map)).toContain(ANDONG));
    expect(fakeMaps.at(-1)).toBe(map);
    expect(screen.queryByText("주변 지역을 불러오지 못해 이 지역만 표시합니다.")).toBeNull();
  });

  it("표본이면 나라 전체 숫자라고 밝힌다(지역 지도는 나라 전체 /map을 거른다)", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        const body = await mockGet(path);
        if (path.startsWith("/KOR/map")) Object.assign((body as { points: object }).points, { count: 5000, shown: 4000 });
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByText("대한민국 전체 감지 5,000개 중 4,000개만 받아 일부만 보입니다.")).toBeTruthy();
  });

  it("캘리포니아 카운티: 영문 이름 제목(조사 없음), 격자 이웃", async () => {
    renderRoute("/dashboard/CAL/52423323B10000000000002?month=2025-08");
    expect(await screen.findByRole("heading", { name: "Butte · 주변 지역" })).toBeTruthy();
    const map = await loadedMap(/Butte · 주변 지역/);
    await waitFor(() => expect(regionIds(map).length).toBeGreaterThan(1));
  });
});
