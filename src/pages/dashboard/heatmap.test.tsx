import { fullText } from "../../test/fullText";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock";
import type { BaselineResponse, SeriesResponse } from "../../api/types";
import { formatFireDays } from "../../lib/format";
import { renderRoute } from "../../test/render";

const UISEONG = "91817680B75376031789242";

async function grid(): Promise<HTMLElement> {
  return screen.findByRole("group", { name: /연도별·월별 화재 달력|Fire calendar by year and month/ });
}

/** 칸을 못 찾으면 바로 실패한다(건너뛰지 않는다) */
function cell(g: HTMLElement, prefix: string): HTMLElement {
  const found = within(g)
    .getAllByRole("button")
    .find((b: HTMLElement) => (b.getAttribute("aria-label") ?? "").startsWith(prefix));
  if (found === undefined) throw new Error(`칸 없음: ${prefix}`);
  return found;
}

function hasCell(g: HTMLElement, prefix: string): boolean {
  return within(g)
    .getAllByRole("button")
    .some((b: HTMLElement) => (b.getAttribute("aria-label") ?? "").startsWith(prefix));
}

describe("히트맵 (3장)", () => {
  it("나라: 2001년부터, 선택한 달 표시, 센서 전환 두 개, 표시 연도 분절 버튼", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    const selected = cell(g, "대한민국 · 2025년 3월");
    expect(selected.getAttribute("aria-current")).toBe("date");
    expect(selected.getAttribute("aria-label")).toContain("1,093 화재 감지일");
    expect(hasCell(g, "대한민국 · 2001년 1월")).toBe(true);
    expect(screen.getByText("2012년 2월 S-NPP / 2018년 4월 NOAA-20 — 점무늬는 NOAA-20 기준 환산값")).toBeTruthy();
    expect(screen.getByText("해 → · 달 ↓ · 같은 기준으로 비교")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "연도별·월별 화재 달력" })).toBeTruthy();
    expect(screen.getByText("2001–2026 · 대한민국 · 한 달에 점 하나. 올리면 값, 누르면 그 달로 이동합니다.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "전체 해" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "2012년부터" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("칸을 누르면 그 달로, 아직 집계 전 칸은 눌러도 그대로", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    const future = cell(g, "대한민국 · 2026년 12월");
    expect(future.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(future);
    expect(router.state.location.search).toBe("?month=2025-03");
    fireEvent.click(cell(g, "대한민국 · 2024년 4월"));
    await waitFor(() => expect(router.state.location.search).toBe("?month=2024-04"));
  });

  it("2018년 4월 전 칸은 센서 환산값, 툴팁은 마우스를 올리면 뜨고 Esc로 닫힌다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    const old = cell(g, "대한민국 · 2015년 6월");
    expect(old.getAttribute("aria-label")).toContain("센서 환산값");
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseEnter(old);
    const tip = await screen.findByRole("tooltip");
    expect(tip.textContent).toContain("대한민국 · 2015년 6월");
    expect(tip.textContent).toMatch(/범위 /);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("범위 하한이 음수인 달(전국 7월 −0.8)은 툴팁에 0으로", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    fireEvent.mouseEnter(cell(g, "대한민국 · 2024년 7월"));
    expect((await screen.findByRole("tooltip")).textContent).toMatch(/범위 0–/);
  });

  it("키보드로 들어온 포커스는 누를 수 없는 칸에서도 이유를 툴팁으로, 마우스로 누른 포커스는 툴팁을 남기지 않는다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    fireEvent.focus(cell(g, "대한민국 · 2026년 12월"));
    expect((await screen.findByRole("tooltip")).textContent).toContain("아직 집계 전입니다.");
    fireEvent.blur(cell(g, "대한민국 · 2026년 12월"));

    const clicked = cell(g, "대한민국 · 2024년 5월");
    fireEvent.pointerDown(clicked);
    fireEvent.focus(clicked);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("격자 안 글자를 눌러 포커스가 생기지 않았어도, 다음 키보드 포커스에는 툴팁이 뜬다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    const yearLabel = within(g).getByText("2024");
    fireEvent.pointerDown(yearLabel);
    fireEvent.click(yearLabel);
    fireEvent.focus(cell(g, "대한민국 · 2024년 6월"));
    expect((await screen.findByRole("tooltip")).textContent).toContain("대한민국 · 2024년 6월");
  });

  it("키보드: 해는 가로(←→), 달은 세로(↑↓)로 칸을 옮기고 누르면 그 달(시안 배치, 2026-11-15 사용자)", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    const selected = cell(g, "대한민국 · 2025년 3월");
    selected.focus();
    fireEvent.keyDown(selected, { key: "ArrowDown" });
    const below = cell(g, "대한민국 · 2025년 4월");
    expect(document.activeElement).toBe(below);
    fireEvent.keyDown(below, { key: "ArrowLeft" });
    const left = cell(g, "대한민국 · 2024년 4월");
    expect(document.activeElement).toBe(left);
    fireEvent.keyDown(left, { key: "ArrowRight" });
    expect(document.activeElement).toBe(below);
    fireEvent.click(below);
    await waitFor(() => expect(router.state.location.search).toBe("?month=2025-04"));
  });

  it("배치: 맨 윗줄은 해(왼쪽이 오래된 해), 왼쪽 칸은 1~12월", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    const years = within(g)
      .getAllByText(/^\d{4}$/)
      .map((el) => Number(el.textContent));
    expect(years[0]).toBe(2001);
    expect(years.at(-1)).toBe(2026);
    // 같은 달(3월) 줄 안에서 2024년 칸이 2025년 칸보다 앞(왼쪽)
    const a = cell(g, "대한민국 · 2024년 3월");
    const b = cell(g, "대한민국 · 2025년 3월");
    expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("시·군·구(의성): 2012년부터, 표시 연도 버튼 없음, 드문 지역은 툴팁에 범위가 없다", async () => {
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    const g = await grid();
    expect(hasCell(g, "경북 의성군 · 2012년 1월")).toBe(true);
    expect(hasCell(g, "경북 의성군 · 2011년 12월")).toBe(false);
    expect(screen.queryByRole("group", { name: "표시 연도" })).toBeNull();
    // 2011년이 보이지 않으니 2012년 전환은 빠지고 2018년만
    expect(screen.getByText("2018년 4월 NOAA-20 — 점무늬는 NOAA-20 기준 환산값")).toBeTruthy();
    fireEvent.mouseEnter(cell(g, "경북 의성군 · 2025년 3월"));
    const tip = await screen.findByRole("tooltip");
    expect(tip.textContent).toContain("384 화재 감지일");
    expect(tip.textContent).not.toMatch(/범위/);
  });

  it("표시 연도를 VIIRS 시기로 바꾸면 2012년부터, Tab으로 들어갈 칸이 남고, 지역을 바꾸면 전체로 돌아간다", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2005-03");
    fireEvent.click(await screen.findByRole("button", { name: "2012년부터" }));
    expect(screen.getByRole("button", { name: "2012년부터" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/^2012–2026 · 대한민국/)).toBeTruthy();
    const g = await grid();
    expect(hasCell(g, "대한민국 · 2011년 12월")).toBe(false);
    // 선택한 달(2005-03)이 빠져도 Tab으로 들어갈 칸이 하나 있다
    expect(within(g).getAllByRole("button").filter((b: HTMLElement) => b.tabIndex === 0)).toHaveLength(1);

    await router.navigate(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    await waitFor(() => expect(screen.getByRole("button", { name: "전체 해" }).getAttribute("aria-pressed")).toBe("true"));
  });

  it("범례는 그 지역의 경계 숫자, 상태 설명은 NOAA-20 기준 문구", async () => {
    const base = (await mockGet("/KOR/baseline/KOR")) as BaselineResponse;
    renderRoute("/dashboard/KOR?month=2025-03");
    await grid();
    const [a, b, c] = base.heat_bins.map((v) => formatFireDays(v, "ko"));
    expect(screen.getByText(`${a} 미만`)).toBeTruthy();
    expect(screen.getByText(`${a}–${b}`)).toBeTruthy();
    expect(screen.getByText(`${c} 이상`)).toBeTruthy();
    expect(screen.getByText("이전 위성 기록을 NOAA-20 기준으로 맞춘 값")).toBeTruthy();
  });

  it("선택한 달 줄, 상태 칩(설명은 툴팁), 각주(한국 목 data_end 10-31 → 집계 중 문장 없음)", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    await grid();
    // 선택한 달 줄(상태 칩 "선택한 달"과 이름이 같아 줄 안에서 찾는다)
    const row = screen.getByText(fullText("1,093 화재 감지일 · 보정 후")).parentElement as HTMLElement;
    expect(within(row).getByText("선택한 달")).toBeTruthy();
    expect(within(row).getByText("2025년 3월")).toBeTruthy();
    const chip = screen.getByRole("button", { name: "관측 자료 없음" });
    expect(document.getElementById(chip.getAttribute("aria-describedby") ?? "")?.textContent).toBe("자료가 없어 값을 판단할 수 없음");
    // 상태 칩은 상태 목록 안에 정확히 6개
    const chips = within(chip.closest("ul") as HTMLElement).getAllByRole("button");
    expect(chips.map((b) => b.textContent)).toEqual(["집계 중", "감지 없음", "센서 환산값", "관측 자료 없음", "선택한 달", "아직 집계 전"]);
    expect(screen.getByText("NASA FIRMS · 0, 그리고 0이 아닌 월값의 50·75·90 백분위로 색을 나눕니다. 빠진 기록은 0이 아닙니다.")).toBeTruthy();
  });

  it("집계 중인 달을 고르면 선택한 달 줄에 집계 중", async () => {
    renderRoute("/dashboard/KOR?month=2026-11");
    await grid();
    expect(await screen.findByText(fullText(/^[\d,.]+ 화재 감지일 · 보정 후 · 집계 중$/))).toBeTruthy();
  });

  it("각주: data_end가 달 중간이면 그 달은 집계 중(캘리포니아 목 11-09, 영문)", async () => {
    renderRoute("/en/dashboard/CAL?month=2025-08");
    await grid();
    expect(
      screen.getByText("NASA FIRMS · zero plus nonzero monthly P50/P75/P90 color breaks. November 2026 is collecting through Nov 9; missing history is not zero."),
    ).toBeTruthy();
    expect(screen.getAllByText("Selected month")).toHaveLength(2);
  });

  it("목 모드에서는 CSV를 내려받을 수 없다고 화면에 보인다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    await grid();
    expect(screen.getByRole("button", { name: "월별 CSV" }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("목 모드에서는 내려받을 수 없습니다")).toBeTruthy();
  });

  it("내려받기(9장): 목 모드 CSV는 눌러도 대화상자가 열리지 않고, 달력 PNG는 확인 대화상자를 연다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    await grid();
    fireEvent.click(screen.getByRole("button", { name: "월별 CSV" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "달력 PNG" }));
    const dialog = within(await screen.findByRole("dialog", { name: "달력 이미지" }));
    expect(dialog.getByText("PNG · 범례·출처·기준 기간 포함")).toBeTruthy();
    expect(dialog.getByRole("button", { name: "내려받기" })).toBeTruthy();
    expect(dialog.queryByText(/프로토타입/)).toBeNull();
  });

  it("영어 화면", async () => {
    renderRoute("/en/dashboard/KOR?month=2025-03");
    const g = await grid();
    expect(hasCell(g, "Republic of Korea · March 2025")).toBe(true);
    expect(screen.getByText("Feb 2012 S-NPP / Apr 2018 NOAA-20 — dotted values are converted to the NOAA-20 basis")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Year-by-month fire calendar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All years" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("보정 전/후(9장 2차): 목 모드는 보정 전 값이 없어 \"보정 전\"을 막고 이유를 보인다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    await grid();
    const raw = screen.getByRole("button", { name: "보정 전" });
    expect(raw.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("이 지역은 보정 전 값이 없습니다")).toBeTruthy();
    fireEvent.click(raw);
    expect(screen.getByRole("button", { name: "보정 후" }).getAttribute("aria-pressed")).toBe("true");
  });
});

