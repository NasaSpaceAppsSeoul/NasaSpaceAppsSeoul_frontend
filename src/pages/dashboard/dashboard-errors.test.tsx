import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock";
import { korMeta } from "../../api/mock/kor";
import { renderRoute } from "../../test/render";

/*
 * 서버를 흉내 낸 대시보드 에러 화면 (live 모드 + `fetch` 바꾸기).
 */

const fetchMock = vi.fn<typeof fetch>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("대시보드 에러 화면", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("/meta가 실패하면 구역들 대신 서버 꺼짐 안내와 다시 시도, 머리글·푸터는 남는다", async () => {
    fetchMock.mockImplementation(async () => new Response("error code: 1033", { status: 530 }));
    renderRoute("/dashboard/KOR?month=2025-03");
    expect(await screen.findByRole("heading", { name: "서버에 연결할 수 없습니다" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "언어" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^기준 월/ })).toBeNull();
  });

  it("준비 안 된 나라(/meta 404)는 준비 중 안내, 다시 시도 없음", async () => {
    fetchMock.mockImplementation(async () => json({ code: "COUNTRY_NOT_READY", message: "x" }, 404));
    renderRoute("/dashboard/BC?month=2025-03");
    expect(await screen.findByRole("heading", { name: "이 나라는 아직 준비 중입니다" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });

  it("/meta는 되는데 나라 시계열을 처음부터 받지 못하면 구역 에러 한 장과 다시 시도", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/KOR/meta")) return json(korMeta);
      if (url.endsWith("/KOR/regions")) return json({ items: [{ id: "KOR", label_ko: "대한민국", name_en: "Republic of Korea", level: "nat", province: null, region_type: "sufficient", center: null, bbox: null }] });
      return json({ code: "UPSTREAM_UNAVAILABLE", message: "x" }, 503);
    });
    renderRoute("/dashboard/KOR?month=2025-03");
    expect(await screen.findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeTruthy();
  });

  it("지역 시계열이 비어 있으면 히트맵은 자리 표시 대신 안내 문구", async () => {
    const korSeries = await mockGet("/KOR/series/KOR");
    const regions = await mockGet("/KOR/regions");
    const judgement = await mockGet(`/KOR/judgement/${encodeURIComponent("경북")}?month=2025-03`);
    const baseline = await mockGet(`/KOR/baseline/${encodeURIComponent("경북")}`);
    fetchMock.mockImplementation(async (input) => {
      const url = decodeURIComponent(String(input));
      if (url.endsWith("/KOR/meta")) return json(korMeta);
      if (url.endsWith("/KOR/regions")) return json(regions);
      if (url.endsWith("/KOR/series/KOR")) return json(korSeries);
      if (url.endsWith("/KOR/series/경북")) return json({ id: "경북", level: "prov", months: [] });
      if (url.includes("/KOR/judgement/경북")) return json(judgement);
      if (url.endsWith("/KOR/baseline/경북")) return json(baseline);
      return json({ code: "NOT_FOUND", message: url }, 404);
    });
    renderRoute(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    expect(await screen.findByText("이 지역의 월별 자료가 없습니다.")).toBeTruthy();
  });

  it("/regions와 시계열이 둘 다 실패하면 다시 시도 한 번에 둘 다 다시 받는다", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/KOR/meta")) return json(korMeta);
      return json({ code: "INTERNAL", message: "x" }, 500);
    });
    renderRoute("/dashboard/KOR?month=2025-03");
    const retry = await screen.findByRole("button", { name: "다시 시도" });
    const count = (suffix: string) => fetchMock.mock.calls.filter(([input]) => String(input).includes(suffix)).length;
    const before = { regions: count("/KOR/regions"), series: count("/KOR/series/KOR") };
    fireEvent.click(retry);
    await waitFor(() => {
      expect(count("/KOR/regions")).toBeGreaterThan(before.regions);
      expect(count("/KOR/series/KOR")).toBeGreaterThan(before.series);
    });
  });
});
