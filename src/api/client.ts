import type { ClientErrorCode, ErrorCode } from "./types";

/** 요청 하나의 기본 제한 시간. `/insight`는 호출하는 쪽에서 20초를 준다. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** 개발 서버(localhost)는 백엔드 CORS가 허용하므로 터널을 직접 부른다. */
const DEV_BASE = "https://burnline-api.unzipp.cloud/api/v1";
/** 배포에서는 같은 출처의 `/api/v1`을 호스팅의 rewrite로 터널에 넘긴다(CORS 없음, 8장). */
const DEPLOY_BASE = "/api/v1";

export type ApiMode = "mock" | "live";

/** 매번 읽는다. 테스트가 `vi.stubEnv`로 바꾼 값이 바로 반영되게 한다. */
export function apiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE;
  if (mode === "mock" || mode === "live") return mode;
  return import.meta.env.DEV ? "mock" : "live";
}

function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? DEV_BASE : DEPLOY_BASE);
}

/**
 * 모든 요청 실패는 이 에러로 바뀐다.
 * `code`는 서버가 준 코드(`ErrorCode`)이거나 프론트가 만든 코드(`ClientErrorCode`)다.
 * 서버가 모르는 코드를 줄 수도 있어 타입은 문자열로 열어 둔다.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | ClientErrorCode | (string & {});

  constructor(status: number, code: ErrorCode | ClientErrorCode | (string & {}), message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// TanStack Query의 `defaultError`는 `ApiError`로 등록하지 않는다. `select`나 목에서 나는 일반 예외도
// `error`로 오기 때문이다. 화면은 `lib/errorKind`로 필드를 확인해 나눈다(`ApiError`가 아니면 `other`).

/** 한 번 다시 시도할 만한 실패인가: 5xx(530 포함), 시간 초과, 네트워크. 4xx와 응답 형식 오류는 다시 해도 같다. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.status >= 500 || error.code === "TIMEOUT" || error.code === "NETWORK";
}

export type QueryValue = string | number | null | undefined;

/** 쿼리 문자열을 붙인다. 값이 없는 키(`undefined`·`null`·빈 문자열)는 키째 뺀다(`A-common.md` A-4). */
export function withQuery(path: string, params: Record<string, QueryValue>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length === 0 ? path : `${path}?${parts.join("&")}`;
}

export type GetOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** 기본은 `no-cache`(매번 재검증). 실패 뒤 재요청은 `reload`. */
  cache?: RequestCache;
};

/** JSON이 아니면 `null`. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readErrorBody(body: unknown): { code?: string; message?: string } {
  if (typeof body !== "object" || body === null) return {};
  const code = "code" in body && typeof body.code === "string" ? body.code : undefined;
  const message = "message" in body && typeof body.message === "string" ? body.message : undefined;
  return { code, message };
}

/**
 * 서버에 GET을 보내는 유일한 함수. `path`는 `/KOR/meta`처럼 `/api/v1` 뒤의 경로다.
 * 목 모드면 서버 대신 목 묶음이 답한다(`decisions.md` 10-1). 훅과 api 함수는 두 경우에 똑같다.
 */
export async function get<T>(
  path: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS, cache = "no-cache" }: GetOptions = {},
): Promise<T> {
  if (apiMode() === "mock") {
    const { mockGet } = await import("./mock");
    return (await mockGet(path, signal)) as T;
  }

  const timeout = AbortSignal.timeout(timeoutMs);
  let res: Response;
  try {
    res = await fetch(apiBase() + path, {
      cache,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (e) {
    if (signal?.aborted) throw e; // 호출자가 취소한 요청은 그대로 올린다
    throw new ApiError(0, timeout.aborted ? "TIMEOUT" : "NETWORK", String(e));
  }

  // 본문을 받는 중에도 시간 초과·연결 끊김·취소가 날 수 있다. 응답 형식 오류(BAD_BODY)와 섞지 않는다
  let text: string;
  try {
    text = await res.text();
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ApiError(0, timeout.aborted ? "TIMEOUT" : "NETWORK", String(e));
  }
  // 터널 404·530은 본문이 JSON이 아니다
  const body = parseJson(text);
  if (!res.ok) {
    const { code, message } = readErrorBody(body);
    throw new ApiError(res.status, code ?? "UNKNOWN", message ?? res.statusText);
  }
  if (body === null) throw new ApiError(res.status, "BAD_BODY", "응답이 JSON이 아닙니다");
  return body as T;
}
