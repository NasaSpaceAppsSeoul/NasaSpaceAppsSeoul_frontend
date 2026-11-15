import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock";
import type { BaselineResponse, RegionDetail } from "../../api/types";
import { renderRoute } from "../../test/render";

/*
 * 나라 화면 아래 줄 (5장): 평소 화재 집중 시기 카드 + 월별 선 그래프.
 */
async function card(name: RegExp | string): Promise<HTMLElement> {
  const heading = await screen.findByRole("heading", { name });
  const section = heading.closest("section");
  if (section === null) throw new Error("카드 없음");
  return section;
}

function failing(match: (path: string) => boolean) {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input));
      const path = url.pathname.replace("/api/v1", "") + url.search;
      if (match(path)) return new Response(JSON.stringify({ code: "INTERNAL", message: "x" }), { status: 500 });
      return new Response(JSON.stringify(await mockGet(path)), { status: 200 });
    }),
  );
}

describe("평소 화재 집중 시기 (5장)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("나라의 risk_months·risk_share와 /baseline의 정점·기간", async () => {
    renderRoute("/dashboard/KOR?month=2026-07");
    const c = await card("평소 화재 집중 시기");
    const detail = (await mockGet("/KOR/regions/KOR")) as RegionDetail;
    const base = (await mockGet("/KOR/baseline/KOR")) as BaselineResponse;
    expect(detail.risk_months).toEqual([3, 4]);
    const peak = [3, 4].reduce((a, b) => ((base.by_month[b - 1]?.median ?? 0) > (base.by_month[a - 1]?.median ?? 0) ? b : a));
    expect(await within(c).findByText("3–4월")).toBeTruthy();
    expect(within(c).getByText(`평소 감지가 집중되는 두 달 · ${peak}월이 정점`)).toBeTruthy();
    expect(within(c).getByText(`평소 연간 활동의 56%가 모이는 달 · ${base.period[0]}–${base.period[1]}`)).toBeTruthy();
  });

  it("/baseline이 실패하면 달은 그리고 정점·기간 대신 안내와 다시 시도", async () => {
    failing((p) => p.startsWith("/KOR/baseline"));
    renderRoute("/dashboard/KOR?month=2026-07");
    const c = await card("평소 화재 집중 시기");
    expect(await within(c).findByText("정점과 비교 기간을 불러오지 못했습니다.", {}, { timeout: 4000 })).toBeTruthy();
    expect(within(c).getByText("3–4월")).toBeTruthy();
    expect(within(c).getByText("평소 감지가 집중되는 두 달")).toBeTruthy();
    expect(within(c).getByRole("button", { name: "다시 시도" })).toBeTruthy();
  });

  it("/regions/{나라}가 실패하면 카드 안에 에러", async () => {
    failing((p) => p === "/KOR/regions/KOR");
    renderRoute("/dashboard/KOR?month=2026-07");
    const c = await card("평소 화재 집중 시기");
    expect(await within(c).findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", {}, { timeout: 4000 })).toBeTruthy();
  });

  it("시·도·시·군·구 화면에는 없다", async () => {
    renderRoute(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "평소 화재 집중 시기" })).toBeNull();
    expect(screen.queryByRole("heading", { name: /월별 활동/ })).toBeNull();
  });
});

describe("집중 시기 문장의 경우들", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function withDetail(patch: Partial<RegionDetail>) {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        const body = await mockGet(path);
        return new Response(JSON.stringify(path === "/KOR/regions/KOR" ? { ...(body as object), ...patch } : body), { status: 200 });
      }),
    );
  }

  it("risk_share가 null이면 비중 구절을 뺀다", async () => {
    withDetail({ risk_share: null });
    renderRoute("/dashboard/KOR?month=2026-07");
    const c = await card("평소 화재 집중 시기");
    expect(await within(c).findByText(/^평소 연간 활동이 집중되는 달 · \d{4}–\d{4}$/)).toBeTruthy();
  });

  it("해를 넘기는 시기와 여러 묶음", async () => {
    withDetail({ risk_months: [1, 2, 12, 7] });
    renderRoute("/dashboard/KOR?month=2026-07");
    const c = await card("평소 화재 집중 시기");
    expect(await within(c).findByText("7월, 12–2월")).toBeTruthy();
    expect(within(c).getByText(/평소 감지가 집중되는 네 달/)).toBeTruthy();
  });

  it("위험 달이 없으면 빈 문구", async () => {
    withDetail({ risk_months: [], risk_share: null });
    renderRoute("/dashboard/KOR?month=2026-07");
    const c = await card("평소 화재 집중 시기");
    expect(await within(c).findByText("집중 시기를 정할 만큼 기록이 없습니다.")).toBeTruthy();
  });
});

