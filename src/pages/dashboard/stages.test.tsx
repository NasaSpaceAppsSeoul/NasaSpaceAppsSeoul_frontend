import { act, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock";
import { renderRoute } from "../../test/render";

/*
 * 세 단계를 오가며 구역이 맞게 바뀌는지, 캘리포니아·BC 두 단계(5장 roadmap 6·7번), 시·군·구 "월간 인사이트 열기".
 */
const UISEONG = "91817680B75376031789242";
const GB = encodeURIComponent("경북");
const BUTTE = "52423323B10000000000002";

const heading = (name: string | RegExp) => screen.queryByRole("heading", { name });

/** 각 단계에만 있는 구역 제목 */
function sections() {
  return {
    nationalMap: heading(/화재 칸과 감지 위치/) !== null,
    regionalMap: heading(/의 시·군·구$|주변 지역$|의 카운티$|의 지역구$/) !== null,
    top: heading("평소보다 두드러진 곳") !== null,
    neighbors: heading(/^인접 지역의/) !== null,
    season: heading("평소 화재 집중 시기") !== null,
    monthly: heading(/월별 활동$/) !== null,
    export: heading("이 지역·월의 자료를 가져가세요.") !== null,
    insight: screen.queryByRole("link", { name: "월간 인사이트 열기 →" }) !== null,
  };
}

describe("단계별 구역 (5장)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("나라 → 시·도 → 시·군·구로 옮기면 구역이 단계에 맞게 바뀐다", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    await screen.findByRole("heading", { name: "평소 화재 집중 시기" });
    await waitFor(() => expect(heading(/화재 칸과 감지 위치/)).not.toBeNull());
    expect(sections()).toEqual({
      nationalMap: true, regionalMap: false, top: false, neighbors: false, season: true, monthly: true, export: true, insight: false,
    });

    await act(() => router.navigate(`/dashboard/KOR/${GB}?month=2025-03`));
    await screen.findByRole("heading", { name: "평소보다 두드러진 곳" });
    await waitFor(() => expect(heading("경북의 시·군·구")).not.toBeNull());
    expect(sections()).toEqual({
      nationalMap: false, regionalMap: true, top: true, neighbors: false, season: false, monthly: false, export: true, insight: false,
    });

    await act(() => router.navigate(`/dashboard/KOR/${UISEONG}?month=2025-03`));
    await screen.findByRole("heading", { name: "인접 지역의 3월 기록" });
    await waitFor(() => expect(heading("의성군과 주변 지역")).not.toBeNull());
    expect(sections()).toEqual({
      nationalMap: false, regionalMap: true, top: false, neighbors: true, season: false, monthly: false, export: true, insight: true,
    });
  });

  it("시·군·구 숫자 카드 안의 월간 인사이트 링크(같은 달)", async () => {
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    // 어두운 숫자 카드 안에 있다(카드가 그려지기 전 로딩 중에도 카드 자리 아래에 따로 보인다)
    const card = await screen.findByRole("region", { name: "2025년 3월 한 달의 화재 감지일" });
    const link = within(card).getByRole("link", { name: "월간 인사이트 열기 →" });
    expect(link.getAttribute("href")).toBe(`/insight/KOR/${UISEONG}?month=2025-03`);
    expect(screen.getAllByRole("link", { name: "월간 인사이트 열기 →" })).toHaveLength(1);
  });

  it("숫자 카드를 받는 동안에도 인사이트 링크는 하나 보인다", async () => {
    // 판정 응답을 붙잡아 두어 로딩 상태를 확실히 만든다(타이밍에 기대지 않게)
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        if (path.startsWith(`/KOR/judgement/${UISEONG}`)) return new Promise<Response>(() => undefined);
        return new Response(JSON.stringify(await mockGet(path)), { status: 200 });
      }),
    );
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByRole("link", { name: "월간 인사이트 열기 →" })).toBeTruthy();
    // 숫자 카드 대신 로딩 자리, 에러 없음, 링크는 하나
    expect(screen.queryByRole("region", { name: "2025년 3월 한 달의 화재 감지일" })).toBeNull();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByRole("link", { name: "월간 인사이트 열기 →" })).toHaveLength(1);
  });

  it("숫자 카드가 실패해도 인사이트 링크는 보인다", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        if (path.startsWith(`/KOR/judgement/${UISEONG}`)) return new Response(JSON.stringify({ code: "INTERNAL", message: "x" }), { status: 500 });
        return new Response(JSON.stringify(await mockGet(path)), { status: 200 });
      }),
    );
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByRole("link", { name: "월간 인사이트 열기 →" })).toBeTruthy();
  });

  it("영문 화면의 인사이트 링크는 /en 주소", async () => {
    renderRoute(`/en/dashboard/KOR/${UISEONG}?month=2025-03`);
    const link = await screen.findByRole("link", { name: "Open monthly insight →" });
    expect(link.getAttribute("href")).toBe(`/en/insight/KOR/${UISEONG}?month=2025-03`);
  });

  it("캘리포니아: 주 전체 → 카운티 두 단계, 시·도 칸 없음, 범례 숫자, 영문 이름", async () => {
    const { router } = renderRoute("/dashboard/CAL?month=2025-08");
    await screen.findByRole("heading", { name: "평소 화재 집중 시기" });
    // 선택 줄에 시·도 칸이 없고 카운티 칸만
    expect(screen.queryByRole("button", { name: /^시·도/ })).toBeNull();
    expect(await screen.findByRole("button", { name: /^카운티/ })).toBeTruthy();
    // 범례 숫자는 캘리포니아 기준(3·8·18)
    expect(await screen.findByText("8–18")).toBeTruthy();
    await act(() => router.navigate(`/dashboard/CAL/${BUTTE}?month=2025-08`));
    expect(await screen.findByRole("heading", { name: "Butte · 주변 지역" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "인접 지역의 8월 기록" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "월간 인사이트 열기 →" }).getAttribute("href")).toBe(`/insight/CAL/${BUTTE}?month=2025-08`);
    expect(screen.queryByRole("heading", { name: "평소보다 두드러진 곳" })).toBeNull();
  });

  it("캘리포니아의 드문 카운티는 주 전체 판정을 빌려 '캘리포니아 기준' 줄", async () => {
    // 목: San Diego는 드문 지역, 2024-08 값 4
    renderRoute("/dashboard/CAL/52423323B10000000000006?month=2024-08");
    const card = await screen.findByRole("region", { name: "2024년 8월 한 달의 화재 감지일" });
    expect(await within(card).findByText(/^캘리포니아 기준/)).toBeTruthy();
  });

  it("BC: 지역구 화면", async () => {
    const regions = (await mockGet("/BC/regions")) as { items: { id: string; label_ko: string; level: string }[] };
    const district = regions.items.find((r) => r.level === "dist");
    if (district === undefined) throw new Error("BC 지역구 없음");
    renderRoute(`/dashboard/BC/${district.id}?month=2025-08`);
    expect(await screen.findByRole("heading", { name: `${district.label_ko} · 주변 지역` })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^시·도/ })).toBeNull();
    // 남은 칸 이름은 BC 단계 이름(decisions 2-3)
    expect(screen.getByRole("button", { name: /^지역구/ })).toBeTruthy();
    expect(await screen.findByRole("link", { name: "월간 인사이트 열기 →" })).toBeTruthy();
  });
});
