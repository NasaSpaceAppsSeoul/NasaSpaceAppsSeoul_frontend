/** 백엔드와 같은 달 형식(`Params.java`): 네 자리 연도와 두 자리 달. */
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type MonthParam = { valid: true; month: string | undefined } | { valid: false };

/**
 * 주소의 `?month=` 값을 검사한다.
 * 키가 없으면(`null`) 고르지 않은 것이라 유효하다. 빈 값과 형식이 틀린 값은 잘못된 주소다.
 */
export function parseMonthParam(raw: string | null): MonthParam {
  if (raw === null) return { valid: true, month: undefined };
  return MONTH_PATTERN.test(raw) ? { valid: true, month: raw } : { valid: false };
}
