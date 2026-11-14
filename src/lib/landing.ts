/*
 * 소개 화면 계산 (`H-landing.md` H-3, H-5). `lib`은 `api`를 가져오지 않으므로 필요한 필드만 구조 타입으로 둔다.
 */

/** 위성이 MODIS에서 S-NPP로 바뀐 해. 응답에 없어 상수로 둔다(H-3). */
export const BREAK_YEAR = 2012;

export type AnnualInput = { years: readonly number[]; before: readonly number[]; after: readonly number[] };
export type AnnualBar = { year: number; before: number; after: number; era: "pre" | "post" };

/** 해별로 묶는다. 배열 길이가 서로 다르면 짧은 쪽에 맞춘다. */
export function annualBars({ years, before, after }: AnnualInput): AnnualBar[] {
  const length = Math.min(years.length, before.length, after.length);
  const bars: AnnualBar[] = [];
  for (let i = 0; i < length; i += 1) {
    const year = years[i] ?? 0;
    bars.push({ year, before: before[i] ?? 0, after: after[i] ?? 0, era: year < BREAK_YEAR ? "pre" : "post" });
  }
  return bars;
}

/** 모든 값이 0이면(자료 없음과 구분되지 않는다, H-3) 그래프 대신 안내를 보인다. */
export function hasAnnualData(bars: readonly AnnualBar[]): boolean {
  return bars.some((bar) => bar.before > 0 || bar.after > 0);
}

const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** 세로축 위 끝: 최댓값 이상인 가장 작은 "깔끔한 수"(1·1.2·1.5·2·2.5·3·4·5·6·8 × 10ⁿ). 모두 0이거나 비면 1. */
export function niceMax(values: readonly number[]): number {
  const max = Math.max(0, ...values);
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = NICE_STEPS.find((s) => s * power >= max - power * 1e-9) ?? 10;
  return Number((step * power).toPrecision(12));
}

export type DetectInput = { bin: string; detected: number | null; chance: number | null };

/**
 * 단계 이름: 화면 문구 표(`i18n`)에서 찾고, 표에 없으면 받은 문자열 그대로(나라마다 단계 이름이 다를 수 있다, H-5).
 * 순서는 받은 그대로 둔다.
 */
export function binLabel(bin: string, names: Readonly<Record<string, string>>): string {
  return Object.hasOwn(names, bin) ? (names[bin] ?? bin) : bin;
}

export type DetectRow = {
  bin: string;
  label: string;
  /** 막대 길이 0~1(값이 없으면 0) */
  width: number;
  /** 세로선 자리 0~1(값이 없으면 `null`, 선을 그리지 않는다) */
  chanceAt: number | null;
  detected: number | null;
  chance: number | null;
};

/** 감지율 줄. 받은 순서 그대로, 이름은 표에서 찾는다(H-5). */
export function detectRows(items: readonly DetectInput[], names: Readonly<Record<string, string>>): DetectRow[] {
  return items.map((item) => ({
    bin: item.bin,
    label: binLabel(item.bin, names),
    width: clampRatio(item.detected),
    chanceAt: item.chance === null ? null : clampRatio(item.chance),
    detected: item.detected,
    chance: item.chance,
  }));
}

/** 막대 길이(0~1). `null`이나 범위 밖 값은 잘라 둔다. */
export function clampRatio(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
