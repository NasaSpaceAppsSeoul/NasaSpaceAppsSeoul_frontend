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

/** 날짜("YYYY-MM-DD")를 연·월·일로: "2026년 11월 14일" / "14 November 2026" */
export function formatFullDate(date: string, locale: Locale): string {
  const year = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  return locale === "ko" ? `${year}년 ${m}월 ${d}일` : `${d} ${formatMonthName(m, locale)} ${year}`;
}

/**
 * 날짜 범위를 연·월·일로(03 자료 기준일): 같은 날 "2026년 11월 14일" / "14 November 2026",
 * 같은 달 "2026년 11월 11–14일" / "11–14 November 2026", 같은 해 "2026년 10월 31일–11월 14일" / "31 October–14 November 2026",
 * 해가 다르면 두 날짜를 다 쓴다.
 */
export function formatDateSpan(first: string, last: string, locale: Locale): string {
  if (first === last) return formatFullDate(last, locale);
  if (first.slice(0, 4) !== last.slice(0, 4)) return `${formatFullDate(first, locale)}–${formatFullDate(last, locale)}`;
  const year = Number(last.slice(0, 4));
  const [m1, d1, m2, d2] = [first.slice(5, 7), first.slice(8, 10), last.slice(5, 7), last.slice(8, 10)].map(Number) as [number, number, number, number];
  if (locale === "ko") return m1 === m2 ? `${year}년 ${m1}월 ${d1}–${d2}일` : `${year}년 ${m1}월 ${d1}일–${m2}월 ${d2}일`;
  return m1 === m2
    ? `${d1}–${d2} ${formatMonthName(m2, locale)} ${year}`
    : `${d1} ${formatMonthName(m1, locale)}–${d2} ${formatMonthName(m2, locale)} ${year}`;
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

/**
 * 한글 이름 뒤 "와/과": 받침이 있으면 "과"("의성군과"), 없으면 "와"("안동시와").
 * 한글로 끝나지 않는 이름(CAL·BC 영문 이름)은 받침을 알 수 없어 `null`(부르는 쪽이 조사 없는 꼴을 쓴다).
 */
export function andParticle(name: string): "와" | "과" | null {
  const code = name.trim().codePointAt(name.trim().length - 1);
  if (code === undefined || code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28 === 0 ? "와" : "과";
}

/** 기간: 같은 달이면 "3월 22–29일" / "Mar 22–29", 달이 다르면 "3월 30일–4월 2일" / "Mar 30–Apr 2" */
export function formatDayRange(start: string, end: string, locale: Locale): string {
  if (start.slice(0, 7) !== end.slice(0, 7)) return `${formatDayDate(start, locale)}–${formatDayDate(end, locale)}`;
  const last = Number(end.slice(8, 10));
  return locale === "ko" ? `${formatDayDate(start, locale).replace(/일$/, "")}–${last}일` : `${formatDayDate(start, locale)}–${last}`;
}
