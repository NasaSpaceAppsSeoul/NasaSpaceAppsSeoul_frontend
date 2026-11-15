import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGet } from "../../api/mock";
import type { RegionDetail, TopResponse } from "../../api/types";
import { renderRoute } from "../../test/render";

/*
 * 숫자 카드 아래 목록 (5장, `decisions.md` 6절): 시·도 "평소보다 두드러진 곳" 3곳, 시·군·구 인접 지역 목록.
 */
const UISEONG = "91817680B75376031789242";
const GYEONGBUK = encodeURIComponent("경북");

async function listCard(name: RegExp | string): Promise<HTMLElement> {
  const heading = await screen.findByRole("heading", { name });
  const card = heading.closest("section");
  if (card === null) throw new Error("카드 없음");
  return card;
}

describe("목록 (5장)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("시·도: 서버 순서 그대로 3곳, 번호는 목록 순번, 같은 시·도라 이름만", async () => {
    renderRoute(`/dashboard/KOR/${GYEONGBUK}?month=2025-03`);
    const card = await listCard("평소보다 두드러진 곳");
    const top = (await mockGet(`/KOR/top?month=2025-03&parent=${GYEONGBUK}`)) as TopResponse;
    const items = await within(card).findAllByRole("listitem");
    expect(items).toHaveLength(top.items.length);
    expect(within(card).getByRole("list").tagName).toBe("OL");
    // 줄: 순번 · 이름 · 달 한 줄 · 값(단위는 화면 낭독기용). 머리 오른쪽에 지역 수와 달·단위(참고 소스 모양)
    expect(items[0]?.textContent).toMatch(/^1의성군2025년 3월384 화재 감지일$/);
    expect(within(card).getByText(`${top.items.length}개 지역`)).toBeTruthy();
    expect(within(card).getByText("2025년 3월 · 화재 감지일")).toBeTruthy();
    // 서버 이름("경북 의성군")에서 같은 시·도는 떼어 낸다
    expect(card.textContent).not.toContain("경북 의성군");
  });

  it("줄은 그 지역 대시보드 링크(달 유지)", async () => {
    const { router } = renderRoute(`/dashboard/KOR/${GYEONGBUK}?month=2025-03`);
    const card = await listCard("평소보다 두드러진 곳");
    const link = await within(card).findByRole("link", { name: /의성군/ });
    expect(link.getAttribute("href")).toBe(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    fireEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${UISEONG}`));
    expect(router.state.location.search).toBe("?month=2025-03");
  });

  it("시·군·구: 맞닿은 지역 전부, 값 큰 순(같으면 이름순), 0도 보이고 순번이 붙는다", async () => {
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    const card = await listCard("인접 지역의 3월 기록");
    const detail = (await mockGet(`/KOR/regions/${UISEONG}`)) as RegionDetail;
    // 6곳부터는 처음 5곳만, "N개 지역 모두 보기"로 펼친다(참고 소스와 같음)
    expect(detail.neighbors.length).toBeGreaterThan(5);
    expect(await within(card).findAllByRole("listitem")).toHaveLength(5);
    const more = within(card).getByRole("button", { name: `${detail.neighbors.length}개 지역 모두 보기` });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    const items = within(card).getAllByRole("listitem");
    expect(items).toHaveLength(detail.neighbors.length);
    expect(within(card).getByRole("button", { name: "상위 5개만 보기" }).getAttribute("aria-expanded")).toBe("true");
    expect(within(card).getByRole("list").tagName).toBe("OL");
    // 한 줄: 순번 · 이름 · 값("1안동시220 화재 감지일")
    const nameOf = (li: HTMLElement) => li.querySelector("a")?.textContent ?? "";
    const valueOf = (li: HTMLElement) => Number((li.textContent ?? "").match(/([\d,.]+) 화재 감지일$/)?.[1]?.replaceAll(",", ""));
    const values = items.map(valueOf);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(values).toContain(0);
    expect(items[0]?.textContent).toMatch(/^1안동시220 화재 감지일$/);
    // 값이 같으면 이름순
    const zeros = items.filter((li) => valueOf(li) === 0).map(nameOf);
    expect(zeros).toEqual([...zeros].sort((a, b) => a.localeCompare(b, "ko")));
  });

  it("시·군·구 2012년 2월 전 달도 시·군·구 값이 없다는 안내", async () => {
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2010-03`);
    const card = await listCard("인접 지역의 3월 기록");
    expect(await within(card).findByText("2012년 2월 이전은 시·군·구 값이 없습니다.")).toBeTruthy();
  });

  it("캘리포니아 카운티: 이름만(시·도 없음)", async () => {
    renderRoute("/dashboard/CAL/52423323B10000000000002?month=2025-08");
    const card = await listCard("인접 지역의 8월 기록");
    const items = await within(card).findAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((li) => /^[A-Za-z ]+$/.test(li.querySelector("a")?.textContent ?? ""))).toBe(true);
  });

  it("다른 시·도와 맞닿은 이웃은 시·도를 붙인다", async () => {
    const regions = (await mockGet("/KOR/regions")) as { items: { id: string; label_ko: string }[] };
    const gunwi = regions.items.find((r) => r.label_ko === "군위군");
    const detail = (await mockGet(`/KOR/regions/${gunwi?.id ?? ""}`)) as RegionDetail;
    const other = detail.neighbors.find((n) => n.province !== undefined);
    if (gunwi === undefined || other === undefined) throw new Error("목에 다른 시·도 이웃이 없음");
    renderRoute(`/dashboard/KOR/${gunwi.id}?month=2025-03`);
    const card = await listCard(/인접 지역의 3월 기록/);
    await waitFor(() => expect(card.textContent).toContain(`${other.province ?? ""} ${other.label_ko}`));
  });

  it("2012년 2월 전 달은 시·군·구 값이 없다는 안내", async () => {
    renderRoute(`/dashboard/KOR/${GYEONGBUK}?month=2010-03`);
    const card = await listCard("평소보다 두드러진 곳");
    expect(await within(card).findByText("2012년 2월 이전은 시·군·구 값이 없습니다.")).toBeTruthy();
  });

  it("/top이 실패하면 카드 안에 에러와 다시 시도", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", "https://api.test/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = new URL(String(input));
        const path = url.pathname.replace("/api/v1", "") + url.search;
        if (path.startsWith("/KOR/top")) return new Response(JSON.stringify({ code: "INTERNAL", message: "x" }), { status: 500 });
        return new Response(JSON.stringify(await mockGet(path)), { status: 200 });
      }),
    );
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    const card = await listCard("인접 지역의 3월 기록");
    expect(await within(card).findByText("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", {}, { timeout: 4000 })).toBeTruthy();
    expect(within(card).getByRole("button", { name: "다시 시도" })).toBeTruthy();
  });

  it("자료 마지막 달(/top은 범위 밖)은 에러 대신 감지 지점 자료가 없다는 안내", async () => {
    const series = (await mockGet("/KOR/series/KOR")) as { months: { month: string }[] };
    const last = series.months.at(-1)?.month ?? "";
    renderRoute(`/dashboard/KOR/${GYEONGBUK}?month=${last}`);
    const card = await listCard("평소보다 두드러진 곳");
    expect(await within(card).findByText("이 달은 감지 지점 자료가 없습니다.")).toBeTruthy();
    expect(within(card).queryByRole("button")).toBeNull();
  });

  it("영문 화면의 줄 링크는 /en 주소", async () => {
    renderRoute(`/en/dashboard/KOR/${GYEONGBUK}?month=2025-03`);
    const card = await listCard("Standing out from usual");
    const link = await within(card).findByRole("link", { name: /Uiseong/ });
    expect(link.getAttribute("href")).toBe(`/en/dashboard/KOR/${UISEONG}?month=2025-03`);
  });

  it("나라 화면에는 목록이 없다(디자인)", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "평소보다 두드러진 곳" })).toBeNull();
  });

  it("영문 화면", async () => {
    renderRoute(`/en/dashboard/KOR/${UISEONG}?month=2025-03`);
    expect(await screen.findByRole("heading", { name: "Neighboring areas in March" })).toBeTruthy();
  });
});
