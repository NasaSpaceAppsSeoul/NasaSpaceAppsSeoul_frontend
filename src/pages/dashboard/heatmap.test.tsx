import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockGet } from "../../api/mock";
import type { BaselineResponse } from "../../api/types";
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
  it("나라: 2001년부터, 선택한 달 표시, 구분선 두 줄, 표시 연도 버튼", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const g = await grid();
    const selected = cell(g, "대한민국 · 2025년 3월");
    expect(selected.getAttribute("aria-current")).toBe("date");
    expect(selected.getAttribute("aria-label")).toContain("1,093 화재 감지일");
    expect(hasCell(g, "대한민국 · 2001년 1월")).toBe(true);
    expect(screen.getByText(/2018년 4월 · NOAA-20 관측 시작/)).toBeTruthy();
    expect(screen.getByText(/2012년 2월 · S-NPP 관측 시작/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "2001–2026" })).toBeTruthy();
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
    expect(screen.queryByRole("button", { name: /^\d{4}–\d{4}$/ })).toBeNull();
    // 2011년이 보이지 않으니 2012년 구분선도 없다
    expect(screen.queryByText(/2012년 2월 · S-NPP 관측 시작/)).toBeNull();
    fireEvent.mouseEnter(cell(g, "경북 의성군 · 2025년 3월"));
    const tip = await screen.findByRole("tooltip");
    expect(tip.textContent).toContain("384 화재 감지일");
    expect(tip.textContent).not.toMatch(/범위/);
  });

  it("표시 연도를 VIIRS 시기로 바꾸면 2012년부터, Tab으로 들어갈 칸이 남고, 지역을 바꾸면 전체로 돌아간다", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2005-03");
    fireEvent.click(await screen.findByRole("button", { name: "2001–2026" }));
    const dialog = await screen.findByRole("dialog", { name: "표시 연도" });
    fireEvent.click(within(dialog).getByRole("button", { name: /2012–2026 VIIRS 시기/ }));
    expect(await screen.findByRole("button", { name: "2012–2026" })).toBeTruthy();
    const g = await grid();
    expect(hasCell(g, "대한민국 · 2011년 12월")).toBe(false);
    // 선택한 달(2005-03)이 빠져도 Tab으로 들어갈 칸이 하나 있다
    expect(within(g).getAllByRole("button").filter((b: HTMLElement) => b.tabIndex === 0)).toHaveLength(1);

    await router.navigate(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    expect(await screen.findByRole("button", { name: /^2001–2026$/ })).toBeTruthy();
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

  it("목 모드에서는 CSV를 내려받을 수 없다고 화면에 보인다", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    await grid();
    expect(screen.getByRole("button", { name: /월별 데이터 CSV/ }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("목 모드에서는 내려받을 수 없습니다")).toBeTruthy();
  });

  it("영어 화면", async () => {
    renderRoute("/en/dashboard/KOR?month=2025-03");
    const g = await grid();
    expect(hasCell(g, "Republic of Korea · March 2025")).toBe(true);
    expect(screen.getByText(/April 2018 · NOAA-20 observations begin/)).toBeTruthy();
  });
});
