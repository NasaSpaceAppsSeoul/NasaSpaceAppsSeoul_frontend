import { act, cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEntryHashForTest } from "../../hooks/useActiveSection";
import { renderRoute } from "../../test/render";

/*
 * 기법 페이지(`/method`). 지금 있는 절: 머리, 01 질문, 02 데이터(`plans/method-page.md` 12절).
 * 목차의 "지금 보는 절"은 IntersectionObserver를 쓰는데 jsdom에는 없어 손으로 부를 수 있는 가짜를 넣는다.
 */
type Callback = (entries: { isIntersecting: boolean; target: Element }[]) => void;
const observers: { callback: Callback; observed: Set<Element> }[] = [];

class FakeObserver {
  private readonly record: (typeof observers)[number];
  constructor(callback: Callback) {
    this.record = { callback, observed: new Set() };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.observed.add(target);
  }
  unobserve(target: Element) {
    this.record.observed.delete(target);
  }
  disconnect() {
    this.record.observed.clear();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetEntryHashForTest();
  observers.length = 0;
});

const title = () => screen.findByRole("heading", { level: 1 });

describe("기법 페이지", () => {
  it("머리 · 숫자 카드 3장 · 01 · 02 순서, 머리글은 소개가 켜진다", async () => {
    renderRoute("/method");
    expect((await title()).textContent).toBe("25년의 불을 하나의 자로.");
    const stats = within(screen.getByRole("list", { name: "요약 숫자" })).getAllByRole("listitem");
    expect(stats).toHaveLength(3);
    expect(stats[2]?.textContent).toContain("날짜를 30일 옮기면 3–54%");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["우리가 답하는 질문", "데이터"]);
    const nav = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(within(nav).getByRole("link", { name: "소개" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "← 소개로 돌아가기" }).getAttribute("href")).toBe("/");
  });

  it("02 데이터: 위성 기간 그림의 읽는 이름과 지역별 공식 기록 표", async () => {
    renderRoute("/method");
    const data = within(await screen.findByRole("region", { name: "데이터" }));
    expect(data.getByRole("img").getAttribute("aria-label")).toContain("NOAA-20 2018년 4월부터 현재까지");
    const rows = data.getAllByRole("row").map((row) => row.textContent);
    expect(rows).toHaveLength(4);
    expect(rows[1]).toContain("산림청 산불 기록 7,628건");
  });

  it("목차는 절 해시로 가는 링크이고, 영어 주소는 같은 해시 이름을 쓴다", async () => {
    renderRoute("/method");
    await title();
    const toc = screen.getByRole("navigation", { name: "목차" });
    expect(within(toc).getByRole("link", { name: "02데이터" }).getAttribute("href")).toBe("/method#data");
    cleanup();

    renderRoute("/en/method#data");
    expect((await title()).textContent).toBe("One scale for 25 years of fire.");
    const enToc = screen.getByRole("navigation", { name: "Contents" });
    expect(within(enToc).getByRole("link", { name: "02Data" }).getAttribute("href")).toBe("/en/method#data");
    expect(screen.getByRole("link", { name: "KR" }).getAttribute("href")).toBe("/method#data");
  });

  it("스크롤로 보는 절이 바뀌면 목차를 켜고, 언어 전환 링크가 그 절로 간다", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    renderRoute("/method");
    await title();
    const section = document.getElementById("data");
    const spy = observers.find((o) => section !== null && o.observed.has(section));
    expect(spy).toBeDefined();
    if (section === null || spy === undefined) return;

    act(() => spy.callback([{ isIntersecting: true, target: section }]));
    const toc = screen.getByRole("navigation", { name: "목차" });
    expect(within(toc).getByRole("link", { name: "02데이터" }).getAttribute("aria-current")).toBe("location");
    expect(within(toc).getByRole("link", { name: "01질문" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: "EN" }).getAttribute("href")).toBe("/en/method#data");
  });

  it("머리로 다시 올라가면 언어 전환 링크는 해시 없이 맨 위로, 페이지를 떠나면 다시 주소의 해시를 쓴다", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const { router } = renderRoute("/method#data");
    await title();
    const data = document.getElementById("data");
    const question = document.getElementById("question");
    const spy = observers.find((o) => data !== null && o.observed.has(data));
    if (data === null || question === null || spy === undefined) throw new Error("절을 찾지 못함");
    act(() => spy.callback([{ isIntersecting: true, target: data }]));
    expect(screen.getByRole("link", { name: "EN" }).getAttribute("href")).toBe("/en/method#data");

    // 첫 절이 화면 아래쪽에 있다 = 머리를 보는 중. jsdom은 문서 높이가 0이라 "페이지 끝"으로 보지 않게 높이를 준다
    vi.spyOn(question, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 5000, 100, 100));
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 100000 });
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(screen.getByRole("link", { name: "EN" }).getAttribute("href")).toBe("/en/method");
    const toc = screen.getByRole("navigation", { name: "목차" });
    expect(within(toc).getByRole("link", { name: "02데이터" }).getAttribute("aria-current")).toBeNull();

    await act(() => router.navigate("/dashboard/KOR?month=2025-03#calendar"));
    expect(screen.getByRole("link", { name: "EN" }).getAttribute("href")).toBe("/en/dashboard/KOR?month=2025-03#calendar");
    Reflect.deleteProperty(document.documentElement, "scrollHeight");
  });

  it("해시를 달고 문서에 처음 들어오면 다음 프레임에 그 절로 옮기고, 뒤로 가기로 돌아오면 보던 위치를 두고 덮어쓰지 않는다", async () => {
    // 라우터 스크롤 복원도 해시 절을 부르므로, 훅의 이동은 프레임을 직접 흘린 뒤에 생긴 호출로 본다
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    const flush = () => act(() => frames.splice(0).forEach((callback) => callback(0)));
    const scrolled: string[] = [];
    const spy = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(function (this: Element) {
      scrolled.push(this.id);
    });

    const { router } = renderRoute("/method#data");
    await title();
    scrolled.length = 0;
    flush();
    expect(scrolled).toEqual(["data"]);
    // 다음 프레임에 부드러운 스크롤을 켠다(들어올 때의 이동은 바로)
    expect(document.querySelector("[data-smooth-scroll]")).not.toBeNull();

    await act(() => router.navigate("/dashboard/KOR"));
    expect(document.querySelector("[data-smooth-scroll]")).toBeNull();
    await act(() => router.navigate(-1));
    await title();
    scrolled.length = 0;
    flush();
    expect(scrolled).toEqual([]);
    spy.mockRestore();
  });

  it("뒤에 칸이 더 붙은 주소는 없는 주소 안내", async () => {
    renderRoute("/method/x");
    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.queryByText("25년의 불을 하나의 자로.")).toBeNull();
  });
});
