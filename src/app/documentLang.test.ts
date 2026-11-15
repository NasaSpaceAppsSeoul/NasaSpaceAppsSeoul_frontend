import { createMemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { applyDocumentLang, followDocumentLang } from "./documentLang";
import { routes } from "./routes";

describe("applyDocumentLang", () => {
  it("주소의 언어를 문서 언어로 넣는다", () => {
    applyDocumentLang("/en/dashboard/KOR");
    expect(document.documentElement.lang).toBe("en");

    applyDocumentLang("/dashboard/KOR");
    expect(document.documentElement.lang).toBe("ko");
  });
});

describe("followDocumentLang", () => {
  it("처음 주소의 언어를 넣고, 이동할 때마다 다시 맞춘다", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/en/dashboard/KOR"] });
    followDocumentLang(router);
    expect(document.documentElement.lang).toBe("en");

    await router.navigate("/dashboard/KOR");
    expect(document.documentElement.lang).toBe("ko");

    await router.navigate("/en");
    expect(document.documentElement.lang).toBe("en");
  });
});
