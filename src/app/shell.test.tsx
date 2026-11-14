import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient, renderRoute } from "../test/render";
import { localeRoutes } from "./routes";

function Boom(): never {
  throw new Error("boom in page");
}

function renderWith(children: RouteObject[], path: string) {
  const router = createMemoryRouter(localeRoutes(children), { initialEntries: [path] });
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("라우트 오류 화면", () => {
  it("화면이 예외를 던지면 머리글·푸터와 언어를 유지한 채 안내와 원인을 보여 준다", async () => {
    // React가 잡은 렌더 예외를 콘솔에 찍는 것은 이 테스트의 의도된 결과다
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWith([{ path: "boom", element: <Boom /> }], "/en/boom");

    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe(
      "Something went wrong while drawing this page",
    );
    expect(screen.getByText("boom in page")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Main menu" })).toBeTruthy();
    expect(screen.getByText("Burnline · NASA Space Apps Challenge 2026")).toBeTruthy();
    consoleError.mockRestore();
  });
});

describe("서버를 흉내 낸 앱 틀 (live)", () => {
  const fetchMock = vi.fn<typeof fetch>();

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

  it("/meta가 5xx로 두 번 실패하면 요청은 정확히 2번이고, 푸터의 출처 줄만 빠진 채 화면은 그대로다", async () => {
    fetchMock.mockImplementation(async () => new Response("error code: 1033", { status: 530 }));
    renderRoute("/");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("소개");
    expect(screen.getByText("Burnline · NASA Space Apps Challenge 2026")).toBeTruthy();
    expect(screen.queryByText(/^출처:/)).toBeNull();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("/meta의 generated_at이 null이어도 화면이 깨지지 않고 처리일 줄만 빠진다", async () => {
    const { korMeta } = await import("../api/mock/kor");
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ ...korMeta, generated_at: null }), { status: 200 }),
    );
    renderRoute("/");
    expect(await screen.findByText(/^출처:/)).toBeTruthy();
    expect(screen.queryByText(/^데이터 처리일/)).toBeNull();
  });
});
