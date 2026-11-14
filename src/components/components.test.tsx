import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../i18n";
import type { Locale } from "../lib/locale";
import { Dialog } from "./Dialog";
import { SectionError } from "./SectionError";
import { ServerDownNotice } from "./ServerDownNotice";

function inLocale(locale: Locale, children: ReactNode) {
  return render(<LocaleProvider locale={locale}>{children}</LocaleProvider>);
}

describe("Dialog", () => {
  it("열리면 모달로 열고 제목과 설명을 잇는다", () => {
    inLocale("ko", <Dialog open onClose={() => {}} title="시·도 선택" description="지역을 고르세요." />);
    const dialog = screen.getByRole("dialog", { name: "시·도 선택" });
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText("지역을 고르세요.").id);
  });

  it("닫혀 있으면 그리지 않는다", () => {
    inLocale("ko", <Dialog open={false} onClose={() => {}} title="시·도 선택" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Esc(cancel), 닫기 버튼, 바깥 클릭이 onClose를 부른다. 안쪽 클릭은 부르지 않는다", () => {
    const onClose = vi.fn();
    inLocale("en", <Dialog open onClose={onClose} title="Choose province"><p>inside</p></Dialog>);
    const dialog = screen.getByRole("dialog");

    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    // Esc 기본 동작(브라우저가 직접 닫기)은 막고 부모가 상태를 바꾸게 한다
    expect(dialog.hasAttribute("open")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);

    // 실제 브라우저처럼: 누른 곳과 뗀 곳이 다르면 click은 공통 부모(dialog)로 간다
    const press = (down: Element, up: Element, clicked: Element) => {
      fireEvent.mouseDown(down);
      fireEvent.mouseUp(up);
      fireEvent.click(clicked);
    };
    const inside = screen.getByText("inside");

    press(inside, inside, inside);
    expect(onClose).toHaveBeenCalledTimes(2);

    // 안쪽에서 누르고 바깥에서 뗀 경우(끌어 선택)는 닫지 않는다
    press(inside, dialog, dialog);
    expect(onClose).toHaveBeenCalledTimes(2);

    // 바깥에서 누르고 안쪽에서 뗀 경우도 닫지 않는다
    press(dialog, inside, dialog);
    expect(onClose).toHaveBeenCalledTimes(2);

    press(dialog, dialog, dialog);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("브라우저가 스스로 닫으면(close 이벤트는 나중에 온다) onClose를 한 번 부른다", async () => {
    const onClose = vi.fn();
    inLocale("ko", <Dialog open onClose={onClose} title="A" />);
    screen.getByRole<HTMLDialogElement>("dialog").close();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("StrictMode(개발 모드)에서 나중에 오는 close 이벤트가 와도 열린 채로 있고, 그 뒤 브라우저가 닫으면 한 번 부른다", async () => {
    const onClose = vi.fn();
    // StrictMode가 실제로 ref를 붙였다 떼었다 다시 붙였는지(showModal 2번) 함께 확인한다
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    render(
      <StrictMode>
        <LocaleProvider locale="ko">
          <Dialog open onClose={onClose} title="시·도 선택" />
        </LocaleProvider>
      </StrictMode>,
    );
    const dialog = screen.getByRole<HTMLDialogElement>("dialog");
    // StrictMode가 ref를 뗄 때 보낸 close 이벤트가 도착할 때까지 기다린다
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(showModal).toHaveBeenCalledTimes(2);
    showModal.mockRestore();
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(onClose).not.toHaveBeenCalled();

    dialog.close();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("부모가 닫으면(open=false) onClose를 다시 부르지 않는다", async () => {
    const onClose = vi.fn();
    const { rerender } = inLocale("ko", <Dialog open onClose={onClose} title="A" />);
    rerender(
      <LocaleProvider locale="ko">
        <Dialog open={false} onClose={onClose} title="A" />
      </LocaleProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("다시 그려도 showModal을 한 번만 부른다", () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    const { rerender } = inLocale("ko", <Dialog open onClose={() => {}} title="A" />);
    rerender(
      <LocaleProvider locale="ko">
        <Dialog open onClose={() => {}} title="B" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("dialog", { name: "B" }).hasAttribute("open")).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    showModal.mockRestore();
  });
});

describe("SectionError", () => {
  it("서버에 닿지 않으면 문구와 다시 시도를 보여 준다", () => {
    const onRetry = vi.fn();
    inLocale("ko", <SectionError kind="offline" onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("서버에 연결하지 못했습니다");
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("지역을 못 찾으면 다시 시도 대신 넘겨받은 행동을 보여 준다", () => {
    inLocale("en", <SectionError kind="region" onRetry={() => {}} action={<button type="button">Choose a region</button>} />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByRole("button", { name: "Choose a region" })).toBeTruthy();
  });
});

describe("ServerDownNotice", () => {
  it("서버 꺼짐은 다시 시도를, 준비 안 된 나라는 안내만 보여 준다", () => {
    const { unmount } = inLocale("ko", <ServerDownNotice kind="offline" onRetry={() => {}} />);
    expect(screen.getByRole("heading").textContent).toBe("서버에 연결할 수 없습니다");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeTruthy();
    unmount();

    inLocale("ko", <ServerDownNotice kind="notReady" onRetry={() => {}} />);
    expect(screen.getByRole("heading").textContent).toBe("이 나라는 아직 준비 중입니다");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("lighten (지역 그라데이션 경계 쪽 색)", () => {
  it("단계 색을 흰색과 섞는다", async () => {
    const { lighten } = await import("./map/layers");
    expect(lighten("#c95226", 0)).toBe("rgb(201,82,38)");
    expect(lighten("#c95226", 1)).toBe("rgb(255,255,255)");
    expect(lighten("#c95226", 0.3)).toBe("rgb(217,134,103)");
  });
});
