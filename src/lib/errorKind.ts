/**
 * 화면에 보일 에러 문구의 종류 (`decisions.md` 1-3, 2-6).
 * - `offline`: 서버에 닿지 않음 (네트워크, 시간 초과, 5xx·530, 성공 응답인데 JSON이 아님)
 * - `notReady`: 준비 안 된 나라 (`COUNTRY_NOT_READY`)
 * - `region`: 지역을 찾을 수 없음 (`REGION_NOT_FOUND`)
 * - `range`: 이 달은 자료 범위 밖 (`MONTH_OUT_OF_RANGE`)
 * - `other`: 그 밖. 본문이 JSON이 아닌 4xx(터널 404 등)와 `ApiError`가 아닌 예외도 여기로 온다
 */
export type ErrorKind = "offline" | "notReady" | "region" | "range" | "other";

const OFFLINE_CODES = new Set(["NETWORK", "TIMEOUT", "BAD_BODY", "UPSTREAM_UNAVAILABLE", "INTERNAL"]);

/** `lib`은 `api`를 가져오지 않으므로 에러의 `status`·`code` 필드만 보고 나눈다. */
export function errorKind(error: unknown): ErrorKind {
  if (typeof error !== "object" || error === null) return "other";
  const status: unknown = Reflect.get(error, "status");
  const code: unknown = Reflect.get(error, "code");
  if (typeof code !== "string" || typeof status !== "number") return "other";
  if (code === "COUNTRY_NOT_READY") return "notReady";
  if (code === "REGION_NOT_FOUND") return "region";
  if (code === "MONTH_OUT_OF_RANGE") return "range";
  if (OFFLINE_CODES.has(code) || status >= 500) return "offline";
  return "other";
}
