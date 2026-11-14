import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock";
import { fakeMaps, type FakeMap } from "../../test/fakeMaplibre";
import { renderRoute } from "../../test/render";

/*
 * 나라 대시보드 지도 (4장). 지도 그림은 가짜 maplibre로 확인한다(`test/fakeMaplibre.ts`).
 */
const UISEONG = "91817680B75376031789242";
const ULLEUNG = "91817680B98862203953263";

async function mapCanvas(): Promise<HTMLElement> {
  return screen.findByRole("img", { name: /화재 칸과 감지 위치/ });
}

/** 지도 영역의 가장 최근 가짜 지도가 소스를 받을 때까지 기다린다 */
async function loadedMap(): Promise<FakeMap> {
  await mapCanvas();
  return waitFor(() => {
    const map = fakeMaps.at(-1);
    if (map === undefined || map.sources.get("regions")?.data === null) throw new Error("아직");
    return map;
  });
}

describe("나라 지도 (4장)", () => {
  afterEach(() => {
    fakeMaps.length = 0;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("제목·전환 버튼·범례, 면 단계와 값 없음(2025-03 울릉군)", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    expect(await screen.findByRole("heading", { name: "2025년 3월 · 화재 칸과 감지 위치" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "평소 대비 · 준비 중" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "목록 · 준비 중" })).toHaveProperty("disabled", true);
    expect(screen.getByText("3 미만")).toBeTruthy();
    expect(screen.getByText("30 이상")).toBeTruthy();
    const map = await loadedMap();
    await waitFor(() => expect(map.featureStates.get(UISEONG)).toEqual({ bin: 4 }));
    expect(map.featureStates.get(ULLEUNG)).toEqual({ bin: -1 });
    expect(map.fitCalls.length).toBe(1);
    // 나라 지도는 Ctrl·⌘+휠·끌기 확대, 처음엔 번짐(지역 지도의 고정 모양과 다르다)
    expect(map.options).toMatchObject({ cooperativeGestures: true, dragPan: true, scrollZoom: true });
    expect(map.paint.get("points.circle-opacity")).not.toBe(0.95);
    // 끌기 범위는 처음 맞춘 화면으로 묶인다
    expect(map.maxBounds).not.toBeNull();
    // 키로 할 일이 없는 캔버스는 초점을 받지 않는다
    expect(map.canvas.tabIndex).toBe(-1);
    expect(map.canvas.getAttribute("aria-hidden")).toBe("true");
  });

  it("한국은 시·군·구 도형에서 만든 시·도 경계선을 그리고, 캘리포니아는 그리지 않는다", async () => {
    const borderCount = (map: FakeMap) => {
      const data = map.sources.get("outlines")?.data as { features: { geometry: { coordinates: unknown[] } }[] } | null;
      return data?.features[0]?.geometry.coordinates.length ?? 0;
    };
    const kor = renderRoute("/dashboard/KOR?month=2025-03");
    const korMap = await loadedMap();
    await waitFor(() => expect(borderCount(korMap)).toBeGreaterThan(1000));
    kor.unmount();
    renderRoute("/dashboard/CAL?month=2020-09");
    const calMap = await loadedMap();
    await waitFor(() => expect(calMap.sources.get("outlines")?.data).toEqual({ type: "FeatureCollection", features: [] }));
  });

  it("2012년 2월 전 달은 모든 면이 값 없음이고 감지 지점 안내가 붙는다", async () => {
    renderRoute("/dashboard/KOR?month=2005-03");
    expect(await screen.findByText(/2012년 2월 이전은 시·군·구 값이 없어 감지 지점\(MODIS\)만/)).toBeTruthy();
    const map = await loadedMap();
    await waitFor(() => expect(map.featureStates.get(UISEONG)).toEqual({ bin: -1 }));
  });

  it("감지 지점 자료 범위 밖 달은 에러 대신 빈 지도와 안내(5-9)", async () => {
    renderRoute("/dashboard/KOR?month=2026-11");
    expect(await screen.findByText("이 달은 감지 지점 자료가 없습니다.")).toBeTruthy();
    const map = await loadedMap();
    await waitFor(() => expect(map.featureStates.get(UISEONG)).toEqual({ bin: -1 }));
    expect([...map.featureStates.values()].every((v) => JSON.stringify(v) === JSON.stringify({ bin: -1 }))).toBe(true);
  });

  it("달을 바꾸면 도형을 다시 맞추지 않고 단계만 바꾼다(확대 상태 유지)", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    const map = await loadedMap();
    await waitFor(() => expect(map.featureStates.get(UISEONG)).toEqual({ bin: 4 }));
    await act(() => router.navigate("/dashboard/KOR?month=2005-03"));
    await waitFor(() => expect(map.featureStates.get(UISEONG)).toEqual({ bin: -1 }));
    expect(fakeMaps.at(-1)).toBe(map);
    expect(map.fitCalls.length).toBe(1);
  });

  it("처음 크기에서는 안 보이는 점 대신 구역 툴팁, 확대하면 점 툴팁(그 칸의 첫 감지일)", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const map = await loadedMap();
    map.hits = [
      { layer: "points", properties: { index: 0 } },
      { layer: "region-fill", properties: { id: UISEONG } },
    ];
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    expect((await screen.findByRole("tooltip")).textContent).toMatch(/경북 의성군.*화재 칸/);
    fireEvent.click(screen.getByRole("button", { name: "확대" }));
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    await waitFor(() => expect(screen.getByRole("tooltip").textContent).toMatch(/이 칸의 첫 감지일.*2025-03-\d{2}/));
  });

  it("구역을 누르면 그 지역 대시보드로(달 유지), 올리면 이름과 값", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    const map = await loadedMap();
    map.hits = [{ layer: "region-fill", properties: { id: UISEONG } }];
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    expect((await screen.findByRole("tooltip")).textContent).toMatch(/경북 의성군.*화재 칸/);
    act(() => map.emit("click", { point: { x: 10, y: 10 } }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${UISEONG}`));
    expect(router.state.location.search).toBe("?month=2025-03");
  });

  it("확대 버튼: 처음에는 축소·초기화가 꺼져 있고, 확대하면 켜진다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    await loadedMap();
    const zoomOut = await screen.findByRole("button", { name: "축소" });
    await waitFor(() => expect(zoomOut).toHaveProperty("disabled", true));
    fireEvent.click(screen.getByRole("button", { name: "확대" }));
    await waitFor(() => expect(zoomOut).toHaveProperty("disabled", false));
    expect(screen.getByRole("button", { name: "처음 크기로" })).toHaveProperty("disabled", false);
  });

  it("/geo가 실패하면 지도 카드 안에 에러와 다시 시도, 표본이면 안내", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    let failGeo = true;
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        if (path.startsWith("/KOR/geo") && failGeo) return new Response(JSON.stringify({ code: "INTERNAL", message: "x" }), { status: 500 });
        const body = await mockGet(path);
        // 표본: 백엔드는 4,000개를 넘으면 일부만 보낸다
        if (path.startsWith("/KOR/map")) Object.assign((body as { points: object }).points, { count: 5000, shown: 4000 });
        return new Response(JSON.stringify(body), { status: 200 });
      }),
    );
    renderRoute("/dashboard/KOR?month=2025-03");
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    failGeo = false;
    const retry = screen.getAllByRole("button", { name: "다시 시도" }).at(-1);
    if (retry === undefined) throw new Error("다시 시도 없음");
    fireEvent.click(retry);
    expect(await screen.findByText("감지 5,000개 중 4,000개 표시")).toBeTruthy();
  });

  it("/map이 실패하면 지도 카드 안에 에러와 다시 시도", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        if (path.startsWith("/KOR/map")) return new Response(JSON.stringify({ code: "INTERNAL", message: "x" }), { status: 500 });
        return new Response(JSON.stringify(await mockGet(path)), { status: 200 });
      }),
    );
    renderRoute("/dashboard/KOR?month=2025-03");
    expect(await screen.findByRole("heading", { name: "2025년 3월 · 화재 칸과 감지 위치" })).toBeTruthy();
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "다시 시도" }).length).toBeGreaterThan(0);
  });
});
