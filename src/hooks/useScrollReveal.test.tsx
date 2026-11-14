import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScrollReveal } from "./useScrollReveal";

/*
 * 스크롤 등장 훅. jsdom에는 IntersectionObserver가 없어 손으로 부를 수 있는 가짜를 넣는다.
 */
type Callback = (entries: { isIntersecting: boolean; target: Element }[]) => void;
const observers: { callback: Callback; observed: Set<Element>; disconnected: boolean }[] = [];

class FakeObserver {
  private readonly record: (typeof observers)[number];
  constructor(callback: Callback) {
    this.record = { callback, observed: new Set(), disconnected: false };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.observed.add(target);
  }
  unobserve(target: Element) {
    this.record.observed.delete(target);
  }
  disconnect() {
    this.record.disconnected = true;
    this.record.observed.clear();
  }
}

function Page() {
  const reveal = useScrollReveal();
  return (
    <main ref={reveal}>
      <section data-reveal data-testid="a">
        <button type="button">안의 버튼</button>
      </section>
      <section data-reveal data-testid="b" />
    </main>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  observers.length = 0;
});

describe("useScrollReveal", () => {
  it("관찰자가 있으면 처음엔 숨김(pending), 화면에 들어오면 보임(visible)", () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const { getByTestId } = render(<Page />);
    const a = getByTestId("a");
    const b = getByTestId("b");
    expect(a.dataset.revealState).toBe("pending");
    expect(b.dataset.revealState).toBe("pending");

    const io = observers[observers.length - 1];
    io?.callback([{ isIntersecting: true, target: a }]);
    expect(a.dataset.revealState).toBe("visible");
    expect(a.dataset.revealInstant).toBeUndefined();
    // 한 번 보이면 관찰을 멈춘다(다시 숨지 않음)
    expect(io?.observed.has(a)).toBe(false);
    expect(b.dataset.revealState).toBe("pending");
  });

  it("키보드 초점이 들어온 묶음은 그 자리에서 바로 보인다", () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const { getByTestId, getByRole } = render(<Page />);
    fireEvent.focusIn(getByRole("button", { name: "안의 버튼" }));
    expect(getByTestId("a").dataset.revealState).toBe("visible");
    expect(getByTestId("a").dataset.revealInstant).toBe("true");
  });

  it("떼면 관찰을 멈추고 붙였던 상태 속성을 지운다", () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const { getByTestId, unmount } = render(<Page />);
    const b = getByTestId("b");
    unmount();
    expect(observers.length).toBeGreaterThan(0);
    expect(observers.every((o) => o.disconnected)).toBe(true);
    expect(b.dataset.revealState).toBeUndefined();
  });

  it("관찰자가 없으면(jsdom 기본) 아무것도 숨기지 않는다", () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId("a").dataset.revealState).toBeUndefined();
  });
});

describe("useScrollReveal: 나중에 생기는 묶음", () => {
  it("자료를 받은 뒤 그려진 묶음도 숨김으로 두고 관찰한다", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    function Late({ ready }: { ready: boolean }) {
      const reveal = useScrollReveal();
      return <main ref={reveal}>{ready && <section data-reveal data-testid="late" />}</main>;
    }
    const view = render(<Late ready={false} />);
    view.rerender(<Late ready />);
    const late = view.getByTestId("late");
    // MutationObserver는 마이크로태스크로 알린다
    await Promise.resolve();
    expect(late.dataset.revealState).toBe("pending");
    expect(observers[observers.length - 1]?.observed.has(late)).toBe(true);
  });
});
