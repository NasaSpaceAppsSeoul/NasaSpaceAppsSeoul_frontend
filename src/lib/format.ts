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

/** 건수: 정수, 천 단위 쉼표. */
export function formatCount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 0 }).format(value);
}

/** 비율을 백분율로: 0.91 → "91%". 0보다 크고 0.5% 미만은 "<1%", 값이 없으면 "—". */
export function formatPercent(ratio: number | null, locale: Locale): string {
  if (ratio === null || !Number.isFinite(ratio)) return "—";
  if (ratio > 0 && ratio < 0.005) return "<1%";
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], { style: "percent", maximumFractionDigits: 0 }).format(ratio);
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

/** 날짜("YYYY-MM-DD")를 달·일로: "3월 26일" / "Mar 26" */
export function formatDayDate(date: string, locale: Locale): string {
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  return locale === "ko" ? `${m}월 ${d}일` : `${formatMonthShort(m, locale)} ${d}`;
}

/** 그래프 눈금용 짧은 달 이름: "3월" / "Mar" */
export function formatMonthShort(monthOfYear: number, locale: Locale): string {
  return locale === "ko" ? `${monthOfYear}월` : formatMonthName(monthOfYear, locale).slice(0, 3);
}

/** 달 여러 개: "3월·4월" / "March, April" */
export function formatMonthList(months: readonly number[], locale: Locale): string {
  return months.map((m) => formatMonthName(m, locale)).join(locale === "ko" ? "·" : ", ");
}

/** 기간: 같은 달이면 "3월 22–29일" / "Mar 22–29", 달이 다르면 "3월 30일–4월 2일" / "Mar 30–Apr 2" */
export function formatDayRange(start: string, end: string, locale: Locale): string {
  if (start.slice(0, 7) !== end.slice(0, 7)) return `${formatDayDate(start, locale)}–${formatDayDate(end, locale)}`;
  const last = Number(end.slice(8, 10));
  return locale === "ko" ? `${formatDayDate(start, locale).replace(/일$/, "")}–${last}일` : `${formatDayDate(start, locale)}–${last}`;
}
