import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../../test/render";

const UISEONG = "91817680B75376031789242";
const GOSEONG = "91817680B50485812736392"; // 강원 고성군
const GUNPO = "91817680B51138241033746"; // 감지 기록 없는 지역
const GB = encodeURIComponent("경북");

async function card() {
  return within(await screen.findByRole("region", { name: /한 달의 화재 감지일|Fire grid-days in/ }));
}

describe("숫자 카드 (목: 백엔드 기대값)", () => {
  it("전국 2025-03: 일반 분기, 칩·배수·순위, 누적 카드", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const c = await card();
    expect(c.getByText("1,093")).toBeTruthy();
    expect(c.getByText("매우 이례적")).toBeTruthy();
    expect(c.getByText("평소 3월 중앙값 174의 6.28배입니다.")).toBeTruthy();
    expect(c.getByText("같은 달 2001–2025년 25개 해 중 1위입니다.")).toBeTruthy();
    expect(c.getByText(/범위 95.6–294.8/)).toBeTruthy();
    expect(c.queryByText("센서 환산값")).toBeNull();
    expect(await screen.findByText("1,157 화재 감지일")).toBeTruthy();
  });

  it("의성 2025-03: 드문 지역, 경북 기준 줄, 감지 날짜 수 자리, 누적 줄", async () => {
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2025-03`);
    const c = await card();
    expect(c.getByText("384")).toBeTruthy();
    expect(c.getByText("평소 불이 드문 지역")).toBeTruthy();
    expect(c.getByText("경북 기준 · 매우 이례적 · 25개 해 중 1위")).toBeTruthy();
    expect(c.getByText(/불이 감지된 날짜 수 · 준비 중/)).toBeTruthy();
    expect(c.getByText(/1–3월 누적/)).toBeTruthy();
    expect(c.queryByText(/중앙값/)).toBeNull();
  });

  it("의성 2010-05: 값 없음과 2012년 2월 전 문구. 없는 값에는 센서 환산 배지를 붙이지 않는다", async () => {
    renderRoute(`/dashboard/KOR/${UISEONG}?month=2010-05`);
    const c = await card();
    expect(c.getByText("—")).toBeTruthy();
    expect(c.getByText("2012년 2월 이전은 이 단위의 값이 없습니다.")).toBeTruthy();
    expect(c.queryByText("센서 환산값")).toBeNull();
  });

  it("전국 2010-05: 값이 있는 2012년 전 달은 센서 환산 배지", async () => {
    renderRoute("/dashboard/KOR?month=2010-05");
    const c = await card();
    expect(c.getByText("센서 환산값")).toBeTruthy();
  });

  it("고성 2012-02: 0칸 → 이번 달 감지 없음, 칩 없음", async () => {
    renderRoute(`/dashboard/KOR/${GOSEONG}?month=2012-02`);
    const c = await card();
    expect(c.getByText("이번 달 감지 없음")).toBeTruthy();
    expect(c.queryByText("평소 범위")).toBeNull();
  });

  it("고성 2025-02: 평년 0인 달 → 평년에는 거의 없던 달, 칩 없음", async () => {
    renderRoute(`/dashboard/KOR/${GOSEONG}?month=2025-02`);
    const c = await card();
    expect(c.getByText("평년에는 거의 없던 달입니다.")).toBeTruthy();
    expect(c.queryByText("매우 이례적")).toBeNull();
  });

  it("군포 2025-04: 감지 기록 없는 지역은 값이 있어도 그 값과 성격 칩", async () => {
    renderRoute(`/dashboard/KOR/${GUNPO}?month=2025-04`);
    const c = await card();
    expect(c.getByText("1")).toBeTruthy();
    expect(c.getByText("감지 기록이 없는 지역")).toBeTruthy();
  });

  it("전국 2026-11: 집계 중 → 칩·순위 없음, 누적 카드도 평소 비교 없이 집계 중", async () => {
    renderRoute("/dashboard/KOR?month=2026-11");
    const c = await card();
    expect(c.getByText("집계 중")).toBeTruthy();
    expect(c.queryByText(/위입니다/)).toBeNull();
    const cumulative = within(await screen.findByRole("heading", { name: "2026년 1월부터 11월까지 누적" }).then((h) => h.closest("section") ?? document.body));
    expect(cumulative.getByText("집계 중")).toBeTruthy();
    expect(cumulative.queryByText(/평소 1–11월/)).toBeNull();
  });

  it("영어 화면은 영문 지역 이름", async () => {
    renderRoute(`/en/dashboard/KOR/${UISEONG}?month=2025-03`);
    const c = await card();
    expect(c.getByText(/North Gyeongsang Uiseong-gun · March 2025/)).toBeTruthy();
    expect(c.getByText("Fire is usually rare here")).toBeTruthy();
  });

  it("범위 밖 달은 구역 에러와 최신 달로 이동", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2030-01");
    fireEvent.click(await screen.findByRole("button", { name: "최신 달로 이동" }));
    await waitFor(() => expect(router.state.location.search).toBe("?month=2026-11"));
  });
});

describe("주소와 지역", () => {
  it("없는 지역은 안내와 지역 선택 열기(검색 대화상자)", async () => {
    const { router } = renderRoute("/dashboard/KOR/NOPE?month=2025-03");
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe("지역을 찾을 수 없습니다");
    fireEvent.click(screen.getByRole("button", { name: "지역 선택 열기" }));
    const dialog = await screen.findByRole("dialog", { name: "지역 검색" });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "경북" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "경북" }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${GB}`));
    expect(router.state.location.search).toBe("?month=2025-03");
  });

  it("범위 밖 달: 달 이동과 달 대화상자는 범위 안으로 맞춰 시작한다", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2030-01");
    fireEvent.click(await screen.findByRole("button", { name: "이전 달" }));
    await waitFor(() => expect(router.state.location.search).toBe("?month=2026-11"));
  });

  it("범위 밖 달에서 연 달 대화상자는 범위 안의 해에서 시작한다", async () => {
    renderRoute("/dashboard/KOR?month=2030-01");
    fireEvent.click(await screen.findByRole("button", { name: /^기준 월/ }));
    const dialog = await screen.findByRole("dialog", { name: "기준 월 선택" });
    expect(within(dialog).getByText("2026년")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "11월" }).hasAttribute("disabled")).toBe(false);
  });

  it("지역 자리에 나라 ID가 오면 나라 주소로", async () => {
    const { router } = renderRoute("/dashboard/KOR/KOR?month=2025-03");
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard/KOR"));
    expect(router.state.location.search).toBe("?month=2025-03");
  });
});

