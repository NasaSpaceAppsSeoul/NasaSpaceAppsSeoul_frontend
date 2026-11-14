import { describe, expect, it } from "vitest";
import { localeFromPath, localizePath, stripLocale, switchLocalePath } from "./locale";

describe("localeFromPath", () => {
  it("접두사가 없으면 한글이다", () => {
    expect(localeFromPath("/")).toBe("ko");
    expect(localeFromPath("/dashboard/KOR")).toBe("ko");
  });

  it("/en으로 시작하면 영어다", () => {
    expect(localeFromPath("/en")).toBe("en");
    expect(localeFromPath("/en/dashboard/KOR")).toBe("en");
  });

  it("en으로 시작하는 다른 경로는 영어로 보지 않는다", () => {
    expect(localeFromPath("/england")).toBe("ko");
  });
});

describe("stripLocale", () => {
  it("언어 접두사를 떼고 /로 시작하는 경로를 준다", () => {
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/en/insight/KOR/abc")).toBe("/insight/KOR/abc");
    expect(stripLocale("/dashboard/KOR")).toBe("/dashboard/KOR");
  });
});

describe("localizePath", () => {
  it("한글은 그대로 둔다", () => {
    expect(localizePath("/", "ko")).toBe("/");
    expect(localizePath("/dashboard/KOR", "ko")).toBe("/dashboard/KOR");
  });

  it("영어는 /en을 붙이고 끝에 /를 남기지 않는다", () => {
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/dashboard/KOR", "en")).toBe("/en/dashboard/KOR");
  });

  it("/ 없이 시작하는 경로도 받는다", () => {
    expect(localizePath("dashboard/KOR", "en")).toBe("/en/dashboard/KOR");
  });
});

describe("switchLocalePath", () => {
  it("같은 화면의 다른 언어 주소를 준다", () => {
    expect(switchLocalePath("/dashboard/KOR", "en")).toBe("/en/dashboard/KOR");
    expect(switchLocalePath("/en/dashboard/KOR", "ko")).toBe("/dashboard/KOR");
    expect(switchLocalePath("/en", "ko")).toBe("/");
    expect(switchLocalePath("/en/dashboard/KOR", "en")).toBe("/en/dashboard/KOR");
  });
});