describe("월별 선 그래프 옵션 (가짜 ECharts)", () => {
  type Opt = {
    xAxis: { data: { value: string; textStyle: { color: string } }[] };
    tooltip: { formatter: (p: unknown) => string };
    series: {
      data: (number | null | { value: number | null; symbolSize: number; itemStyle: { borderType: string } })[];
      label?: { formatter: (p: { value?: unknown }) => string };
    }[];
  };
  beforeEach(async () => {
    const { fakeCharts } = await import("../../test/fakeEcharts");
    fakeCharts.length = 0;
  });
  afterEach(() => {
    document.documentElement.style.removeProperty("--color-ink");
    document.documentElement.style.removeProperty("--color-muted");
  });
  const lastOption = async (): Promise<Opt> => {
    const { fakeCharts } = await import("../../test/fakeEcharts");
    return waitFor(() => {
      const opt = fakeCharts.filter((c) => !c.disposed).at(-1)?.lastOption;
      if (opt === undefined) throw new Error("아직");
      return opt as Opt;
    });
  };

  it("점은 고른 달(크게)·최고값·집계 중인 달에만, 값 글자는 고른 달·최고값만, 띠는 low 위에 high − low, 집계 중인 달은 점선 테두리", async () => {
    renderRoute("/dashboard/KOR?month=2026-07");
    await card("2026년 월별 활동");
    const opt = await lastOption();
    const values = opt.series[3]?.data ?? [];
    const item = (i: number) => {
      const d = values[i];
      return typeof d === "object" && d !== null ? d : null;
    };
    expect(item(6)).toMatchObject({ symbol: "circle", symbolSize: 10, label: { show: true }, itemStyle: { borderType: "solid" } });
    expect(item(6)?.itemStyle).toHaveProperty("borderColor");
    expect(values.filter((d) => typeof d === "object" && d !== null && d.symbolSize === 10)).toHaveLength(1);
    // 그 밖의 달은 최고값·집계 중이 아니면 점·값 없음(테마 다듬기, 2026-11-15 사용자)
    const numbers = values.map((d) => (typeof d === "object" && d !== null && typeof d.value === "number" ? d.value : null));
    const peak = Math.max(...numbers.filter((v): v is number => v !== null));
    numbers.forEach((v, i) => {
      if (i === 6 || i === 10 || v === null) return;
      // 최고값 달은 점과 값 글자, 나머지는 둘 다 없음
      if (v === peak) expect(item(i)).toMatchObject({ symbol: "circle", label: { show: true } });
      else expect(item(i)).toMatchObject({ symbol: "none", label: { show: false } });
    });
    // 집계 중인 달(11월)은 점(점선 테두리)만 있고, 최고값이 아니면 값 글자는 없다
    expect(item(10)).toMatchObject({ symbol: "circle", label: { show: numbers[10] === peak } });
    const base = (await mockGet("/KOR/baseline/KOR")) as BaselineResponse;
    const m0 = base.by_month[0];
    const low = Math.max(0, m0?.band_low ?? 0);
    expect(opt.series[0]?.data[0]).toBe(low);
    expect(opt.series[1]?.data[0]).toBeCloseTo((m0?.band_high ?? 0) - low);
    // 목 2026-11은 집계 중
    const nov = values[10];
    expect(typeof nov === "object" && nov !== null ? nov.itemStyle.borderType : "").toBe("dashed");
  });

  it("고른 달이 집계 중이면 파란 고리이면서 점선 테두리(2026-11)", async () => {
    renderRoute("/dashboard/KOR?month=2026-11");
    await card("2026년 월별 활동");
    const opt = await lastOption();
    const nov = opt.series[3]?.data[10];
    expect(typeof nov === "object" && nov !== null ? nov : null).toMatchObject({ symbolSize: 10, itemStyle: { borderType: "dashed" } });
  });

  it("점 위 값은 툴팁과 같은 형식, 집계 전 달의 축 글자는 흐린 회색, 툴팁 문구", async () => {
    // jsdom에는 스타일시트 토큰이 없어 쓰는 두 색만 넣는다
    document.documentElement.style.setProperty("--color-ink", "#202022");
    document.documentElement.style.setProperty("--color-muted", "#66666e");
    renderRoute("/dashboard/KOR?month=2026-07");
    await card("2026년 월별 활동");
    const opt = await lastOption();
    expect(opt.series[3]?.label?.formatter({ value: 1234.56 })).toBe("1,234.6");
    expect(opt.series[3]?.label?.formatter({ value: null })).toBe("");
    // 축 글자 색은 달 항목마다(글자를 건너뛰어 그려도 짝이 맞게)
    // 집계 전 달은 흐린 글자를 더 옅게
    expect(opt.xAxis.data[11]).toEqual({ value: "12월", textStyle: { color: "rgba(102, 102, 110, 0.6)" } });
    expect(opt.xAxis.data[0]?.textStyle.color).toBe("#66666e");
    const html = opt.tooltip.formatter([{ dataIndex: 2 }]);
    expect(html).toContain("2026년 3월");
    expect(html).toContain("평소 중앙값");
    expect(html).toContain("화재 감지일");
    expect(opt.tooltip.formatter([{ dataIndex: 11 }])).toContain("아직 집계 전");
  });

  it("내리면 차트를 정리한다", async () => {
    const { unmount } = renderRoute("/dashboard/KOR?month=2026-07");
    await card("2026년 월별 활동");
    const { fakeCharts } = await import("../../test/fakeEcharts");
    const chart = fakeCharts.at(-1);
    unmount();
    expect(chart?.disposed).toBe(true);
  });
});

