import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { mockGet } from "../../api/mock";
import { renderRoute } from "../../test/render";

/*
 * 월간 인사이트 화면. 목 응답을 그대로 돌려주는 가짜 서버(live 모드 + `fetch` 바꾸기)로 그려서
 * 요청의 캐시 모드와 실패를 흉내 낼 수 있게 한다.
 */

const UISEONG = "91817680B75376031789242";
const BASE = "https://api.test/api/v1";
const fetchMock = vi.fn<typeof fetch>();

type Override = (path: string) => Response | null;
let override: Override = () => null;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

async function serve(input: RequestInfo | URL): Promise<Response> {
  const path = String(input).slice(BASE.length);
  const forced = override(path);
  if (forced !== null) return forced;
  try {
    return json(await mockGet(path));
  } catch (e) {
    if (e instanceof ApiError) return json({ code: e.code, message: e.message }, e.status);
    throw e;
  }
}

function insightCalls(): RequestInit[] {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes("/insight/")).map(([, init]) => init ?? {});
}

async function headCard() {
  const title = await screen.findByRole("heading", { name: /화재 인사이트$/ });
  const card = title.closest("section");
  if (card === null) throw new Error("머리 카드가 없다");
  return within(card);
}

describe("월간 인사이트", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", BASE);
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(serve);
    override = () => null;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("의성 2025-03: 머리 숫자 4개와 빌린 판정, 드문 지역이라 자기 순위 문장 없음", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const card = await headCard();
    expect(card.getByText("384")).toBeTruthy();
    expect(card.getByText("7일 / 3월 26일")).toBeTruthy();
    expect(card.getByText("최대 하루 108칸")).toBeTruthy();
    expect(card.getByText("919칸")).toBeTruthy();
    expect(card.getByText("3월 22–29일 · 인접 지역 포함")).toBeTruthy();
    expect(card.getByText("평소 불이 드문 지역")).toBeTruthy();
    expect(await card.findByText("경북 기준 매우 이례적")).toBeTruthy();
    expect(card.queryByText(/개 해 중/)).toBeNull();
    // 구역 순서: 달력 → 연도별 → 공식 기록 → 계절 → 지도 자리 → 주변 지역 → 읽는 법
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("의성군 · 2025년 3월 화재 인사이트");
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual([
      "3월 중 언제 화재 활동이 집중됐을까요?",
      "이번 3월을 다른 해와 비교하면?",
      "불이 감지된 해부터 살펴보세요.",
      "같은 달의 공식 산불 기록입니다.",
      "이번 달은 화재 집중 시기의 어디쯤일까요?",
      "이번 달 어디서 불이 감지됐을까요?",
      "같은 달의 우리 지역과 이웃을 살펴보세요.",
      "수치마다 비교 기준을 확인하세요.",
    ]);
    expect(screen.getByText("지도는 준비 중입니다.")).toBeTruthy();
    expect(screen.getByText("경북의 계절 패턴 참고")).toBeTruthy();
    expect(screen.getByText(/공식 기록 41건 중 17건을 위성이 2일 안에 감지했습니다\(41%\)/)).toBeTruthy();
  });

  it("/insight는 항상 cache: reload로 보낸다", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    await headCard();
    expect(insightCalls().length).toBeGreaterThan(0);
    expect(insightCalls().every((init) => init.cache === "reload")).toBe(true);
  });

  it("의성 2024-03(spatial 실패): 안내 띠, 달력 구역 안내, 다른 구역은 그린다. 다시 시도는 reload", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2024-03`);
    expect(await screen.findByText("일부 정보를 불러오지 못했습니다.")).toBeTruthy();
    const calendar = screen.getByRole("heading", { name: "3월 중 언제 화재 활동이 집중됐을까요?" }).closest("section");
    expect(calendar).not.toBeNull();
    expect(within(calendar as HTMLElement).getByText("자료를 불러오지 못했습니다.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "불이 감지된 해부터 살펴보세요." })).toBeTruthy();

    const before = insightCalls().length;
    fireEvent.click(within(screen.getByText("일부 정보를 불러오지 못했습니다.").closest("div") as HTMLElement).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(insightCalls().length).toBe(before + 1));
    expect(insightCalls().at(-1)?.cache).toBe("reload");
  });

  it("받아 둔 자료가 있는데 다시 받다 실패하면 구역은 남고 띠에 실패 안내", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2024-03`);
    const band = (await screen.findByText("일부 정보를 불러오지 못했습니다.")).closest("div") as HTMLElement;
    override = (path) => (path.includes("/insight/") ? json({ code: "INVALID_PARAM", message: "x" }, 400) : null);
    fireEvent.click(within(band).getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByText(/다시 불러오지 못했습니다/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "불이 감지된 해부터 살펴보세요." })).toBeTruthy();
  });

  it("/judgement만 실패하면 배지 자리에 안내와 다시 시도, 숫자는 그린다", async () => {
    override = (path) => (path.includes("/judgement/") ? json({ code: "REGION_NOT_FOUND", message: "x" }, 404) : null);
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const card = await headCard();
    expect(await card.findByText("판정을 불러오지 못했습니다.")).toBeTruthy();
    expect(card.getByText("384")).toBeTruthy();
  });

  it("2026년 달: /series 한 달을 받아 막대와 표에 2026을 붙인다", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2026-03`);
    const table = (await screen.findByRole("heading", { name: "불이 감지된 해부터 살펴보세요." })).closest("section") as HTMLElement;
    await waitFor(() => expect(within(table).getByText("선택 연도")).toBeTruthy());
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes(`/series/${UISEONG}?from=2026-03&to=2026-03`))).toBe(true);
    expect(within(table).getByText("2026")).toBeTruthy();
  });

  it("시·도 ID면 그 시·도의 대시보드로 간다", async () => {
    const { router } = renderRoute(`/insight/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${encodeURIComponent("경북")}`));
    expect(insightCalls()).toHaveLength(0);
  });

  it("없는 지역 ID면 지역 에러와 대시보드 링크", async () => {
    renderRoute("/insight/KOR/NOPE?month=2025-03");
    expect(await screen.findByRole("heading", { level: 1, name: "지역을 찾을 수 없습니다" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "대시보드로" })).toBeTruthy();
  });

  it("달이 없으면 자료의 마지막 달로", async () => {
    const { router } = renderRoute(`/insight/KOR/${UISEONG}`);
    await waitFor(() => expect(router.state.location.search).toBe("?month=2026-11"));
  });

  it("달력: 묶음 기간 중 감지된 날만 밑줄 이름이 붙고, 이웃에서만 탄 29일(0칸)은 붙지 않는다", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByRole("img", { name: /^3월 26일 · 108칸 · 최대 활동일 · 최대 감지 묶음 기간/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: "3월 29일 · 0칸" })).toBeTruthy();
    expect(screen.getByText(/파란 밑줄은 최대 감지 묶음\(3월 22–29일, 인접 지역 포함\) 중 이 지역에서 감지된 날입니다/)).toBeTruthy();
    expect(screen.getByText("화재 칸 · 파란 밑줄: 최대 감지 묶음 중 이 지역에서 감지된 날")).toBeTruthy();
  });

  it("달력: 묶음이 없는 달(2018-04 전)은 밑줄 설명 없이 '화재 칸'만", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2017-03`);
    expect(await screen.findByText("숫자는 그날 감지된 화재 칸 수입니다.")).toBeTruthy();
    expect(screen.getByText("화재 칸")).toBeTruthy();
    expect(screen.queryByText(/파란 밑줄/)).toBeNull();
  });

  it("주변 지역: 드문 이웃과 선택 지역 줄에는 순위가 없다(3-1)", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const section = (await screen.findByRole("heading", { name: "같은 달의 우리 지역과 이웃을 살펴보세요." })).closest("section") as HTMLElement;
    const rows = within(section).getAllByRole("row").slice(1);
    const sparseRows = rows.filter((row) => row.textContent?.includes("평소 불이 드문 지역"));
    expect(sparseRows.length).toBeGreaterThan(0);
    expect(sparseRows.every((row) => !/개 해 중/.test(row.textContent ?? ""))).toBe(true);
    expect(rows.some((row) => /14개 해 중 1위/.test(row.textContent ?? ""))).toBe(true);
  });

  it("집계 중인 달(2026-11): 집계 중 배지, 이웃 순위 숨김", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2026-11`);
    const card = await headCard();
    expect(card.getByText("집계 중")).toBeTruthy();
    const section = screen.getByRole("heading", { name: "같은 달의 우리 지역과 이웃을 살펴보세요." }).closest("section") as HTMLElement;
    expect(within(section).queryByText(/개 해 중/)).toBeNull();
  });

  it("의성 2023-03(series 실패): 연도별 두 카드는 안내, 달력은 그린다", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2023-03`);
    expect(await screen.findByText("일부 정보를 불러오지 못했습니다.")).toBeTruthy();
    const years = screen.getByRole("heading", { name: "이번 3월을 다른 해와 비교하면?" }).closest("section") as HTMLElement;
    expect(within(years).getByText("자료를 불러오지 못했습니다.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "3월 중 언제 화재 활동이 집중됐을까요?" }).closest("section")?.querySelector("[role=img]")).not.toBeNull();
  });

  it("/insight가 처음부터 범위 밖(400)이면 에러 한 장과 대시보드 링크", async () => {
    override = (path) => (path.includes("/insight/") ? json({ code: "MONTH_OUT_OF_RANGE", message: "x" }, 400) : null);
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByText("이 달은 자료 범위 밖입니다.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "대시보드로" }).getAttribute("href")).toBe(`/dashboard/KOR/${UISEONG}`);
  });

  it("영어 화면도 같은 구역을 그린다", async () => {
    renderRoute(`/en/insight/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByRole("heading", { name: "Uiseong-gun · March 2025 fire insight" })).toBeTruthy();
    expect(screen.getByText("7 days / Mar 26")).toBeTruthy();
  });
});
