import { formatRatio } from "./format";
import type { Locale } from "./locale";

/*
 * 기법 페이지 03·04·05 표의 칸 글자 (9장 3차). 숫자는 서버 `/meta` `method_stats`·`validation`과 `/landing` `break_test`.
 * `lib`은 `api`를 가져오지 않으므로 쓰는 필드만 구조 타입으로 둔다. 값이 없으면 `null`(부르는 쪽이 "—"로).
 */

/** 받는 중인 칸 */
export const CELL_LOADING = "…";
/** 값이 없거나 받지 못한 칸 */
export const CELL_MISSING = "—";

export type QueryLike<T> = { isPending: boolean; isError: boolean; isFetching: boolean; data: T | undefined };

/** 요청 상태에 따른 칸: 받는 중(다시 묻는 중 포함) "…", 실패·값 없음 "—" */
export function queryCell<T>(query: QueryLike<T>, pick: (data: T) => string | null): string {
  if (query.isPending || (query.isError && query.isFetching)) return CELL_LOADING;
  if (query.data === undefined) return CELL_MISSING;
  return pick(query.data) ?? CELL_MISSING;
}

const NUMBER_LOCALE: Record<Locale, string> = { ko: "ko-KR", en: "en-US" };

/** 백분율 값(14.9)을 소수 한 자리로: "14.9%", 14 → "14.0%" */
export function formatPct(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(NUMBER_LOCALE[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
}

export type GridRowLike = { "격자(도)": number; "월별 R²": number | null; "연간 오차 %": number | null };

/** 03 칸 크기 표: 그 칸 크기 줄의 "월별 R² · 연간 오차". 서버 R²는 소수 셋째 자리라 둘째 자리로 줄인다 */
export function gridCell(rows: readonly GridRowLike[] | null | undefined, degree: number, locale: Locale): string | null {
  const row = Array.isArray(rows) ? rows.find((r) => r["격자(도)"] === degree) : undefined;
  if (row === undefined) return null;
  const r2 = row["월별 R²"];
  const error = row["연간 오차 %"];
  if (r2 === null || error === null) return null;
  return `${formatRatio(r2, locale)} · ${formatPct(error, locale)}`;
}

/** 연간 오차 칸 */
export function pctCell(value: number | null | undefined, locale: Locale): string | null {
  return value === null || value === undefined ? null : formatPct(value, locale);
}

/** 순위 상관 칸(하나 또는 "건수 / 피해면적" 둘) */
export function corrCell(values: readonly (number | null | undefined)[], locale: Locale): string | null {
  if (values.some((v) => v === null || v === undefined)) return null;
  return values.map((v) => formatRatio(v ?? 0, locale)).join(" / ");
}

export type BreakLike = { ratio: number | null; ci95: readonly [number, number] | null };

/** 05 위성끼리 단절: "보정 전 → 후 [95% 범위]". 보정 전은 `/landing` `jump_raw`, 후와 범위는 `/meta` `validation` */
export function satelliteCell(jumpRaw: number | null | undefined, after: BreakLike, locale: Locale): string | null {
  if (jumpRaw === null || jumpRaw === undefined || after.ratio === null) return null;
  const range = after.ci95 === null ? "" : ` [${formatRatio(after.ci95[0], locale)}–${formatRatio(after.ci95[1], locale)}]`;
  return `${formatRatio(jumpRaw, locale)} → ${formatRatio(after.ratio, locale)}${range}`;
}

export type OfficialBreakLike = { before: number; after: number; inconclusive: boolean };

/** 05 공식 기록 대비 단절: "보정 전 → 후". 판단 보류와 나라별 덧말은 부르는 쪽이 붙인다 */
export function officialCell(value: OfficialBreakLike | null | undefined, locale: Locale): string | null {
  if (value === null || value === undefined) return null;
  return `${formatRatio(value.before, locale)} → ${formatRatio(value.after, locale)}`;
}
