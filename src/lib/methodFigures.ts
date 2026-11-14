/*
 * 기법 페이지 06절 그림 계산 (`plans/method-page.md` 8-3·12-8). `lib`은 `api`를 가져오지 않으므로 필요한 필드만 구조 타입으로 둔다.
 */

/** 그림에 쓰는 해(진행 중인 해는 뺀다, 8-3) */
export const SAME_MONTH_YEARS = { from: 2001, to: 2025 } as const;

export type SameMonthChip = "record" | "above" | "normal" | "below";
export type SameMonthInput = { month: string; value: number | null; rank: number | null };
export type Band = { median: number | null; low: number | null; high: number | null };
export type SameMonthBar = { year: number; value: number; chip: SameMonthChip };

/**
 * 같은 달(1~12)의 해별 값과 칩. 값이 없는 해는 뺀다.
 * 칩은 프론트가 새로 판정하지 않고 백엔드 규칙을 따른다(`C-judgement.md` C-2): 값 > 0이고 같은 달 1위면 최고 기록,
 * 위 끝보다 크면 많음, 아래 끝보다 작으면 적음, 나머지(범위 값이 없을 때 포함)는 평소 범위.
 * 아래 끝이 음수면 0으로 자른다(`decisions.md` 3-6).
 */
export function sameMonthBars(months: readonly SameMonthInput[], month: number, band: Band | null): SameMonthBar[] {
  const low = band?.low === null || band?.low === undefined ? null : Math.max(0, band.low);
  const high = band?.high ?? null;
  const bars: SameMonthBar[] = [];
  for (const m of months) {
    const year = Number(m.month.slice(0, 4));
    if (Number(m.month.slice(5, 7)) !== month || year < SAME_MONTH_YEARS.from || year > SAME_MONTH_YEARS.to) continue;
    if (m.value === null) continue;
    let chip: SameMonthChip = "normal";
    if (m.value > 0 && m.rank === 1) chip = "record";
    else if (high !== null && m.value > high) chip = "above";
    else if (low !== null && m.value < low) chip = "below";
    bars.push({ year, value: m.value, chip });
  }
  return bars;
}

export type CaseMonth = { year: number; month: number };

/**
 * `/landing` `stats`의 대표 달(`case_month_ratio`, 백엔드 `LandingService.java:25`). 키로 찾고(순번 아님, H-2),
 * 달이 없거나 이상하면 `null`. 배수·순위는 여기서 읽지 않고 그림과 같은 `/series` 줄에서 읽는다(제목과 막대가 어긋나지 않게).
 */
export function caseMonth(stats: readonly { key: string; month?: unknown }[]): CaseMonth | null {
  const stat = stats.find((s) => s.key === "case_month_ratio");
  if (stat === undefined || typeof stat.month !== "string") return null;
  const year = Number(stat.month.slice(0, 4));
  const month = Number(stat.month.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}
