import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { localeFromPath } from "../lib/locale";
import { routes } from "./routes";

afterEach(cleanup);

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

function heading() {
  return screen.findByRole("heading", { level: 1 });
}

describe("routes", () => {
  it("/는 한글 소개 화면이다", async () => {
    renderAt("/");
    expect((await heading()).textContent).toBe("소개");
  });

  it("/en은 영어 소개 화면이다", async () => {
    renderAt("/en");
    expect((await heading()).textContent).toBe("About");
  });

  it("대문자 /EN은 라우터도 lib/locale도 영어로 보지 않는다", async () => {
    renderAt("/EN");
    expect((await heading()).textContent).toBe("페이지를 찾을 수 없습니다");
    expect(localeFromPath("/EN")).toBe("ko");
    expect(localeFromPath("/En/dashboard/KOR")).toBe("ko");
  });

  it("나라 없이 대시보드로 오면 한국으로 보낸다", async () => {
    const ko = renderAt("/dashboard");
    expect((await heading()).textContent).toBe("대시보드");
    expect(ko.state.location.pathname).toBe("/dashboard/KOR");
    cleanup();

    const en = renderAt("/en/dashboard");
    expect((await heading()).textContent).toBe("Dashboard");
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
    const router = renderAt(`/dashboard/KOR/${encodeURIComponent("경북")}`);
    expect((await heading()).textContent).toBe("대시보드");
    expect(router.state.matches.at(-1)?.params.regionId).toBe("경북");
  });

  it("월간 인사이트 주소를 받는다", async () => {
    renderAt("/insight/KOR/abc?month=2025-03");
    expect((await heading()).textContent).toBe("월간 인사이트");
    cleanup();

    renderAt("/en/insight/KOR/abc?month=2025-03");
    expect((await heading()).textContent).toBe("Monthly insight");
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
