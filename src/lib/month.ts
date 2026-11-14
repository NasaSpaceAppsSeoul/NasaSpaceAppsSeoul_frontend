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

/*
 * 아래 함수는 모두 형식이 맞는 `YYYY-MM`을 받는다. 같은 형식이라 문자열 비교가 곧 날짜 비교다.
 */

/** 시·군·구 값이 시작되는 달(S-NPP 관측 시작). 그 전 달의 `/top`은 빈 목록이다(스킬 `burnline-api` 15번, `decisions.md` 6-3) */
export const DISTRICT_DATA_START = "2012-02";

export function beforeDistrictData(month: string): boolean {
  return month < DISTRICT_DATA_START;
}

export type MonthRange = { first: string; last: string };

export function monthYear(month: string): number {
  return Number(month.slice(0, 4));
}

/** 1~12 */
export function monthNumber(month: string): number {
  return Number(month.slice(5, 7));
}

export function makeMonth(year: number, monthOfYear: number): string {
  return `${String(year).padStart(4, "0")}-${String(monthOfYear).padStart(2, "0")}`;
}

/** 달을 `n`개월 앞(+)이나 뒤(-)로 옮긴다. */
export function shiftMonth(month: string, n: number): string {
  const index = monthYear(month) * 12 + (monthNumber(month) - 1) + n;
  return makeMonth(Math.floor(index / 12), (index % 12) + 1);
}

/** 시계열의 첫 달과 마지막 달(시간순으로 온다, D-1). 비었으면 `null`. */
export function monthRange(months: readonly { month: string }[]): MonthRange | null {
  const first = months[0];
  const last = months[months.length - 1];
  return first !== undefined && last !== undefined ? { first: first.month, last: last.month } : null;
}

export function isInRange(month: string, range: MonthRange): boolean {
  return month >= range.first && month <= range.last;
}

/** 범위 밖이면 가까운 끝으로 맞춘다. */
export function clampMonth(month: string, range: MonthRange): string {
  if (month < range.first) return range.first;
  if (month > range.last) return range.last;
  return month;
}
