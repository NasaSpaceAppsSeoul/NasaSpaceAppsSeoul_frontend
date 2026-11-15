import { fullText } from "../../test/fullText";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/client";
import { mockGet } from "../../api/mock";
import type { Insight } from "../../api/types";
import { fakeMaps, type FakeMap } from "../../test/fakeMaplibre";
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
  // 머리는 카드 없는 <header>(2026-11-15 절 구성 변경)
  const title = await screen.findByRole("heading", { name: /화재 인사이트$/ });
  const card = title.closest("header");
  if (card === null) throw new Error("머리가 없다");
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
    expect(card.getByText(fullText("384"))).toBeTruthy();
    expect(card.getByText(fullText("7일 / 3월 26일"))).toBeTruthy();
    expect(card.getByText("최대 하루 108칸")).toBeTruthy();
    expect(card.getByText(fullText("919칸"))).toBeTruthy();
    expect(card.getByText("3월 22–29일 · 인접 지역 포함")).toBeTruthy();
    expect(card.getByText("평소 불이 드문 지역")).toBeTruthy();
    expect(await card.findByText("경북 기준 매우 이례적")).toBeTruthy();
    expect(card.queryByText(/개 해 중/)).toBeNull();
    // 절 순서: 달력 → 연도별 → 공식 기록 → 계절 → 지도 → 주변 지역 → 읽는 법
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("의성군 · 2025년 3월 화재 인사이트");
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    // 선으로 나눈 번호 절 01~07(2026-11-15). 절 제목은 예전 구역의 작은 이름이고, 질문은 요지 문단이다
    expect(titles).toEqual(["일별 화재 활동", "다른 해의 같은 달", "공식 기록 대조", "계절적 맥락", "화재 칸과 감지 위치", "주변 지역", "해석 안내"]);
    expect(screen.getByText("3월 중 언제 화재 활동이 집중됐을까요?")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "불이 감지된 해부터 살펴보세요." })).toBeTruthy();
    expect(await screen.findByText("점은 의성군 안에서 감지된 칸만 표시합니다.")).toBeTruthy();
    expect(screen.getByText("경북의 계절 패턴 참고")).toBeTruthy();
    expect(screen.getByText(/공식 기록 41건 중 17건을 위성이 2일 안에 감지했습니다\(41%\)/)).toBeTruthy();
  });

  it("공식 기록 면적: 0은 빈칸, 0.1 ha 미만은 \"0.1 미만\"(반올림하면 0으로 보여서, 9장 2차)", async () => {
    const insight = (await mockGet(`/KOR/insight/${UISEONG}?month=2025-03`)) as Insight;
    insight.official = [
      { date: "2025-03-22", place: "큰 불", cause: "원인 미상", area_ha: 52707.3, region_id: UISEONG },
      { date: "2025-03-23", place: "작은 불", cause: "원인 미상", area_ha: 0.03, region_id: UISEONG },
      { date: "2025-03-24", place: "경계", cause: "원인 미상", area_ha: 0.1, region_id: UISEONG },
      { date: "2025-03-24", place: "면적 모름", cause: "원인 미상", area_ha: 0, region_id: UISEONG },
    ];
    override = (path) => (path.includes("/insight/") ? json(insight) : null);
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const table = await screen.findByRole("table", { name: "공식 기록 대조" });
    const areas = within(table).getAllByRole("row").slice(1).map((r) => r.lastElementChild?.textContent);
    expect(areas).toEqual(["52,707.3", "0.1 미만", "0.1", ""]);
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
    const calendar = screen.getByRole("region", { name: "일별 화재 활동" }).closest("section");
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
    expect(card.getByText(fullText("384"))).toBeTruthy();
  });

  it("2026년 달: /series 한 달을 받아 막대와 표에 2026을 붙인다", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2026-03`);
    // 표만 본다(같은 절의 막대 그림에도 "2026" 글자가 있다)
    const table = await screen.findByRole("table", { name: "불이 감지된 해" });
    await waitFor(() => expect(within(table).getByText("선택 연도")).toBeTruthy());
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes(`/series/${UISEONG}?from=2026-03&to=2026-03`))).toBe(true);
    expect(within(table).getByText("2026")).toBeTruthy();
  });

  it("왼쪽 목차(2026-11-15): 절 7개, 누르면 해시만 바뀌고 달은 그대로", async () => {
    const { router } = renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const nav = within(await screen.findByRole("navigation", { name: "목차" }));
    expect(nav.getAllByRole("link").map((a) => a.textContent)).toEqual([
      "01일별 화재 활동",
      "02다른 해의 같은 달",
      "03공식 기록 대조",
      "04계절적 맥락",
      "05화재 칸과 감지 위치",
      "06주변 지역",
      "07해석 안내",
    ]);
    fireEvent.click(nav.getByRole("link", { name: /주변 지역/ }));
    await waitFor(() => expect(router.state.location.hash).toBe("#neighbors"));
    expect(router.state.location.search).toBe("?month=2025-03");
    expect(router.state.location.pathname).toBe(`/insight/KOR/${UISEONG}`);
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
    const section = (await screen.findByRole("region", { name: "주변 지역" })).closest("section") as HTMLElement;
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
    const section = screen.getByRole("region", { name: "주변 지역" }).closest("section") as HTMLElement;
    expect(within(section).queryByText(/개 해 중/)).toBeNull();
  });

  it("의성 2023-03(series 실패): 연도별 절은 안내, 달력은 그린다", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2023-03`);
    expect(await screen.findByText("일부 정보를 불러오지 못했습니다.")).toBeTruthy();
    const years = screen.getByRole("region", { name: "다른 해의 같은 달" }).closest("section") as HTMLElement;
    expect(within(years).getByText("자료를 불러오지 못했습니다.")).toBeTruthy();
    expect(screen.getByRole("region", { name: "일별 화재 활동" }).closest("section")?.querySelector("[role=img]")).not.toBeNull();
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
    expect(screen.getByText(fullText("7 days / Mar 26"))).toBeTruthy();
  });
});

