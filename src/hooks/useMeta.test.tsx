import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { korMeta } from "../api/mock/kor";
import { createTestQueryClient } from "../test/render";
import { useMeta } from "./useMeta";

/*
 * 실제 QueryClient로 "실패 → 다시 시도"가 `cache: "reload"`로 나가는지 확인한다.
 * 새 요청이 시작될 때 쿼리 상태의 실패 횟수가 지워지므로, 상태 객체를 직접 만든 단위 테스트로는 잡을 수 없다.
 */

const fetchMock = vi.fn<typeof fetch>();

function okResponse(): Response {
  return new Response(JSON.stringify(korMeta), { status: 200 });
}

function errorResponse(status: number, code: string): Response {
  return new Response(JSON.stringify({ code, message: code }), { status });
}

function wrapper() {
  const client = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const cacheOf = (call: number) => fetchMock.mock.calls[call]?.[1]?.cache;

describe("useMeta", () => {
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

  it("나라가 없으면 요청하지 않는다", () => {
    const { result } = renderHook(() => useMeta(undefined), { wrapper: wrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("첫 요청은 no-cache, 5xx 자동 재시도는 reload", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(503, "UPSTREAM_UNAVAILABLE")).mockResolvedValueOnce(okResponse());
    const { result } = renderHook(() => useMeta("KOR"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cacheOf(0)).toBe("no-cache");
    expect(cacheOf(1)).toBe("reload");
  });

  it("4xx는 다시 시도하지 않고, 사용자가 누른 다시 시도(refetch)는 reload로 나간다", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(404, "COUNTRY_NOT_READY")).mockResolvedValueOnce(okResponse());
    const { result } = renderHook(() => useMeta("KOR"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toMatchObject({ status: 404, code: "COUNTRY_NOT_READY" });

    await act(() => result.current.refetch());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cacheOf(1)).toBe("reload");
  });
});
