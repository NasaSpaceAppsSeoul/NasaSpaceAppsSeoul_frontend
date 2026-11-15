import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { EarthErrorBoundary } from "../../components/about/EarthPanel";
import { lazy, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock/index";
import { renderRoute } from "../../test/render";
import { COUNTRIES } from "../../lib/country";

/*
 * 소개 화면. 앞부분은 목, 뒷부분은 live 모드 + `fetch` 바꾸기로 서버 에러를 흉내 낸다.
 */

describe("소개 화면 (목)", () => {
  it("히어로 → 01 → 02 → 03 순서, 옛 구역(보정 막대·방법 카드·감지율)은 없다", async () => {
    renderRoute("/");
    await screen.findByRole("heading", { level: 1 });
    const sections = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(sections).toEqual(["센서는 달라도\n기록은 하나로.", "한 달만 보지 말고\n흐름을 보세요.", "기록을 읽고\n한계를 알기."]);
    // 옛 구역은 8-2 기법 페이지로 옮긴다(2026-11-15 사용자)
    expect(screen.queryByText("위성의 변화가 화재 증가로 보이지 않도록.")).toBeNull();
    expect(screen.queryByText("기록을 연결하는 방법")).toBeNull();
    expect(screen.queryByText("위성이 보는 것과 놓칠 수 있는 것을 함께.")).toBeNull();
    // 데모 문구는 없다(1-10)
    expect(screen.queryByText(/합성|데모/)).toBeNull();
  });

  it("03 신뢰와 한계: 한계 설명과 언어를 유지하는 대시보드 링크", async () => {
    renderRoute("/");
    const section = within(await screen.findByRole("region", { name: "기록을 읽고\n한계를 알기." }));
    expect(section.getByText(/^위성 기록은 불을 놓칠 수 있습니다/)).toBeTruthy();
    expect(section.getByRole("link", { name: "대시보드 보기" }).getAttribute("href")).toBe("/dashboard");
    // 자료 기준일(UI 다듬기): 여섯 지역 목 `data_end`가 10-31~11-14로 달라 범위와 "(지역마다 다름)", 마지막 날의 달은 집계 중
    expect(
      await section.findByText(
        "자료 기준일: 2026년 10월 31일–11월 14일(지역마다 다름). 11월은 아직 집계 중이며 준실시간(NRT) 기록은 잠정값입니다. " +
          "미국·캐나다·호주는 각각 캘리포니아·브리티시컬럼비아·뉴사우스웨일스만 포함합니다. 변화를 해석하기 전에 지역 범위를 확인하세요.",
      ),
    ).toBeTruthy();
    cleanup();
    renderRoute("/en");
    const en = within(await screen.findByRole("region", { name: "Read the record.\nKnow its limits." }));
    expect(en.getByRole("link", { name: "Explore dashboard" }).getAttribute("href")).toBe("/en/dashboard");
    expect(await en.findByText(/^Snapshot: 31 October–14 November 2026 \(varies by region\)\. November is incomplete/)).toBeTruthy();
  });

  it("자료를 받기 전에는 검색 줄을 막고 숫자 구역은 회색 자리, 받으면 연다", async () => {
    renderRoute("/");
    // 01 비교 카드·02 막대 자리의 회색 판
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(2);
    const search = () => screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    expect(search().hasAttribute("disabled")).toBe(true);
    await waitFor(() => expect(search().hasAttribute("disabled")).toBe(false));
    // 예전 "지역 둘러보기" 버튼은 검색에 합쳐 없다(about-revise 11절)
    expect(screen.queryByRole("button", { name: "지역 둘러보기" })).toBeNull();
  });

  it("검색 대화상자 첫 화면('전체'): 나라 줄 6개만(시·도는 펼치지 않음), 입력하면 여섯 나라에서 찾아 나라별로 묶고 고르면 그 대시보드", async () => {
    const { router } = renderRoute("/");
    const search = screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 검색" }));
    expect(dialog.getAllByText(/^나라 대시보드 · 2026년 1\d월까지 자료$/)).toHaveLength(COUNTRIES.length);
    expect(dialog.queryByRole("list", { name: "대한민국" })).toBeNull();
    expect(dialog.queryByText("시·도 · 대한민국")).toBeNull();

    // 한국 밖 지역도 찾는다(캘리포니아 카운티), 결과는 나라 이름 아래에 단계·소속과 함께
    const input = dialog.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "Los" } });
    expect(await dialog.findByRole("heading", { name: "캘리포니아" })).toBeTruthy();
    expect(dialog.getByRole("button", { name: /^Los Angeles.*카운티 · 캘리포니아$/ })).toBeTruthy();
    fireEvent.change(input, { target: { value: "경북" } });
    fireEvent.click((await dialog.findAllByRole("button", { name: /^경북.*시·도/ }))[0] as HTMLElement);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${encodeURIComponent("경북")}`));
  });

  it("검색 대화상자 칩(UI 다듬기): 나라를 고르면 그 나라만·그 나라 안에서 검색, ↑↓·Enter로 열고, 전체는 처음 모습으로", async () => {
    const { router } = renderRoute("/");
    const search = screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 검색" }));
    const chips = within(dialog.getByRole("group", { name: "나라 고르기" }));
    // 전체 + 여섯 나라, 일부 주만 있는 나라는 "나라 · 주"
    expect(chips.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "전체",
      "대한민국",
      "미국·캘리포니아",
      "캐나다·브리티시컬럼비아",
      "그리스",
      "칠레",
      "호주·뉴사우스웨일스",
    ]);
    expect(chips.getByRole("button", { name: "전체" }).getAttribute("aria-pressed")).toBe("true");
    expect(dialog.getByText("↑ ↓ 이동 · Enter 열기 · Esc 닫기")).toBeTruthy();
    // 입력 전에는 강조가 없어 Enter가 아무 데도 가지 않는다. 결과가 없을 때도 같다
    const box = dialog.getByRole("searchbox");
    expect(box.getAttribute("aria-activedescendant")).toBeNull();
    fireEvent.keyDown(box, { key: "Enter" });
    fireEvent.change(box, { target: { value: "없는지역이름" } });
    expect(await dialog.findByText("맞는 지역이 없습니다.")).toBeTruthy();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(router.state.location.pathname).toBe("/");
    // 같은 이름이 여러 곳("동구": 광주·대구·울산…)이면 자동으로 고르지 않는다. ↓로 골라야 연다
    fireEvent.change(box, { target: { value: "동구" } });
    expect((await dialog.findAllByRole("button", { name: /^동구/ })).length).toBeGreaterThan(1);
    expect(box.getAttribute("aria-activedescendant")).toBeNull();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(router.state.location.pathname).toBe("/");
    fireEvent.change(box, { target: { value: "" } });

    // 캘리포니아 칩: 나라 줄은 캘리포니아만, 입력은 캘리포니아 카운티에서 찾는다
    fireEvent.click(chips.getByRole("button", { name: /^미국/ }));
    await waitFor(() => expect(dialog.getAllByRole("button", { name: /나라 대시보드/ })).toHaveLength(1));
    expect(dialog.getByRole("button", { name: /^캘리포니아/ })).toBeTruthy();
    // 시·도 단계가 없는 나라는 나라 줄 아래에 카운티를 들여 쓴다(목 카운티 6곳)
    expect(within(await dialog.findByRole("list", { name: "캘리포니아" })).getAllByText("카운티 · 캘리포니아")).toHaveLength(6);
    expect(dialog.queryByRole("status")).toBeNull();
    const input = dialog.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "Los" } });
    expect(await dialog.findByRole("button", { name: /^Los Angeles/ })).toBeTruthy();
    // 입력 중에는 찾은 것만 위에(이름이 안 맞는 나라 줄은 빠진다). 결과가 하나뿐이면 그 줄을 강조(화면 낭독기용 활성 줄도 그 줄)
    expect(dialog.queryByRole("button", { name: /나라 대시보드/ })).toBeNull();
    const activeName = () => document.getElementById(input.getAttribute("aria-activedescendant") ?? "")?.textContent ?? "";
    expect(activeName()).toMatch(/^Los Angeles/);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(activeName()).toMatch(/^Los Angeles/);
    // Enter → 그 카운티 대시보드
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard/CAL/52423323B10000000000005"));
  });

  it("검색 대화상자 칩 '전체'는 처음 모습(나라 줄 6개만)으로 되돌린다", async () => {
    renderRoute("/");
    const search = screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 검색" }));
    const chips = within(dialog.getByRole("group", { name: "나라 고르기" }));
    fireEvent.click(chips.getByRole("button", { name: "칠레" }));
    await waitFor(() => expect(dialog.getAllByRole("button", { name: /나라 대시보드/ })).toHaveLength(1));
    fireEvent.click(chips.getByRole("button", { name: "전체" }));
    expect(dialog.getAllByRole("button", { name: /나라 대시보드/ })).toHaveLength(COUNTRIES.length);
    expect(dialog.queryByRole("list", { name: "칠레" })).toBeNull();
  });

  it("검색 대화상자에서 나라를 고르면 그 나라 대시보드(영어)", async () => {
    const { router } = renderRoute("/en");
    const search = screen.getByRole("button", { name: "Find a place, Search a country, province, city or county" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "Search a region" }));
    fireEvent.click(dialog.getByRole("button", { name: /^California/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/en/dashboard/CAL"));
  });

  it("검색 줄 아래 예시 줄은 없다(UI 다듬기)", async () => {
    renderRoute("/");
    await waitFor(() => expect(screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" }).hasAttribute("disabled")).toBe(false));
    expect(screen.queryByRole("navigation", { name: "예시 지역" })).toBeNull();
    expect(screen.queryByText(/^예: /)).toBeNull();
  });

  it("검색 칸을 누르면 검색 대화상자, 지역을 고르면 그 대시보드", async () => {
    const { router } = renderRoute("/");
    const search = screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 검색" }));
    fireEvent.change(dialog.getByRole("searchbox"), { target: { value: "의성" } });
    fireEvent.click(dialog.getByRole("button", { name: /의성군/ }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/dashboard\/KOR\/\w+/));
  });

  it("히어로: 검색 줄 아래 흰 '대시보드 보기'와 '작동 방식 보기', 나라별 바로가기는 없다(UI 다듬기)", async () => {
    renderRoute("/");
    const search = screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    expect(search.textContent).toBe("지역 찾기: 의성군, 캘리포니아, 아티카…");
    // 히어로와 03이 같은 이름의 링크를 둔다. 둘 다 대시보드
    expect(screen.getAllByRole("link", { name: "대시보드 보기" }).map((a) => a.getAttribute("href"))).toEqual(["/dashboard", "/dashboard"]);
    expect(screen.getByRole("link", { name: "작동 방식 보기" }).getAttribute("href")).toBe("/method");
    expect(screen.queryByRole("navigation", { name: "나라별 대시보드" })).toBeNull();
    expect(screen.queryByRole("link", { name: "대한민국 →" })).toBeNull();
  });

  it("01 이어진 기록: 2011년 연간 원시값 → 보정값(목 값)과 설명 줄", async () => {
    renderRoute("/");
    const section = within(await screen.findByRole("region", { name: "센서는 달라도\n기록은 하나로." }));
    expect(section.getByRole("heading", { name: "대한민국 · 2011년" })).toBeTruthy();
    const values = await section.findAllByRole("definition");
    expect(values).toHaveLength(2);
    // 각 칸은 숫자 + 단위 + 설명. 맨 앞 숫자만 읽는다(천 단위 쉼표 제거). 두 값은 단위가 달라 크기를 비교하지 않는다
    const [raw, harmonized] = values.map((v) => Number(((v.textContent ?? "").match(/^[\d,.]+/)?.[0] ?? "0").replace(/,/g, "")));
    expect(raw).toBeGreaterThan(0);
    expect(harmonized).toBeGreaterThan(0);
    // 칸마다 자기 단위(H-landing H-3)
    expect(section.getByText("화재 감지일(MODIS 감지 그대로, 연간)")).toBeTruthy();
    expect(section.getByText("화재 감지일(연간)")).toBeTruthy();
    expect(section.getByText(/2011년은 MODIS로만 관측한 마지막 해입니다/)).toBeTruthy();
  });

  it("02 지역 맥락: 시계열 마지막 달의 해 1월~그 달 막대, 처음은 마지막 달 선택, 누르면 요약이 바뀐다", async () => {
    renderRoute("/");
    const section = within(await screen.findByRole("region", { name: "한 달만 보지 말고\n흐름을 보세요." }));
    const chart = within(await section.findByRole("group", { name: /월별 막대 그래프$/ }));
    const bars = chart.getAllByRole("button");
    expect(bars.length).toBeGreaterThanOrEqual(1);
    const last = bars[bars.length - 1] as HTMLElement;
    expect(last.getAttribute("aria-pressed")).toBe("true");
    // 첫 막대(1월)를 고르면 선택한 달 요약이 1월로 바뀐다
    fireEvent.click(bars[0] as HTMLElement);
    expect((bars[0] as HTMLElement).getAttribute("aria-pressed")).toBe("true");
    expect(section.getByText(/^20\d\d년 1월 · /)).toBeTruthy();
    expect(section.getByText(/합계$/)).toBeTruthy();
    // 목의 마지막 달(2026-11)은 집계 중 → 합계 옆에 "집계 중"
    expect(section.getByText(/^[\d,.]+ 화재 감지일 · 집계 중$/)).toBeTruthy();
    // 점선 달이 있으니 범례와 ⓘ 도움말(설명이 버튼에 이어진다)
    expect(section.getByText("집계 중·준실시간(바뀔 수 있음)")).toBeTruthy();
    // 준실시간 달(목: 2026-09)은 "집계 중"이 아니라 "준실시간"
    const september = chart.getByRole("button", { name: /^2026년 9월, .*준실시간$/ });
    fireEvent.click(september);
    expect(section.getByText(/^2026년 9월 · [\d,.]+ 화재 감지일 · 준실시간$/)).toBeTruthy();
    const help = section.getByRole("button", { name: "점선과 실선의 뜻" });
    expect(help.getAttribute("aria-describedby")).toBeTruthy();
    // Esc를 누르면 설명 판이 닫힌다(보이기 클래스가 빠진다). 마우스가 떠나면 다시 열 수 있다
    // 닫힌 판은 `invisible`이라 숨은 요소까지 찾는다
    const panel = () => section.getByRole("tooltip", { hidden: true }).parentElement as HTMLElement;
    expect(panel().className).toContain("group-hover/info:visible");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(panel().className).not.toContain("group-hover/info:visible");
    fireEvent.mouseLeave(help.parentElement as HTMLElement);
    expect(panel().className).toContain("group-hover/info:visible");
    expect(section.getByRole("tooltip", { hidden: true }).textContent).toMatch(/^점선 막대는 값이 아직 확정되지 않은 달입니다/);
  });

  it("02 나라 칩: 처음은 대한민국, 칩을 누르면 제목·범위 문구가 그 나라로, 선택한 달은 마지막 달로(UI 다듬기)", async () => {
    renderRoute("/");
    const section = within(await screen.findByRole("region", { name: "한 달만 보지 말고\n흐름을 보세요." }));
    const chips = within(section.getByRole("group", { name: "지역 고르기" }));
    expect(chips.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "대한민국",
      "캘리포니아",
      "브리티시컬럼비아",
      "그리스",
      "칠레",
      "뉴사우스웨일스",
    ]);
    expect(chips.getByRole("button", { name: "대한민국" }).getAttribute("aria-pressed")).toBe("true");
    expect(section.getByText("대한민국 전체(시·도 17, 시·군·구 229)입니다.")).toBeTruthy();
    expect(await section.findByRole("heading", { name: /^대한민국 · / })).toBeTruthy();
    // 한국에서 1월을 골라 두고 나라를 바꾸면 그 나라의 마지막 달로 되돌아간다
    const korBars = within(section.getByRole("group", { name: /월별 막대 그래프$/ })).getAllByRole("button");
    fireEvent.click(korBars[0] as HTMLElement);
    expect((korBars[0] as HTMLElement).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chips.getByRole("button", { name: "브리티시컬럼비아" }));
    expect(chips.getByRole("button", { name: "브리티시컬럼비아" }).getAttribute("aria-pressed")).toBe("true");
    expect(chips.getByRole("button", { name: "대한민국" }).getAttribute("aria-pressed")).toBe("false");
    expect(section.getByText("캐나다 가운데 브리티시컬럼비아만 제공합니다. 다른 주의 자료는 없습니다.")).toBeTruthy();
    expect(await section.findByRole("heading", { name: /^브리티시컬럼비아 · 20\d\d년 1–\d+월$/ })).toBeTruthy();
    const bcBars = within(section.getByRole("group", { name: /^브리티시컬럼비아 .*월별 막대 그래프$/ })).getAllByRole("button");
    expect((bcBars[bcBars.length - 1] as HTMLElement).getAttribute("aria-pressed")).toBe("true");
    // 이미 받은 나라로 돌아가도(회색 판 없이 바로 그려짐) 선택은 그 나라의 마지막 달
    fireEvent.click(bcBars[0] as HTMLElement);
    fireEvent.click(chips.getByRole("button", { name: "대한민국" }));
    const korAgain = within(section.getByRole("group", { name: /^대한민국 .*월별 막대 그래프$/ })).getAllByRole("button");
    expect((korAgain[0] as HTMLElement).getAttribute("aria-pressed")).toBe("false");
    expect((korAgain[korAgain.length - 1] as HTMLElement).getAttribute("aria-pressed")).toBe("true");
  });

  it("'스크롤해서 읽기'는 주소를 바꾸지 않고 01로 초점을 옮긴다(언어 전환이 01로 끌고 가지 않게)", async () => {
    const { router } = renderRoute("/");
    const cue = screen.getByRole("link", { name: "스크롤해서 읽기" });
    // 수정키 클릭(새 탭)은 막지 않는다 → 기본 동작이 남는다(true)
    expect(fireEvent.click(cue, { metaKey: true })).toBe(true);
    // 보통 클릭은 기본 동작(해시 이동)을 막는다(false)
    expect(fireEvent.click(cue)).toBe(false);
    expect(router.state.location.hash).toBe("");
    expect(document.activeElement?.id).toBe("connected");
    // 머리글 EN 링크도 해시 없이 간다
    expect(screen.getByRole("link", { name: "EN" }).getAttribute("href")).toBe("/en");
  });

  it("'작동 방식 보기'는 언어에 맞는 기법 페이지로 가고, 지구 자리를 그린다", async () => {
    renderRoute("/");
    // 화살표는 장식이라 읽는 이름에 들어가지 않는다
    expect(screen.getByRole("link", { name: "작동 방식 보기" }).getAttribute("href")).toBe("/method");
    expect(await screen.findByTestId("earth-scene")).toBeTruthy();
    cleanup();
    renderRoute("/en");
    expect(screen.getByRole("link", { name: "See how it works" }).getAttribute("href")).toBe("/en/method");
  });

  it("영어 화면도 같은 구조다", async () => {
    renderRoute("/en");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Different sensors.\nOne connected record.",
      "Look beyond\na single month.",
      "Read the record.\nKnow its limits.",
    ]);
    expect(await screen.findByRole("heading", { name: "Republic of Korea · 2011" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Explore dashboard" }).map((a) => a.getAttribute("href"))).toEqual(["/en/dashboard", "/en/dashboard"]);
  });
});

describe("지구 자리 에러 경계", () => {
  it("지구 묶음이 실패하면 그 자리에만 안내를 두고 바깥(첫 화면 글)은 남는다", () => {
    function Broken(): never {
      throw new Error("chunk load failed");
    }
    // React가 잡힌 예외도 콘솔에 남긴다. 이 테스트에서는 예상한 것이라 가린다
    const silence = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <div>
        <p>첫 화면 글</p>
        <EarthErrorBoundary fallback={<p>지구 없음</p>}>
          <Broken />
        </EarthErrorBoundary>
      </div>,
    );
    silence.mockRestore();
    expect(screen.getByText("첫 화면 글")).toBeTruthy();
    expect(screen.getByText("지구 없음")).toBeTruthy();
  });

  it("lazy 묶음 받기가 실패해도(거부된 import) 경계가 받는다", async () => {
    const Missing = lazy(() => Promise.reject(new Error("Failed to fetch dynamically imported module")));
    const silence = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <EarthErrorBoundary fallback={<p>지구 없음</p>}>
        <Suspense fallback={<p>받는 중</p>}>
          <Missing />
        </Suspense>
      </EarthErrorBoundary>,
    );
    expect(await screen.findByText("지구 없음")).toBeTruthy();
    silence.mockRestore();
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

  it("/landing이 실패하면 01 숫자 칸에만 다시 시도, 글·그림·다른 구역은 남고, 다시 시도하면 복구된다", async () => {
    live();
    let down = true;
    serve((path) => (down && path === "/KOR/landing" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    const connected = within(await screen.findByRole("region", { name: "센서는 달라도\n기록은 하나로." }));
    expect(await connected.findByRole("button", { name: "다시 시도" })).toBeTruthy();
    // 01은 글·그림이 남고 숫자 칸에만 에러, 설명 줄은 값이 없으니 숨긴다
    expect(connected.getByRole("img", { name: /MODIS와 VIIRS 관측 기록/ })).toBeTruthy();
    expect(connected.queryByText(/MODIS로만 관측한 마지막 해/)).toBeNull();
    expect(screen.getByRole("heading", { name: "기록을 읽고\n한계를 알기." })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "다시 시도" })).toHaveLength(1);

    down = false;
    fireEvent.click(connected.getByRole("button", { name: "다시 시도" }));
    expect(await connected.findAllByRole("definition")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });

  it("검색 대화상자 나라 목록에서 준비 안 된 나라는 빠진다", async () => {
    live();
    serve((path) => (path === "/BC/meta" ? json({ code: "COUNTRY_NOT_READY", message: "x" }, 404) : null));
    renderRoute("/");
    const search = screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 검색" }));
    // BC /meta가 404로 돌아오면 나라 줄과 칩에서 빠진다
    await waitFor(() => expect(dialog.queryByRole("button", { name: /^브리티시컬럼비아/ })).toBeNull());
    expect(dialog.queryByRole("button", { name: /^캐나다/ })).toBeNull();
    expect(dialog.getByRole("button", { name: /^캘리포니아/ })).toBeTruthy();
  });

  it("한국 /meta가 실패하면 머리에 구역 에러와 다시 시도, 검색은 막힌다", async () => {
    live();
    serve((path) => (path === "/KOR/meta" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" }).hasAttribute("disabled")).toBe(true);
  });

  it("검색 대화상자 칩: 그 나라 /regions가 실패하면 목록 아래 에러와 다시 시도, '결과 없음'은 말하지 않는다", async () => {
    live();
    serve((path) => (path === "/CAL/regions" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    const search = screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" });
    await waitFor(() => expect(search.hasAttribute("disabled")).toBe(false));
    fireEvent.click(search);
    const dialog = within(await screen.findByRole("dialog", { name: "지역 검색" }));
    fireEvent.change(dialog.getByRole("searchbox"), { target: { value: "Los" } });
    fireEvent.click(within(dialog.getByRole("group", { name: "나라 고르기" })).getByRole("button", { name: /^미국/ }));
    expect(await dialog.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    expect(dialog.getByRole("button", { name: "다시 시도" })).toBeTruthy();
    expect(dialog.queryByText("맞는 지역이 없습니다.")).toBeNull();
  });

  it("03: 한 지역 /meta라도 실패하면 자료 기준일 문장을 빼고 범위 문장만(일부만으로 범위를 말하지 않게)", async () => {
    live();
    serve((path) => (path === "/GRC/meta" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    const section = within(await screen.findByRole("region", { name: "기록을 읽고\n한계를 알기." }));
    const coverage =
      "미국·캐나다·호주는 각각 캘리포니아·브리티시컬럼비아·뉴사우스웨일스만 포함합니다. 변화를 해석하기 전에 지역 범위를 확인하세요.";
    // 다른 다섯 지역 /meta 응답이 모두 돌아온 뒤에도 날짜는 나오지 않는다(받는 중이라 없는 것과 구분)
    const metaCalls = () => fetchMock.mock.calls.map((c) => String(c[0])).filter((u) => /\/(KOR|CAL|BC|CHL|NSW)\/meta$/.test(u));
    await waitFor(() => expect(new Set(metaCalls()).size).toBe(5));
    await act(async () => {
      await Promise.all(fetchMock.mock.results.map((r) => r.value));
    });
    expect(await section.findByText(coverage)).toBeTruthy();
    expect(section.queryByText(/^자료 기준일/)).toBeNull();
  });

  it("02: /series/KOR가 실패하면 그 구역에만 다시 시도, 01은 그대로", async () => {
    live();
    serve((path) => (path.startsWith("/KOR/series/KOR") ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    const section = within(await screen.findByRole("region", { name: "한 달만 보지 말고\n흐름을 보세요." }));
    expect(await section.findByRole("button", { name: "다시 시도" })).toBeTruthy();
    const connected = within(screen.getByRole("region", { name: "센서는 달라도\n기록은 하나로." }));
    expect(await connected.findAllByRole("definition")).toHaveLength(2);
  });

  it("01: 2011년 값이 0(자료 없음)이면 숫자 대신 '값 없음', 설명 줄은 숨긴다", async () => {
    live();
    const base = (await mockGet("/KOR/landing")) as { annual: { years: number[]; before: number[]; after: number[] } };
    const i = base.annual.years.indexOf(2011);
    const zeroed = (values: number[]) => values.map((v, k) => (k === i ? 0 : v));
    serve((path) =>
      path === "/KOR/landing"
        ? json({ ...base, annual: { ...base.annual, after: zeroed(base.annual.after) } })
        : null,
    );
    renderRoute("/");
    const section = within(await screen.findByRole("region", { name: "센서는 달라도\n기록은 하나로." }));
    expect(await section.findByText("값 없음")).toBeTruthy();
    expect(section.queryAllByRole("definition")).toHaveLength(0);
    expect(section.queryByText(/MODIS로만 관측한 마지막 해/)).toBeNull();
  });

  it("한국 /regions가 실패하면 머리에 구역 에러와 다시 시도, 검색은 막힌다", async () => {
    live();
    serve((path) => (path === "/KOR/regions" ? json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503) : null));
    renderRoute("/");
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "지역 찾기, 국가·시·도·시·군·구 검색" }).hasAttribute("disabled")).toBe(true);
  });
});
