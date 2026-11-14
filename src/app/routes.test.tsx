import { cleanup, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { localeFromPath } from "../lib/locale";
import { renderRoute } from "../test/render";

function renderAt(path: string) {
  return renderRoute(path).router;
}

function heading() {
  return screen.findByRole("heading", { level: 1 });
}

describe("routes", () => {
  it("/는 한글 소개 화면이다", async () => {
    renderAt("/");
    expect((await heading()).textContent).toBe("더 길게 보는\n화재 기록.");
  });

  it("/en은 영어 소개 화면이다", async () => {
    renderAt("/en");
    expect((await heading()).textContent).toBe("A longer view\nof fire.");
  });

  it("대문자 /EN은 라우터도 lib/locale도 영어로 보지 않는다", async () => {
    renderAt("/EN");
    expect((await heading()).textContent).toBe("페이지를 찾을 수 없습니다");
    expect(localeFromPath("/EN")).toBe("ko");
    expect(localeFromPath("/En/dashboard/KOR")).toBe("ko");
  });

  it("나라 없이 대시보드로 오면 한국으로 보낸다", async () => {
    // 주소에 달이 없으면 목 자료의 마지막 달(2026-11)을 주소에 써 넣는다(7-2)
    const ko = renderAt("/dashboard");
    expect((await heading()).textContent).toBe("2026년 11월은 평소와 비교해 어땠을까요?");
    expect(ko.state.location.pathname).toBe("/dashboard/KOR");
    expect(ko.state.location.search).toBe("?month=2026-11");
    cleanup();

    const en = renderAt("/en/dashboard");
    expect((await heading()).textContent).toBe("How did November 2026 compare with usual?");
    expect(en.state.location.pathname).toBe("/en/dashboard/KOR");
  });

  it("한국으로 보낼 때 쿼리와 해시를 잃지 않는다", async () => {
    const router = renderAt("/en/dashboard?month=2025-03#calendar");
    await heading();
    expect(router.state.location.pathname).toBe("/en/dashboard/KOR");
    expect(router.state.location.search).toBe("?month=2025-03");
    expect(router.state.location.hash).toBe("#calendar");
  });

  it("한글 지역 ID가 붙은 대시보드 주소를 받는다", async () => {
    const router = renderAt(`/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    expect((await heading()).textContent).toBe("경북 · 2025년 3월");
    expect(router.state.matches.at(-1)?.params.regionId).toBe("경북");
  });

  it("월간 인사이트 주소를 받는다", async () => {
    const uiseong = "91817680B75376031789242";
    renderAt(`/insight/KOR/${uiseong}?month=2025-03`);
    expect((await heading()).textContent).toBe("의성군 · 2025년 3월 화재 인사이트");
    cleanup();

    renderAt(`/en/insight/KOR/${uiseong}?month=2025-03`);
    expect((await heading()).textContent).toBe("Uiseong-gun · March 2025 fire insight");
  });

  it("지역 없는 월간 인사이트 주소는 안내 화면으로 간다", async () => {
    renderAt("/insight/KOR");
    expect((await heading()).textContent).toBe("페이지를 찾을 수 없습니다");
  });

  it("없는 주소는 그 언어의 안내 화면과 그 언어의 처음 링크를 보여 준다", async () => {
    renderAt("/nope");
    expect((await heading()).textContent).toBe("페이지를 찾을 수 없습니다");
    expect(screen.getByRole("link", { name: "처음으로" }).getAttribute("href")).toBe("/");
    cleanup();

    renderAt("/en/nope");
    expect((await heading()).textContent).toBe("Page not found");
    expect(screen.getByRole("link", { name: "Back to start" }).getAttribute("href")).toBe("/en");
  });
});

describe("주소 값 검사 (decisions 1-5)", () => {
  it.each([
    ["소문자 나라 코드", "/dashboard/kor"],
    ["없는 나라 코드", "/dashboard/JPN"],
    ["형식이 틀린 달", "/dashboard/KOR?month=2025-3"],
    ["13월", "/dashboard/KOR?month=2025-13"],
    ["빈 달", "/dashboard/KOR?month="],
    ["인사이트의 없는 나라 코드", "/insight/USA/abc?month=2025-03"],
    ["인사이트의 형식이 틀린 달", "/en/insight/KOR/abc?month=202503"],
  ])("%s는 없는 주소 안내를 보여 준다", async (_name, path) => {
    renderAt(path);
    const title = path.startsWith("/en") ? "Page not found" : "페이지를 찾을 수 없습니다";
    expect((await heading()).textContent).toBe(title);
  });

  it("맞는 나라와 달은 화면을 그린다", async () => {
    renderAt("/dashboard/CAL?month=2025-03");
    expect((await heading()).textContent).toBe("2025년 3월은 평소와 비교해 어땠을까요?");
  });
});

describe("머리글", () => {
  it("언어 전환 링크는 같은 화면의 다른 언어 주소이고 달과 해시를 들고 간다", async () => {
    renderAt("/dashboard/KOR?month=2025-03#calendar");
    await heading();
    const language = screen.getByRole("group", { name: "언어" });
    expect(within(language).getByRole("link", { name: "EN" }).getAttribute("href")).toBe(
      "/en/dashboard/KOR?month=2025-03#calendar",
    );
    expect(within(language).getByRole("link", { name: "KR" }).getAttribute("aria-current")).toBe("true");
  });

  it("한글 지역 ID 주소를 두 번 인코딩하지 않는다", async () => {
    const encoded = encodeURIComponent("경북");
    renderAt(`/en/dashboard/KOR/${encoded}?month=2025-03`);
    await heading();
    const link = screen.getByRole("link", { name: "KR" });
    expect(link.getAttribute("href")).toBe(`/dashboard/KOR/${encoded}?month=2025-03`);
  });

  it("메뉴는 지금 화면을 표시한다. 월간 인사이트는 대시보드로 본다", async () => {
    renderAt("/en/insight/KOR/abc?month=2025-03");
    await heading();
    const nav = screen.getByRole("navigation", { name: "Main menu" });
    expect(within(nav).getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "About" }).getAttribute("aria-current")).toBeNull();
    cleanup();

    renderAt("/");
    await heading();
    const koNav = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(within(koNav).getByRole("link", { name: "소개" }).getAttribute("aria-current")).toBe("page");
  });
});

describe("목 모드 표시 줄과 푸터", () => {
  it("목 모드에서 표시 줄을 띄우고, 푸터에 /meta의 출처와 처리일을 넣는다", async () => {
    renderAt("/dashboard/CAL");
    await heading();
    expect(screen.getByRole("note").textContent).toBe("목 데이터로 표시 중");
    expect(await screen.findByText("출처: NASA FIRMS · geoBoundaries USA (미국 인구조사국, 퍼블릭 도메인) · CAL FIRE")).toBeTruthy();
    expect(screen.getByText("데이터 처리일 2026-11-11")).toBeTruthy();
  });

  it("나라가 없는 소개 화면의 푸터는 한국 /meta를 쓴다", async () => {
    renderAt("/en");
    await heading();
    expect(await screen.findByText("Sources: NASA FIRMS · geoBoundaries (CC BY 3.0) · 산림청")).toBeTruthy();
  });
});
