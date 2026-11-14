import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/render";

/*
 * 이 화면 공유 (5장, `plans/dashboard-sections.md` 6절·11-7·13절). "자료 가져가기" 카드는 2026-11-15 뺐다.
 * 경로 줄 오른쪽 "이 화면 링크 복사"는 대화상자를 열기만 하고, 복사는 대화상자 안 "링크 복사"를 눌렀을 때(사용자 결정).
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

describe("이 화면 공유 (5장, 경로 줄 버튼)", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
    vi.restoreAllMocks();
  });

  it("자료 가져가기 카드는 없고(2026-11-15 사용자), 공유 버튼은 경로 줄 오른쪽에 있다", async () => {
    renderRoute("/dashboard/KOR?month=2026-07");
    const share = await screen.findByRole("button", { name: "이 화면 링크 복사" });
    expect(screen.queryByRole("heading", { name: "이 지역·월의 자료를 가져가세요." })).toBeNull();
    expect(screen.queryByRole("button", { name: /감지 지점 CSV/ })).toBeNull();
    // 경로 줄(현재 위치)과 같은 줄
    const nav = screen.getByRole("navigation", { name: "현재 위치" });
    expect(nav.parentElement?.contains(share)).toBe(true);
  });

  it("공유 버튼은 대화상자만 열고, 안의 '링크 복사'를 누르는 순간 복사", async () => {
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