/* 지도 구역 (`plans/insight.md` 12절). 지도 그림은 가짜 maplibre로 확인한다(`test/fakeMaplibre.ts`). */
const ANDONG = "91817680B16014600177045";

async function mapSection(): Promise<HTMLElement> {
  const heading = await screen.findByRole("region", { name: "화재 칸과 감지 위치" });
  const section = heading.closest("section");
  if (section === null) throw new Error("지도 절이 없다");
  return section;
}

async function loadedMap(): Promise<FakeMap> {
  await screen.findByRole("img", { name: /^이번 달 어디서 불이 감지됐을까요\? 지역 \d+곳/ });
  return waitFor(() => {
    const map = fakeMaps.at(-1);
    if (map === undefined || map.sources.get("regions")?.data === null) throw new Error("아직");
    return map;
  });
}

const regionIds = (map: FakeMap) =>
  ((map.sources.get("regions")?.data as { features: { properties: { id: string } }[] } | null)?.features ?? []).map((f) => f.properties.id);

describe("월간 인사이트 지도", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", BASE);
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(serve);
    override = () => null;
  });

  afterEach(() => {
    fakeMaps.length = 0;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("의성 2025-03: 자기 + 응답의 이웃, 자기에 파란 테두리, 점은 자기 안의 것만이라는 줄", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const section = await mapSection();
    expect(await within(section).findByText("의성군과 주변 지역 · 2025년 3월")).toBeTruthy();
    const map = await loadedMap();
    const r = (await mockGet(`/KOR/insight/${UISEONG}?month=2025-03`)) as Insight;
    await waitFor(() => expect(regionIds(map)).toContain(ANDONG));
    expect(regionIds(map).every((id) => id === UISEONG || r.neighbors.some((n) => n.id === id))).toBe(true);
    await waitFor(() => expect(map.filters.get("selected-line")).toEqual(["==", ["get", "id"], UISEONG]));
    expect(within(section).getByText("선택 지역 · 파란 테두리")).toBeTruthy();
    expect(within(section).getByText("점은 의성군 안에서 감지된 칸만 표시합니다.")).toBeTruthy();
    expect(within(section).queryByRole("alert")).toBeNull();
    // 인사이트 지도는 지도 위에 판이 없는 기본 배치라 처음 맞춤 여백도 기본 16(대시보드 지도 카드만 판 자리를 비운다)
    expect(map.fitPaddings[0]).toBe(16);
    // 확대·축소(대시보드 지역 지도와 같은 `RegionMap`, `plans/dashboard-sections.md` 14절)
    expect(map.options).toMatchObject({ dragPan: true, scrollZoom: true });
    expect(within(section).getByRole("button", { name: "확대" })).toBeTruthy();
  });

  it("툴팁: 이웃은 이름과 값, 점은 자기 이름과 날짜. 이웃을 누르면 그 이웃의 같은 달 인사이트(자기는 무시)", async () => {
    const { router } = renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const map = await loadedMap();
    await waitFor(() => expect(regionIds(map)).toContain(ANDONG));
    map.hits = [{ layer: "region-fill", properties: { id: ANDONG } }];
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    expect((await screen.findByRole("tooltip")).textContent).toMatch(/^안동시.*화재 칸 220$/);
    map.hits = [{ layer: "points", properties: { index: 0 } }];
    act(() => map.emit("mousemove", { point: { x: 10, y: 10 } }));
    await waitFor(() => expect(screen.getByRole("tooltip").textContent).toMatch(/^의성군이 칸의 첫 감지일2025-03-\d{2}$/));

    // 자기 지역을 눌러도 같은 주소로 다시 가지 않는다(같은 경로라 경로 대신 기록 항목으로 확인)
    const before = router.state.location.key;
    map.hits = [{ layer: "region-fill", properties: { id: UISEONG } }];
    act(() => map.emit("click", { point: { x: 10, y: 10 } }));
    expect(router.state.location.key).toBe(before);
    map.hits = [{ layer: "region-fill", properties: { id: ANDONG } }];
    act(() => map.emit("click", { point: { x: 10, y: 10 } }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/insight/KOR/${ANDONG}`));
    expect(router.state.location.search).toBe("?month=2025-03");
  });

  it("의성 2024-03(spatial 실패): 면은 그리고 점 실패 안내와 다시 시도(reload), 점 설명 줄 없음", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2024-03`);
    const section = await mapSection();
    const alert = await within(section).findByRole("alert");
    expect(alert.textContent).toMatch(/감지 지점을 불러오지 못했습니다/);
    await loadedMap();
    expect(within(section).queryByText(/점은 의성군 안에서/)).toBeNull();
    const before = insightCalls().length;
    fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(insightCalls().length).toBe(before + 1));
    expect(insightCalls().at(-1)?.cache).toBe("reload");
  });

  it("의성 2022-03(판정 실패): 자기 값 실패 안내, 이웃이 빠졌다는 줄, 설명에 '주변 지역' 없음", async () => {
    renderRoute(`/insight/KOR/${UISEONG}?month=2022-03`);
    const section = await mapSection();
    expect((await within(section).findByRole("alert")).textContent).toMatch(/이 지역의 값을 불러오지 못했습니다/);
    expect(within(section).getByText("일부 이웃이 빠졌을 수 있습니다.")).toBeTruthy();
    const map = await loadedMap();
    await waitFor(() => expect(regionIds(map)).toEqual([UISEONG]));
    expect(within(section).getByText("의성군 · 2022년 3월")).toBeTruthy();
  });

  it("2012-02 전 달: 판정이 실패해도(reason 없음) 달로 판단해 MODIS 안내 줄", async () => {
    fetchMock.mockImplementation(async (input) => {
      const res = await serve(input);
      if (!String(input).includes("/insight/")) return res;
      const body = (await res.json()) as Insight;
      return json({ ...body, head: { ...body.head, reason: null }, unavailable: ["judge"] });
    });
    renderRoute(`/insight/KOR/${UISEONG}?month=2010-03`);
    const section = await mapSection();
    expect(await within(section).findByText("2012년 2월 이전은 시·군·구 값이 없어 감지 지점(MODIS)만 표시합니다.")).toBeTruthy();
  });

  it("이웃 일부만 실패(안 ⓐ): 빠진 이웃 도형은 그리지 않고 안내 줄, 남은 이웃은 그린다", async () => {
    fetchMock.mockImplementation(async (input) => {
      const res = await serve(input);
      if (!String(input).includes("/insight/")) return res;
      const body = (await res.json()) as Insight;
      return json({ ...body, neighbors: body.neighbors.filter((n) => n.id !== ANDONG), unavailable: ["neighbors"] });
    });
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const section = await mapSection();
    expect(await within(section).findByText("일부 이웃이 빠졌을 수 있습니다.")).toBeTruthy();
    const map = await loadedMap();
    await waitFor(() => expect(regionIds(map).length).toBeGreaterThan(1));
    expect(regionIds(map)).toContain(UISEONG);
    expect(regionIds(map)).not.toContain(ANDONG);
    expect(within(section).queryByRole("alert")).toBeNull();
  });

  it("판정과 점이 함께 실패하면 안내 한 줄로 합친다", async () => {
    fetchMock.mockImplementation(async (input) => {
      const res = await serve(input);
      if (!String(input).includes("/insight/")) return res;
      const body = (await res.json()) as Insight;
      return json({ ...body, map: null, unavailable: ["judge", "spatial", "neighbors"] });
    });
    renderRoute(`/insight/KOR/${UISEONG}?month=2022-03`);
    const section = await mapSection();
    const alerts = await within(section).findAllByRole("alert");
    expect(alerts.map((a) => a.textContent)).toEqual([expect.stringMatching(/^일부 지도 정보를 불러오지 못했습니다/)]);
  });

  it("점이 0개면 점 기준 안내만(점 설명 줄은 빼고)", async () => {
    fetchMock.mockImplementation(async (input) => {
      const res = await serve(input);
      if (!String(input).includes("/insight/")) return res;
      const body = (await res.json()) as Insight;
      return json({ ...body, map: body.map === null ? null : { ...body.map, points: [] } });
    });
    renderRoute(`/insight/KOR/${UISEONG}?month=2025-03`);
    const section = await mapSection();
    expect(await within(section).findByText("이번 달 의성군 안에 표시할 감지 지점이 없습니다.")).toBeTruthy();
    expect(within(section).queryByText(/점은 의성군 안에서/)).toBeNull();
  });
});
