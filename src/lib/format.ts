import type { Locale } from "./locale";
import { monthNumber, monthYear } from "./month";

const NUMBER_LOCALE: Record<Locale, string> = { ko: "ko-KR", en: "en-US" };

/**
 * 화재 감지일 (`decisions.md` 1-11): 소수 한 자리까지, `.0`이면 정수로, 천 단위 쉼표.
 * `ytd_sum`처럼 반올림 안 된 값(12.300000000000001)도 여기서 한 자리로 맞춘다.
 */
export function formatFireDays(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 1 }).format(value);
}

/** 배수 (`decisions.md` 1-11): 소수 두 자리. */
export function formatRatio(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026년 7월" / "July 2026" */
export function formatMonth(month: string, locale: Locale): string {
  const year = monthYear(month);
  const m = monthNumber(month);
  return locale === "ko" ? `${year}년 ${m}월` : `${EN_MONTHS[m - 1] ?? m} ${year}`;
}

/** 달 이름만: "7월" / "July" */
export function formatMonthName(monthOfYear: number, locale: Locale): string {
  return locale === "ko" ? `${monthOfYear}월` : (EN_MONTHS[monthOfYear - 1] ?? String(monthOfYear));
}
