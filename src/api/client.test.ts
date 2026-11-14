import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retry } from "../app/queryClient";
import { ApiError, apiMode, get, isRetryable, withQuery } from "./client";

const BASE = "https://api.test/api/v1";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("실패해야 하는데 성공했다");
}

describe("withQuery", () => {
  it("값이 없는 키(undefined·null·빈 문자열)는 키째 뺀다", () => {
    expect(withQuery("/KOR/geo", { level: undefined, parent: null })).toBe("/KOR/geo");
    expect(withQuery("/KOR/geo", { level: "dist", parent: "" })).toBe("/KOR/geo?level=dist");
  });

  it("한글 시·도 ID를 인코딩한다", () => {
    expect(withQuery("/KOR/geo", { parent: "경북" })).toBe(`/KOR/geo?parent=${encodeURIComponent("경북")}`);
  });
});

describe("isRetryable와 QueryClient retry", () => {
  it("5xx·시간 초과·네트워크만 다시 시도한다", () => {
    expect(isRetryable(new ApiError(503, "UPSTREAM_UNAVAILABLE", ""))).toBe(true);
    expect(isRetryable(new ApiError(530, "UNKNOWN", ""))).toBe(true);
    expect(isRetryable(new ApiError(0, "TIMEOUT", ""))).toBe(true);
    expect(isRetryable(new ApiError(0, "NETWORK", ""))).toBe(true);
    expect(isRetryable(new ApiError(404, "REGION_NOT_FOUND", ""))).toBe(false);
    expect(isRetryable(new ApiError(400, "MONTH_OUT_OF_RANGE", ""))).toBe(false);
    expect(isRetryable(new ApiError(200, "BAD_BODY", ""))).toBe(false);
    expect(isRetryable(new TypeError("x"))).toBe(false);
  });

  it("다시 시도는 1번뿐이다", () => {
    const error = new ApiError(503, "UPSTREAM_UNAVAILABLE", "");
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(false);
    expect(retry(0, new ApiError(404, "REGION_NOT_FOUND", ""))).toBe(false);
  });
});

describe("apiMode", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("VITE_API_MODE를 따르고, 없으면 개발은 mock이다", () => {
    vi.stubEnv("VITE_API_MODE", "live");
    expect(apiMode()).toBe("live");
    vi.stubEnv("VITE_API_MODE", "mock");
    expect(apiMode()).toBe("mock");
    vi.stubEnv("VITE_API_MODE", undefined);
    vi.stubEnv("DEV", true);
    expect(apiMode()).toBe("mock");
    vi.stubEnv("DEV", false);
    expect(apiMode()).toBe("live");
  });
});

describe("get (live)", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_API_BASE", BASE);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("기본 주소에 경로를 붙이고 cache: no-cache로 보낸다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: 1 }));
    await expect(get("/KOR/meta")).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/KOR/meta`, expect.objectContaining({ cache: "no-cache" }));
  });

  it("요청별 cache를 넘긴다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await get("/KOR/meta", { cache: "reload" });
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: "reload" }));
  });

  it("서버 에러 본문의 code와 상태를 ApiError로 바꾼다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: "REGION_NOT_FOUND", message: "no such region" }, 404));
    const error = await caught(get("/KOR/regions/NOPE"));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "REGION_NOT_FOUND", message: "no such region" });
  });

  it("JSON이 아닌 실패 본문(터널 530)은 UNKNOWN", async () => {
    fetchMock.mockResolvedValue(new Response("error code: 1033", { status: 530, statusText: "" }));
    expect(await caught(get("/KOR/meta"))).toMatchObject({ status: 530, code: "UNKNOWN" });
  });

  it("성공인데 JSON이 아니면 BAD_BODY", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));
    expect(await caught(get("/KOR/meta"))).toMatchObject({ status: 200, code: "BAD_BODY" });
  });

  it("네트워크 실패는 NETWORK", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await caught(get("/KOR/meta"))).toMatchObject({ status: 0, code: "NETWORK" });
  });

  it("제한 시간을 넘기면 TIMEOUT", async () => {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    expect(await caught(get("/KOR/meta", { timeoutMs: 10 }))).toMatchObject({ status: 0, code: "TIMEOUT" });
  });

  it("본문을 받는 중에 시간 초과가 나면 BAD_BODY가 아니라 TIMEOUT", async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("{"));
          init?.signal?.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")));
        },
      });
      return new Response(body, { status: 200 });
    });
    expect(await caught(get("/KOR/geo", { timeoutMs: 10 }))).toMatchObject({ status: 0, code: "TIMEOUT" });
  });

  it("호출자가 취소한 요청은 ApiError로 바꾸지 않고 그대로 올린다", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(abortError));
        }),
    );
    const controller = new AbortController();
    const pending = caught(get("/KOR/meta", { signal: controller.signal }));
    controller.abort();
    const error = await pending;
    expect(error).toBe(abortError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});