describe("선택 줄과 대화상자", () => {
  it("한국 나라 단계: 시·군·구 칸은 시·도를 먼저 고르라고 비활성", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    const district = await screen.findByRole("button", { name: /시·도를 먼저 선택하세요/ });
    expect(district.hasAttribute("disabled")).toBe(true);
  });

  it("캘리포니아는 시·도(주) 칸이 없고 카운티 칸이 바로 열린다", async () => {
    renderRoute("/dashboard/CAL?month=2025-03");
    const county = await screen.findByRole("button", { name: /전체 카운티/ });
    expect(county.hasAttribute("disabled")).toBe(false);
    expect(screen.queryByRole("button", { name: /전체 주/ })).toBeNull();
  });

  it("시·도를 고르면 그 시·도로 가고 달은 유지한다", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    fireEvent.click(await screen.findByRole("button", { name: /전체 시·도/ }));
    const dialog = await screen.findByRole("dialog", { name: "시·도 선택" });
    fireEvent.click(within(dialog).getByRole("button", { name: /^경북/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${GB}`));
    expect(router.state.location.search).toBe("?month=2025-03");
  });

  it("검색 대화상자에서 다른 나라를 고르면 달을 빼고 그 나라의 마지막 달로", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    fireEvent.click(await screen.findByRole("button", { name: /국가·시·도·시·군·구 검색/ }));
    const dialog = await screen.findByRole("dialog", { name: "지역 검색" });
    fireEvent.click(within(dialog).getByRole("button", { name: "캘리포니아" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard/CAL"));
    await waitFor(() => expect(router.state.location.search).toBe("?month=2026-11"));
  });

  it("나라 이름만 맞는 검색어는 결과 없음(나라는 맨 위 버튼으로 고른다)", async () => {
    renderRoute("/dashboard/KOR?month=2025-03");
    fireEvent.click(await screen.findByRole("button", { name: /국가·시·도·시·군·구 검색/ }));
    const dialog = await screen.findByRole("dialog", { name: "지역 검색" });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "대한민국" } });
    expect(within(dialog).getByText("맞는 지역이 없습니다.")).toBeTruthy();
    expect(within(dialog).getAllByRole("button", { name: "대한민국" })).toHaveLength(1);
  });

  it("검색어로 시·군·구를 찾아 간다", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2025-03");
    fireEvent.click(await screen.findByRole("button", { name: /국가·시·도·시·군·구 검색/ }));
    const dialog = await screen.findByRole("dialog", { name: "지역 검색" });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "의성" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /경북 의성군/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/dashboard/KOR/${UISEONG}`));
  });

  it("달 대화상자: 범위 밖 달은 비활성, 고르면 그 달로", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2026-03");
    fireEvent.click(await screen.findByRole("button", { name: /^기준 월/ }));
    const dialog = await screen.findByRole("dialog", { name: "기준 월 선택" });
    expect(within(dialog).getByRole("button", { name: "12월" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "5월" }));
    await waitFor(() => expect(router.state.location.search).toBe("?month=2026-05"));
  });

  it("달 이동: 마지막 달에서는 다음 달 버튼이 비활성", async () => {
    const { router } = renderRoute("/dashboard/KOR?month=2026-11");
    expect((await screen.findByRole("button", { name: "다음 달" })).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));
    await waitFor(() => expect(router.state.location.search).toBe("?month=2026-10"));
  });
});
