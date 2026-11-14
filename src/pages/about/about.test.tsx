import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { korMeta } from "../../api/mock/kor";
import { mockGet } from "../../api/mock/index";
import { renderRoute } from "../../test/render";

/*
 * 소개 화면. 앞부분은 목, 뒷부분은 live 모드 + `fetch` 바꾸기로 서버 에러를 흉내 낸다.
 */

describe("소개 화면 (목)", () => {
  it("보정 전후 막대 두 장(같은 세로축)과 감지율 다섯 줄을 그린다", async () => {
    renderRoute("/");
    const raw = await screen.findByRole("img", { name: "원시값 막대 그래프, 2001–2025년" });
    const harmonized = screen.getByRole("img", { name: "보정값 막대 그래프, 2001–2025년" });
    expect(raw.querySelectorAll("rect").length).toBeGreaterThan(20);
    expect(harmonized.querySelectorAll("rect").length).toBeGreaterThan(20);
    // 두 카드의 부제에 같은 세로축 끝이 들어간다
    const subs = screen.getAllByText(/공통 세로축 0–/).map((el) => el.textContent?.split("0–").pop());
    expect(subs).toHaveLength(2);
    expect(subs[0]).toBe(subs[1]);

    expect(screen.getByText("100 ha 이상: 감지율 91%, 우연 기준 3%")).toBeTruthy();
    expect(screen.getByText(/^0\.1–1 ha: 감지율/)).toBeTruthy();
    expect(screen.getByText(/감지율 계산에 쓴 공식 산불 5,543건/)).toBeTruthy();
    // 데모 문구는 없다(1-10)
    expect(screen.queryByText(/합성|데모/)).toBeNull();
  });

  it("자료를 받기 전에는 검색·둘러보기를 막고 숫자 구역은 회색 자리, 받으면 연다", async () => {
    renderRoute("/");
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("button", { name: "지역 둘러보기" }).hasAttribute("disabled")).toBe(true);
    await waitFor(() => expect(screen.getByRole("button", { name: "지역 둘러보기" }).hasAttribute("disabled")).toBe(false));
  });

  it("지역 둘러보기: 맨 위 나라 3개 + 시·도, 고르면 그 대시보드로 간다", async () => {
    const { router } = renderRoute("/");
    const browse = screen.getByRole("button", { name: "지역 둘러보기" });
    await waitFor(() => expect(browse.hasAttribute("disabled")).toBe(false));
    fireEvent.click(browse);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 선택" }));
    const rows = dialog.getAllByRole("button", { pressed: false }).map((b) => b.textContent ?? "");
    expect(rows.slice(0, 3).map((r) => r.split("나라")[0])).toEqual(["대한민국", "캘리포니아", "브리티시컬럼비아"]);
    expect(rows).toHaveLength(3 + 17);
    expect(dialog.getAllByText("시·도 대시보드 · 2026년 10월까지 자료").length).toBe(17);

    fireEvent.click(dialog.getByRole("button", { name: /^경북/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${encodeURIComponent("경북")}`));
  });

  it("지역 둘러보기에서 나라를 고르면 그 나라 대시보드", async () => {
    const { router } = renderRoute("/en");
    const browse = screen.getByRole("button", { name: "Browse regions" });
    await waitFor(() => expect(browse.hasAttribute("disabled")).toBe(false));
    fireEvent.click(browse);
    const dialog = within(await screen.findByRole("dialog", { name: "Choose a region" }));
    fireEvent.click(dialog.getByRole("button", { name: /^California/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/en/dashboard/CAL"));
  });

  it("검색 칸을 누르면 검색 대화상자, 지역을 고르면 그 대시보드", async () => {
    const { router } = renderRoute("/");
    const search = screen.getByRole("button", { name: "국가·시·도·시·군·구 검색" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 검색" }));
    fireEvent.change(dialog.getByRole("searchbox"), { target: { value: "의성" } });
    fireEvent.click(dialog.getByRole("button", { name: /의성군/ }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/dashboard\/KOR\/\w+/));
  });

  it("나라 버튼은 그 나라 대시보드 링크다(목은 세 나라 모두 준비됨)", async () => {
    renderRoute("/");
    const nav = within(await screen.findByRole("navigation", { name: "나라별 대시보드" }));
    expect(nav.getByRole("link", { name: "대한민국 →" }).getAttribute("href")).toBe("/dashboard/KOR");
    expect(nav.getByRole("link", { name: "캘리포니아 →" }).getAttribute("href")).toBe("/dashboard/CAL");
  });

  it("영어 화면도 같은 구조다", async () => {
    renderRoute("/en");
    expect(await screen.findByRole("img", { name: "Raw bar chart, 2001–2025" })).toBeTruthy();
    expect(screen.getByText("100 ha or more: detected 91%, chance baseline 3%")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Republic of Korea →" }).getAttribute("href")).toBe("/en/dashboard/KOR");
  });
});

const fetchMock = vi.fn<typeof fetch>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

/** 목 응답을 그대로 돌려주되 `fail`이 고른 경로만 실패시킨다. */
function serve(fail: (path: string) => Response | null) {
  fetchMock.mockImplementation(async (input) => {
    const path = String(input).replace("https://api.test/api/v1", "");
    const failed = fail(path);
    if (failed !== null) return failed;
    try {
      return json(await mockGet(path));
    } catch (error) {
      const e = error as { status: number; code: string };
      return json({ code: e.code, message: "x" }, e.status);
    }
  });
}

describe("소개 화면 (서버 에러)", () => {
  function live() {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal("fetch", fetchMock);
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("/landing이 실패하면 문구 구역은 남고 숫자 구역 둘에 다시 시도. 한쪽에서 다시 시도하면 둘 다 복구된다", async () => {
    live();
    let down = true;
    serve((path) => (down && path === "/KOR/landing" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    await waitFor(() => expect(screen.getAllByRole("button", { name: "다시 시도" })).toHaveLength(2));
    expect(screen.getByRole("heading", { name: "위성의 변화가 화재 증가로 보이지 않도록." })).toBeTruthy();
    expect(screen.getByText("화재 감지일 집계")).toBeTruthy();
    expect(screen.getByText("위성이 모든 불을 볼 수는 없습니다.")).toBeTruthy();

    down = false;
    fireEvent.click(screen.getAllByRole("button", { name: "다시 시도" })[0] as HTMLElement);
    expect(await screen.findByRole("img", { name: "원시값 막대 그래프, 2001–2025년" })).toBeTruthy();
    expect(await screen.findByText("100 ha 이상: 감지율 91%, 우연 기준 3%")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });

  it("감지율 목록이 비거나 연간 값이 모두 0이면 안내 문구", async () => {
    live();
    serve((path) => {
      if (path !== "/KOR/landing") return null;
      return json({
        country: "KOR", data_version: null, labels: korMeta.labels, stats: [],
        annual: { years: [2001, 2002], before: [0, 0], after: [0, 0] },
        official_break: { source: "", before: null, after: null, inconclusive: false },
        break_test: { before: { ratio: null, ci95: null }, after: { ratio: null, ci95: null }, jump_raw: null },
        detect_by_size: [], detect_n: 0,
      });
    });
    renderRoute("/");
    expect(await screen.findByText("연간 자료가 없습니다.")).toBeTruthy();
    expect(screen.queryByText(/두 차트는 동일한 세로축/)).toBeNull();
    expect(screen.getByText("감지율 자료가 없습니다.")).toBeTruthy();
    expect(screen.queryByText(/감지율 계산에 쓴 공식 산불/)).toBeNull();
  });

  it("보정값만 모두 0이면 그 카드에만 안내 문구, 원시값 카드는 그대로", async () => {
    live();
    const base = (await mockGet("/KOR/landing")) as { annual: { years: number[]; before: number[] } };
    serve((path) =>
      path === "/KOR/landing"
        ? json({ ...base, annual: { ...base.annual, after: base.annual.years.map(() => 0) } })
        : null,
    );
    renderRoute("/");
    expect(await screen.findByRole("img", { name: "원시값 막대 그래프, 2001–2025년" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "보정값 막대 그래프, 2001–2025년" })).toBeNull();
    expect(screen.getAllByText("연간 자료가 없습니다.")).toHaveLength(1);
  });

  it("둘러보기 목록에서 준비 안 된 나라는 빠진다", async () => {
    live();
    serve((path) => (path === "/BC/meta" ? json({ code: "COUNTRY_NOT_READY", message: "x" }, 404) : null));
    renderRoute("/");
    await screen.findByRole("button", { name: "브리티시컬럼비아 · 준비 중" });
    const browse = screen.getByRole("button", { name: "지역 둘러보기" });
    await waitFor(() => expect(browse.hasAttribute("disabled")).toBe(false));
    fireEvent.click(browse);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 선택" }));
    expect(dialog.queryByRole("button", { name: /^브리티시컬럼비아/ })).toBeNull();
    expect(dialog.getByRole("button", { name: /^캘리포니아/ })).toBeTruthy();
  });

  it("한국 /meta가 실패하면 머리에 구역 에러와 다시 시도, 검색은 막힌다", async () => {
    live();
    serve((path) => (path === "/KOR/meta" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "지역 둘러보기" }).hasAttribute("disabled")).toBe(true);
  });

  it("감지율·우연 기준이 없는 줄은 —, 세로선 없음", async () => {
    live();
    const base = (await mockGet("/KOR/landing")) as Record<string, unknown>;
    serve((path) =>
      path === "/KOR/landing"
        ? json({ ...base, detect_by_size: [{ bin: "1~10", n: 3, detected: null, chance: null }], detect_n: 3 })
        : null,
    );
    renderRoute("/");
    expect(await screen.findByText("1–10 ha: 감지율 —, 우연 기준 —")).toBeTruthy();
  });

  it("/meta가 404 COUNTRY_NOT_READY인 나라는 준비 중 비활성 버튼", async () => {
    live();
    serve((path) => (path === "/BC/meta" ? json({ code: "COUNTRY_NOT_READY", message: "x" }, 404) : null));
    renderRoute("/");
    const button = await screen.findByRole("button", { name: "브리티시컬럼비아 · 준비 중" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("link", { name: "대한민국 →" })).toBeTruthy();
  });

  it("한국 /regions가 실패하면 머리에 구역 에러와 다시 시도, 검색은 막힌다", async () => {
    live();
    serve((path) => (path === "/KOR/regions" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "지역 둘러보기" }).hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("예: 경북 의성 · 강원 고성 · 대구 중구")).toBeNull();
  });
});
