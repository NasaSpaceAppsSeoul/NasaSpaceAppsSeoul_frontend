import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/render";

/*
 * 자료 가져가기와 이 화면 공유 (5장, `plans/dashboard-sections.md` 6절·11-7·13절).
 * 카드의 "이 화면 링크 복사"는 대화상자를 열기만 하고, 복사는 대화상자 안 "링크 복사"를 눌렀을 때(사용자 결정).
 * jsdom에는 `navigator.clipboard`가 없어 테스트마다 속성으로 붙였다 뗀다(navigator를 통째로 바꾸지 않는다).
 */
const UISEONG = "91817680B75376031789242";

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

async function openShare(name = "이 화면 링크 복사", dialogName = "이 화면 공유"): Promise<HTMLElement> {
  fireEvent.click(await screen.findByRole("button", { name }));
  return screen.findByRole("dialog", { name: dialogName });
}

async function exportCard(): Promise<HTMLElement> {
  const heading = await screen.findByRole("heading", { name: "이 지역·월의 자료를 가져가세요." });
  const card = heading.closest("section");
  if (card === null) throw new Error("카드 없음");
  return card;
}

describe("자료 가져가기 (5장)", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
    vi.restoreAllMocks();
  });

  it("감지 지점 내려받기는 자리만(눌러도 아무 일 없음)", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    setClipboard({ writeText });
    renderRoute("/dashboard/KOR?month=2026-07");
    const card = await exportCard();
    const points = within(card).getByRole("button", { name: "감지 지점 CSV / GeoJSON" });
    expect(points.getAttribute("aria-disabled")).toBe("true");
    expect(points.getAttribute("title")).toBe("준비 중");
    fireEvent.click(points);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(writeText).not.toHaveBeenCalled();
    expect(within(card).getByText("시·군·구를 선택하면 같은 달의 월간 인사이트를 확인할 수 있습니다.")).toBeTruthy();
  });

  it("시·도·시·군·구 화면에도 있다(시·군·구는 인사이트 안내 없음)", async () => {
    const view = renderRoute(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    expect(within(await exportCard()).getByText(/월간 인사이트를 확인할 수 있습니다/)).toBeTruthy();
    view.unmount();
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    expect(within(await exportCard()).queryByText(/월간 인사이트를 확인할 수 있습니다/)).toBeNull();
  });

  it("카드 버튼은 대화상자만 열고, 안의 '링크 복사'를 누르는 순간 복사", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    setClipboard({ writeText });
    renderRoute("/dashboard/KOR?month=2026-07");
    const dialog = await openShare();
    expect(writeText).not.toHaveBeenCalled();
    const url = `${window.location.origin}/dashboard/KOR?month=2026-07`;
    expect(within(dialog).getByText("대한민국 / 2026년 7월")).toBeTruthy();
    expect(within(dialog).getByRole("textbox", { name: "주소" })).toHaveProperty("value", url);
    const copy = within(dialog).getByRole("button", { name: "링크 복사" });
    // 열 때 포커스는 복사 버튼
    expect(document.activeElement).toBe(copy);
    expect(within(dialog).getByRole("status").textContent).toBe("");
    fireEvent.click(copy);
    // 누름 처리 안에서 불렸다(기다리기 전)
    expect(writeText).toHaveBeenCalledWith(url);
    expect(await within(dialog).findByText("링크를 복사했습니다.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "완료" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "이 화면 공유" })).toBeNull());
  });

  it("시·군·구 화면의 링크는 그 지역·달 주소", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    setClipboard({ writeText });
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    const dialog = await openShare();
    expect(within(dialog).getByText("대한민국 / 경북 / 의성군 / 2025년 3월")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/dashboard/KOR/${UISEONG}?month=2025-03`);
  });

  it("시·도 화면의 링크는 한글 ID를 인코딩한 주소", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    setClipboard({ writeText });
    renderRoute(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    const dialog = await openShare();
    expect(within(dialog).getByText("대한민국 / 경북 / 2025년 3월")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/dashboard/KOR/%EA%B2%BD%EB%B6%81?month=2025-03`);
  });

  it("캘리포니아는 안내 줄에 카운티, 영문은 County", async () => {
    const view = renderRoute("/dashboard/CAL?month=2025-08");
    expect(within(await exportCard()).getByText("카운티를 선택하면 같은 달의 월간 인사이트를 확인할 수 있습니다.")).toBeTruthy();
    view.unmount();
    renderRoute("/en/dashboard/CAL?month=2025-08");
    expect(await screen.findByText("Choose a county to open the monthly insight for the same month.")).toBeTruthy();
  });

  it("BC는 지역구, 영문은 regional district(두 단어 소문자)", async () => {
    const view = renderRoute("/dashboard/BC?month=2025-08");
    expect(within(await exportCard()).getByText("지역구를 선택하면 같은 달의 월간 인사이트를 확인할 수 있습니다.")).toBeTruthy();
    view.unmount();
    renderRoute("/en/dashboard/BC?month=2025-08");
    expect(await screen.findByText("Choose a regional district to open the monthly insight for the same month.")).toBeTruthy();
  });

  it("주소 칸은 포커스 때 전체 선택(직접 복사)", async () => {
    renderRoute("/dashboard/KOR?month=2026-07");
    const dialog = await openShare();
    const input = within(dialog).getByRole<HTMLInputElement>("textbox", { name: "주소" });
    fireEvent.focus(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length]);
  });

  it("다시 열면 지난 결과 없이 시작한다", async () => {
    setClipboard({ writeText: () => Promise.resolve() });
    renderRoute("/dashboard/KOR?month=2026-07");
    let dialog = await openShare();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    expect(await within(dialog).findByText("링크를 복사했습니다.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "완료" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    dialog = await openShare();
    expect(within(dialog).getByRole("status").textContent).toBe("");
  });

  it("닫은 뒤 늦게 끝난 복사의 결과는 다시 연 대화상자에 보이지 않는다", async () => {
    let rejectFirst: (() => void) | null = null;
    const writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockImplementationOnce(() => new Promise<void>((_, reject) => (rejectFirst = () => reject(new Error("늦은 실패")))));
    setClipboard({ writeText });
    renderRoute("/dashboard/KOR?month=2026-07");
    let dialog = await openShare();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "완료" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    dialog = await openShare();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(rejectFirst).not.toBeNull();
    await act(async () => rejectFirst?.());
    expect(within(dialog).getByRole("status").textContent).toBe("");
  });

  it("권한이 거부되면 실패 안내", async () => {
    setClipboard({ writeText: () => Promise.reject(new Error("denied")) });
    renderRoute("/dashboard/KOR?month=2026-07");
    const dialog = await openShare();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    expect(await within(dialog).findByText("복사하지 못했습니다. 위 주소를 직접 복사하세요.")).toBeTruthy();
  });

  it("복사 기능이 없거나 writeText가 없으면 실패 안내", async () => {
    renderRoute("/dashboard/KOR?month=2026-07");
    expect("clipboard" in navigator).toBe(false);
    let dialog = await openShare();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    expect(await within(dialog).findByText("복사하지 못했습니다. 위 주소를 직접 복사하세요.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "완료" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    setClipboard({});
    dialog = await openShare();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    expect(await within(dialog).findByText("복사하지 못했습니다. 위 주소를 직접 복사하세요.")).toBeTruthy();
  });

  it("복사가 바로 예외를 던져도 실패 안내", async () => {
    setClipboard({
      writeText: () => {
        throw new Error("sync");
      },
    });
    renderRoute("/dashboard/KOR?month=2026-07");
    const dialog = await openShare();
    fireEvent.click(within(dialog).getByRole("button", { name: "링크 복사" }));
    expect(await within(dialog).findByText("복사하지 못했습니다. 위 주소를 직접 복사하세요.")).toBeTruthy();
  });

  it("영문 화면은 /en 주소", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
    setClipboard({ writeText });
    renderRoute("/en/dashboard/KOR?month=2026-07");
    const dialog = await openShare("Copy link to this view", "Share this view");
    fireEvent.click(within(dialog).getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/en/dashboard/KOR?month=2026-07`);
  });
});