/*
 * 보정 전 화면은 서버 값이 있어야 보인다(목은 `raw_before`가 모두 null). live 모드에서 `fetch`를 목으로 돌리고
 * `/series`에만 보정 전 값(보정 후의 절반, 지어낸 값)을 넣는다.
 */
describe("히트맵 보정 전 (9장 2차, 서버 값)", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(async (input) => {
      const path = String(input).replace("https://api.test/api/v1", "");
      const body = await mockGet(path);
      if (path.includes("/series/")) {
        const series = body as SeriesResponse;
        series.months = series.months.map((m) => ({ ...m, raw_before: m.value === null ? null : Math.round(m.value / 2) }));
      }
      return new Response(JSON.stringify(body), { status: 200 });
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("보정 전을 고르면 보정 전 값·관측 위성으로 칠하고, 환산 표시와 평소 범위를 뺀다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    expect(cell(g, "대한민국 · 2025년 3월").getAttribute("aria-label")).toContain("1,093 화재 감지일");
    expect(screen.getByRole("button", { name: "센서 환산값" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "보정 전" }));
    expect(screen.getByRole("button", { name: "보정 전" }).getAttribute("aria-pressed")).toBe("true");
    const label = cell(g, "대한민국 · 2025년 3월").getAttribute("aria-label") ?? "";
    expect(label).toContain("547 화재 감지일");
    expect(label).toContain("NOAA-20 원래 기록");
    // 2011년은 MODIS 기록 그대로: 환산 표시 없음
    expect(cell(g, "대한민국 · 2011년 3월").getAttribute("aria-label")).not.toContain("센서 환산값");
    expect(screen.getByText("해 → · 달 ↓ · 위성이 남긴 원래 기록")).toBeTruthy();
    expect(screen.getByText("2012년 2월 S-NPP / 2018년 4월 NOAA-20 — 위성이 바뀌면 감지 감도도 달라집니다")).toBeTruthy();
    expect(screen.getByText(fullText(/547 화재 감지일 · 보정 전/))).toBeTruthy();
    expect(screen.queryByText("이 지역은 보정 전 값이 없습니다")).toBeNull();
    // 상태 범례에서 환산 칩이 빠지고, 집계 중·선택한 달 견본 안쪽은 파랑 계열(9장 3차)
    expect(screen.queryByRole("button", { name: "센서 환산값" })).toBeNull();
    const swatch = (name: string) => screen.getByRole("button", { name }).querySelector("span")?.className ?? "";
    expect(swatch("집계 중")).toContain("bg-heat-raw-4");
    expect(swatch("선택한 달")).toContain("bg-heat-raw-4");
    expect(swatch("집계 중")).toContain("outline-heat-partial-ring");
    fireEvent.click(screen.getByRole("button", { name: "보정 후" }));
    expect(cell(g, "대한민국 · 2025년 3월").getAttribute("aria-label")).toContain("1,093 화재 감지일");
    expect(swatch("선택한 달")).toContain("bg-heat-3");
  });
});
