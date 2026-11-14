import { createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { applyDocumentTheme, followDocumentTheme } from "./documentTheme";
import { routes } from "./routes";

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("applyDocumentTheme", () => {
  it("첫 화면은 어둡게, 대시보드는 속성을 지운다", () => {
    applyDocumentTheme("/en");
    expect(document.documentElement.dataset.theme).toBe("dark");

    applyDocumentTheme("/dashboard/KOR");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});

describe("followDocumentTheme", () => {
  it("처음 주소의 테마를 넣고, 이동할 때마다 다시 맞춘다", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    followDocumentTheme(router);
    expect(document.documentElement.dataset.theme).toBe("dark");

    await router.navigate("/en/dashboard/KOR");
    expect(document.documentElement.dataset.theme).toBeUndefined();

    await router.navigate("/en");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