describe("월별 선 그래프 (5장)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("주소의 달의 해, 12달 표(화면 읽기용), 자료 마지막 달 뒤는 집계 전", async () => {
    const series = (await mockGet("/KOR/series/KOR")) as { months: { month: string; value: number | null }[] };
    const last = series.months.at(-1)?.month ?? "";
    renderRoute(`/dashboard/KOR?month=${last}`);
    const year = Number(last.slice(0, 4));
    const c = await card(`${year}년 월별 활동`);
    const rows = within(c).getAllByRole("row");
    expect(rows).toHaveLength(13);
    const lastM = Number(last.slice(5, 7));
    if (lastM < 12) {
      expect(within(c).getByText(lastM === 11 ? "12월: 아직 집계 전" : `${lastM + 1}–12월: 아직 집계 전`)).toBeTruthy();
      expect(rows[12]?.textContent).toContain("아직 집계 전");
    }
    expect(within(c).getByText("보통 해 범위 · 2001–2025")).toBeTruthy();
    // 띠는 보통 해 범위(가운데 50%가 아니다)
    expect(c.textContent).not.toContain("가운데 50%");
  });

  it("2010년 달은 환산값 포함 범례, 집계 전 없음", async () => {
    renderRoute("/dashboard/KOR?month=2010-03");
    const c = await card("2010년 월별 활동");
    expect(within(c).getByText("2010 · 센서 환산값 포함")).toBeTruthy();
    expect(within(c).queryByText(/아직 집계 전/)).toBeNull();
  });

  it("/baseline이 실패하면 카드 안에 에러와 다시 시도", async () => {
    failing((p) => p.startsWith("/KOR/baseline"));
    renderRoute("/dashboard/KOR?month=2026-07");
    const c = await card("2026년 월별 활동");
    expect(await within(c).findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", {}, { timeout: 4000 })).toBeTruthy();
  });

  it("영문 화면", async () => {
    renderRoute("/en/dashboard/KOR?month=2026-07");
    expect(await screen.findByRole("heading", { name: "Monthly activity in 2026" })).toBeTruthy();
    expect(await screen.findByText("Mar–Apr")).toBeTruthy();
  });
});
