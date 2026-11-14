import { act, cleanup, fireEvent, screen, within } from "@testing-library/react";
import { mockGet } from "../../api/mock/index";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEntryHashForTest } from "../../hooks/useActiveSection";
import { renderRoute } from "../../test/render";
import { COUNTRIES } from "../../lib/country";

/*
 * 기법 페이지(`/method`). 절: 머리, 01~10, 끝 줄(`plans/method-page.md` 12절).
 * 목차의 "지금 보는 절"은 IntersectionObserver를 쓰는데 jsdom에는 없어 손으로 부를 수 있는 가짜를 넣는다.
 */
type Callback = (entries: { isIntersecting: boolean; target: Element; boundingClientRect?: DOMRect }[]) => void;
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
  it("머리 · 숫자 카드 3장 · 01~10 · 끝 줄 순서, 머리글은 소개가 켜진다", async () => {
    renderRoute("/method");
    expect((await title()).textContent).toBe("25년의 불을 하나의 자로.");
    const stats = within(screen.getByRole("list", { name: "요약 숫자" })).getAllByRole("listitem");
    expect(stats).toHaveLength(3);
    expect(stats[2]?.textContent).toContain("날짜를 30일 옮기면 3–54%");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "우리가 답하는 질문",
      "데이터",
      "화재 칸: 무엇을 세나",
      "센서를 하나의 자로 맞추기",
      "보정이 맞는지 어떻게 아나",
      "판단 칩",
      "불이 드문 구역",
      "나머지 지표",
      "한계",
      "만든 방법과 배운 것",
      "출처",
    ]);
    const nav = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(within(nav).getByRole("link", { name: "소개" }).getAttribute("aria-current")).toBe("page");
    // 머리의 링크와 목차 위 자리(머리 링크가 화면 위로 나가기 전에는 숨김)
    const backs = screen.getAllByRole("link", { name: "← 소개로 돌아가기" });
    expect(backs.map((a) => a.getAttribute("href"))).toEqual(["/", "/"]);
    expect(backs[1]?.hasAttribute("inert")).toBe(true);
  });

  it("02 데이터: 위성 기간 그림의 읽는 이름과 지역별 공식 기록 표", async () => {
    renderRoute("/method");
    const data = within(await screen.findByRole("region", { name: "데이터" }));
    expect(data.getByRole("img").getAttribute("aria-label")).toContain("NOAA-20 2018년 4월부터 현재까지");
    const rows = data.getAllByRole("row").map((row) => row.textContent);
    expect(rows).toHaveLength(1 + COUNTRIES.length);
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

  it("머리의 돌아가기 링크가 화면 위로 나가면 목차 위 링크가 나타나고, 다시 보이면 숨는다(화면 아래는 해당 없음)", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    renderRoute("/method");
    await title();
    const [hero, pinned] = screen.getAllByRole("link", { name: "← 소개로 돌아가기" });
    const holder = hero?.parentElement;
    const watchers = observers.filter((o) => holder !== null && holder !== undefined && o.observed.has(holder));
    // 다시 그려도 관찰자가 늘지 않는다(라우터 Link가 아닌 감싼 칸에 달았다)
    expect(watchers).toHaveLength(1);
    const watcher = watchers[0];
    if (hero === undefined || pinned === undefined || watcher === undefined) throw new Error("돌아가기 링크 관찰자를 찾지 못함");
    expect(pinned.hasAttribute("inert")).toBe(true);
    act(() => watcher.callback([{ isIntersecting: false, target: hero, boundingClientRect: new DOMRect(0, -40, 100, 20) }]));
    expect(observers.filter((o) => holder !== null && holder !== undefined && o.observed.has(holder))).toHaveLength(1);
    expect(pinned.hasAttribute("inert")).toBe(false);
    // 한 번에 두 항목이 오면 마지막(최근) 상태를 쓴다
    act(() =>
      watcher.callback([
        { isIntersecting: false, target: hero, boundingClientRect: new DOMRect(0, -40, 100, 20) },
        { isIntersecting: true, target: hero, boundingClientRect: new DOMRect(0, 120, 100, 20) },
      ]),
    );
    expect(pinned.hasAttribute("inert")).toBe(true);
    act(() => watcher.callback([{ isIntersecting: false, target: hero, boundingClientRect: new DOMRect(0, 2000, 100, 20) }]));
    expect(pinned.hasAttribute("inert")).toBe(true);
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

describe("기법 페이지 03·04", () => {
  it("03: 설명용 칸 그림 두 장, 칸 크기 표는 사용한 0.01° 줄을 강조, 바뀐 과정 묶음", async () => {
    renderRoute("/method");
    const cell = within(await screen.findByRole("region", { name: "화재 칸: 무엇을 세나" }));
    expect(cell.getAllByRole("img").map((img) => img.getAttribute("aria-label"))).toEqual([
      "MODIS: 점 4개가 칸 3개에 떨어짐",
      "VIIRS: 점 19개가 같은 칸 3개에 떨어짐",
    ]);
    expect(cell.getByText("설명용 예시이며 실제 탐지가 아닙니다")).toBeTruthy();
    const used = cell.getByRole("rowheader", { name: "0.01° (사용)" }).closest("tr");
    expect(used?.className).toContain("bg-tone-orange");
    expect(cell.getByText("바뀐 과정: 고정 열원 마스크")).toBeTruthy();
  });

  it("04: 연간 그림은 한국으로 시작하고, 나라 탭을 누르면 그 나라 값으로 바뀐다", async () => {
    renderRoute("/method");
    const section = within(await screen.findByRole("region", { name: "센서를 하나의 자로 맞추기" }));
    expect(await section.findByRole("img", { name: "한국 연간 화재 칸 2001–2025, 보정 전과 보정 후" })).toBeTruthy();
    const tabs = section.getByRole("group", { name: "나라 고르기" });
    expect(within(tabs).getByRole("button", { name: "한국" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(within(tabs).getByRole("button", { name: "BC" }));
    expect(within(tabs).getByRole("button", { name: "BC" }).getAttribute("aria-pressed")).toBe("true");
    expect(await section.findByRole("img", { name: "BC 연간 화재 칸 2001–2025, 보정 전과 보정 후" })).toBeTruthy();
    // 사슬 네 칸, 배제한 대안 10줄(머리 줄 제외)
    expect(within(section.getByRole("list", { name: /보정 사슬/ })).getAllByRole("listitem")).toHaveLength(4);
    const excluded = section.getByRole("table", { name: "검토했지만 쓰지 않은 보정 방법과 이유" });
    expect(excluded.querySelectorAll("tbody tr")).toHaveLength(10);
    // 숨긴 값 표: 25개 해, 그림 설명에 고른 나라 이름
    expect(section.getByRole("table", { name: "BC 연간 화재 칸 2001–2025, 보정 전과 보정 후" }).querySelectorAll("tbody tr")).toHaveLength(25);
    expect(section.getByText(/^BC · 연간 화재 칸 2001–2025/)).toBeTruthy();
  });
});

describe("기법 페이지 05·06", () => {
  it("05: 결과 표 5줄, 크기별 감지율 다섯 단계(공용 이름 표로 옮김), BC 탭", async () => {
    renderRoute("/method");
    const section = within(await screen.findByRole("region", { name: "보정이 맞는지 어떻게 아나" }));
    expect(section.getByRole("table", { name: "지역별 검증 결과" }).querySelectorAll("tbody tr")).toHaveLength(5);
    const values = await section.findByRole("table", { name: "한국 산불 크기별 위성 감지율과 우연 기준" });
    expect(within(values).getAllByRole("rowheader").map((h) => h.textContent)).toEqual([
      "0.1 ha 미만",
      "0.1–1 ha",
      "1–10 ha",
      "10–100 ha",
      "100 ha 이상",
    ]);
    fireEvent.click(within(section.getByRole("group", { name: "나라 고르기" })).getByRole("button", { name: "BC" }));
    expect(await section.findByRole("img", { name: "BC 산불 크기별 위성 감지율과 우연 기준" })).toBeTruthy();
    expect(section.getByText("BC를 \"판단 보류\"로 둔 이유")).toBeTruthy();
  });

  it("06: 사이트와 같은 칩 네 개, 대표 달 제목(배수·순위), 같은 달 25개 해", async () => {
    renderRoute("/method");
    const section = within(await screen.findByRole("region", { name: "판단 칩" }));
    expect(within(section.getByRole("list", { name: "판단 칩 네 가지" })).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "매우 이례적",
      "평소보다 많음",
      "평소 범위",
      "평소보다 적음",
    ]);
    expect(await section.findByText("2025년 3월은 평년 3월의 6.28배, 25년 중 가장 많았습니다")).toBeTruthy();
    const values = section.getByRole("table", { name: "한국 2001–2025년 3월 화재 칸과 보통 범위" });
    expect(values.querySelectorAll("tbody tr")).toHaveLength(25);
  });
});

describe("기법 페이지 07·08", () => {
  it("07: 빌리는 순서 세 단계, 현황 표 네 줄, 기준 표는 사용한 30% 줄을 강조", async () => {
    renderRoute("/method");
    const section = within(await screen.findByRole("region", { name: "불이 드문 구역" }));
    expect(within(section.getByRole("list", { name: "판정을 빌리는 순서" })).getAllByRole("listitem")).toHaveLength(3);
    expect(section.getByRole("table", { name: "구역 성격 현황" }).querySelectorAll("tbody tr")).toHaveLength(4);
    const used = section.getByRole("rowheader", { name: "30%(사용)" }).closest("tr");
    expect(used?.className).toContain("bg-tone-orange");
  });

  it("08: 지표 표 11줄, 민감도 표, 바뀐 정의 7개", async () => {
    renderRoute("/method");
    const section = within(await screen.findByRole("region", { name: "나머지 지표" }));
    expect(section.getByRole("table", { name: "지표별 계산과 이유" }).querySelectorAll("tbody tr")).toHaveLength(11);
    expect(section.getByRole("table", { name: "기준값을 바꿨을 때의 결과" })).toBeTruthy();
    expect(section.getByText("감지 묶음: 2 km·1일 → 3 km·2일")).toBeTruthy();
  });
});

describe("기법 페이지 09·10·끝", () => {
  it("09 한계 카드 10개, 10 기술 표 5줄·다섯 단계·판단 7개, 끝 줄 링크(언어 유지, 맨 위로는 해시 없는 주소)", async () => {
    renderRoute("/en/method#built");
    await title();
    const limits = within(screen.getByRole("region", { name: "Limits" }));
    // 한계 카드 목록(첫 목록) 10개 + 시험하지 않은 선택 4개
    const [cards, untested] = limits.getAllByRole("list");
    expect(cards === undefined ? [] : within(cards).getAllByRole("listitem")).toHaveLength(10);
    expect(untested === undefined ? [] : within(untested).getAllByRole("listitem")).toHaveLength(4);
    const built = within(screen.getByRole("region", { name: "How it's built and what we learned" }));
    expect(built.getByRole("table", { name: "Technology and reasons by layer" }).querySelectorAll("tbody tr")).toHaveLength(5);
    expect(within(built.getByRole("list", { name: "Five steps to add a region" })).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Explore dashboard →" }).getAttribute("href")).toBe("/en/dashboard");
    expect(screen.getByRole("link", { name: "Back to top ↑" }).getAttribute("href")).toBe("/en/method");
    const toc = screen.getByRole("navigation", { name: "Contents" });
    // 절 링크 10개(맨 위 돌아가기 링크 자리는 목록 밖)
    expect(within(within(toc).getByRole("list")).getAllByRole("link")).toHaveLength(10);
    cleanup();

    renderRoute("/method#built");
    await title();
    expect(screen.getByRole("link", { name: "대시보드 보기 →" }).getAttribute("href")).toBe("/dashboard");
    expect(screen.getByRole("link", { name: "맨 위로 ↑" }).getAttribute("href")).toBe("/method");
  });
});

describe("기법 페이지 04 그림 (서버 에러)", () => {
  const fetchMock = vi.fn<typeof fetch>();
  afterEach(() => {
    vi.unstubAllEnvs();
    fetchMock.mockReset();
  });

  it("/landing이 실패하면 그것을 쓰는 그림 자리(04·05·06)에만 다시 시도, 글은 남고, 한 곳에서 다시 시도하면 모두 그려진다", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal("fetch", fetchMock);
    let down = true;
    fetchMock.mockImplementation(async (input) => {
      const path = String(input).replace("https://api.test/api/v1", "");
      if (down && path === "/KOR/landing") {
        return new Response(JSON.stringify({ code: "UPSTREAM_UNAVAILABLE", message: "x" }), { status: 503 });
      }
      return new Response(JSON.stringify(await mockGet(path)), { status: 200 });
    });
    renderRoute("/method");
    const section = within(await screen.findByRole("region", { name: "센서를 하나의 자로 맞추기" }));
    const retry = await section.findByRole("button", { name: "다시 시도" });
    expect(section.getByText("보정 사슬")).toBeTruthy();
    expect(await screen.findAllByRole("button", { name: "다시 시도" })).toHaveLength(3);
    down = false;
    fireEvent.click(retry);
    expect(await section.findByRole("img", { name: /한국 연간 화재 칸/ })).toBeTruthy();
    expect(await screen.findByRole("img", { name: /한국 산불 크기별 위성 감지율/ })).toBeTruthy();
    expect(await screen.findByRole("img", { name: /한국 2001–2025년 3월 화재 칸/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });
});
