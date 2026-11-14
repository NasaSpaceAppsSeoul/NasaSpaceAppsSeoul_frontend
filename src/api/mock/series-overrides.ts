/*
 * 백엔드 기대값으로 덮는 월값. 생성기(`series-gen.ts`)가 만든 값 위에 얹는다.
 *
 * 출처: 백엔드 `api-test/spec_test.py`(300~545줄)의 기대값.
 * - 나라 KOR 2025-01·02·03: 값 21·43·1093, 순위 13·21·1, 배수 1.0·0.49·6.28, n 25.
 *   2025-03 판정: median 174, 범위 95.6–294.8, ytd_sum 1157.
 * - 경북 2025-03: 948, 1위/25, 배수 72.64 (의성 판정의 `ref`).
 * - 의성군 2025-03: 384, 평년 0. 고성군(강원) 2012-02: 0칸, 평년 0, `normal`.
 *
 * 지어낸 값: 위 기대값이 나오도록 정한 "다른 해의 같은 달" 값 전부.
 * - KOR 1월: 21보다 큰 해 12개·작은 해 12개 → 중앙값 21, 순위 13.
 * - KOR 2월: 43보다 큰 해 20개, 중앙값 88 → 순위 21, 43/88 = 0.49.
 * - KOR 3월: 정렬하면 4·5번째 122, 13번째 174, 21·22번째 268·269 → 15·85 퍼센타일 122·268.4,
 *   범위 122 − 2√174 = 95.6, 268.4 + 2√174 = 294.8.
 * - 경북 3월: 13번째 13.05 → 948/13.05 = 72.64.
 * - 의성 3월(2012~2025): 14개 해 중 9개가 0 → 중앙값 0, 384가 1위.
 * - 고성(강원) 2월(2012~2025): 2019년 1, 2025년 3, 나머지 0 → 중앙값 0.
 *   2025-02는 평년 0인데 값 > 0인 달(ZERO_BASELINE, 칩 `record`).
 * - 군포시 2025-04: `none` 지역인데 값 1 (`NO_RECORD`이지만 값 > 0인 경우).
 */
import type { Country } from "../types";

export const UISEONG = "91817680B75376031789242";
export const GOSEONG_GANGWON = "91817680B50485812736392";
export const GUNPO = "91817680B51138241033746";

/** `startYear`부터 해마다 같은 달(`month`, 1~12)의 값 */
function sameMonth(startYear: number, month: number, values: readonly number[]): [string, number][] {
  const mm = String(month).padStart(2, "0");
  return values.map((value, i) => [`${startYear + i}-${mm}`, value]);
}

const KOR_NATION: [string, number][] = [
  ...sameMonth(2001, 1, [34, 12, 27, 8, 45, 19, 23, 15, 31, 17, 52, 11, 26, 20, 38, 14, 29, 9, 24, 18, 41, 16, 33, 13, 21]),
  ...sameMonth(2001, 2, [95, 55, 30, 102, 61, 117, 47, 130, 22, 70, 96, 79, 140, 38, 66, 155, 84, 99, 88, 121, 41, 110, 170, 135, 43]),
  ...sameMonth(2001, 3, [151, 122, 233, 169, 101, 268, 188, 145, 205, 122, 174, 310, 130, 247, 80, 196, 163, 402, 138, 219, 158, 269, 115, 180, 1093]),
];

const GYEONGBUK: [string, number][] = sameMonth(2001, 3, [
  4.6, 236, 0.8, 13.05, 7.3, 2.4, 21.3, 0, 10.4, 5.2, 15.2, 1.7, 8.8, 3.1, 17.9, 6.9, 11.6, 38, 26, 74, 47, 112, 31, 59, 948,
]);

const UISEONG_VALUES: [string, number][] = sameMonth(2012, 3, [0, 0, 2, 0, 0, 5, 0, 0, 1, 0, 0, 3, 0, 384]);

const GOSEONG_VALUES: [string, number][] = sameMonth(2012, 2, [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 3]);

const TABLE: Partial<Record<Country, Record<string, [string, number][]>>> = {
  KOR: {
    KOR: KOR_NATION,
    경북: GYEONGBUK,
    [UISEONG]: UISEONG_VALUES,
    [GOSEONG_GANGWON]: GOSEONG_VALUES,
    [GUNPO]: [["2025-04", 1]],
  },
};

const EMPTY = new Map<string, number>();

export function overridesFor(country: Country, regionId: string): ReadonlyMap<string, number> {
  const rows = TABLE[country]?.[regionId];
  return rows === undefined ? EMPTY : new Map(rows);
}
