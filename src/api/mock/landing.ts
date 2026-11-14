/*
 * 목 `/landing` (`H-landing.md`). 한국만 둔다(소개 화면은 한국 고정, `decisions.md` 2-7). 다른 나라는 "mock: not implemented".
 *
 * 백엔드 기대값(`api-test/spec_test.py` 758–777행): `stats` 세 개의 값, `official_break` 2.67→1.04,
 * `break_test` 0.92[0.86, 0.98]→0.99[0.92, 1.05], `detect_by_size`의 "100 ha 이상" n 35·감지율 0.91.
 * `case_month_ratio.cells` 1093.0과 "100 ha 이상"의 `chance` 0.03은 명세 예시 값이다.
 *
 * 지어낸 값: `annual.before`, 나머지 네 단계의 `detect_by_size`, `jump_raw`.
 * `annual.after`는 지어내지 않고 한국 나라 시계열 목의 월값을 백엔드와 같은 규칙으로 더한다
 * (`LandingService.java:47-57`: 해마다 합, 값이 없는 달은 건너뜀, 소수 한 자리, 자료 없는 해는 0).
 */
import type { Country } from "../../lib/country";
import type { Landing } from "../types";
import { kor, korMeta } from "./kor";
import { mockSeries } from "./series-route";

const YEARS = Array.from({ length: 25 }, (_, i) => 2001 + i);

/** 나라 시계열 목에서 해별 합을 낸다. */
function annualAfter(): number[] {
  const sums = new Map<number, number>();
  for (const m of mockSeries("KOR", kor, "KOR", new URLSearchParams()).months) {
    if (m.value === null) continue;
    const year = Number(m.month.slice(0, 4));
    sums.set(year, (sums.get(year) ?? 0) + m.value);
  }
  return YEARS.map((y) => Math.round((sums.get(y) ?? 0) * 10) / 10);
}

/**
 * 지어낸 보정 전 값: MODIS(2011년까지)는 NOAA-20보다 덜 보고, S-NPP(2012년부터)는 비슷하게 본다고 보고 비율을 곱한다.
 * 2012년에 값이 뛰는 모양만 만들려는 것이다. 백엔드처럼 정수다.
 */
function annualBefore(after: number[]): number[] {
  return after.map((v, i) => Math.round(v * ((YEARS[i] ?? 0) < 2012 ? 0.38 : 0.95)));
}

const DETECT_BY_SIZE: Landing["detect_by_size"] = [
  { bin: "0.1 ha 미만", n: 2410, detected: 0.04, chance: 0.008 },
  { bin: "0.1~1", n: 2286, detected: 0.11, chance: 0.012 },
  { bin: "1~10", n: 694, detected: 0.32, chance: 0.017 },
  { bin: "10~100", n: 118, detected: 0.64, chance: 0.022 },
  { bin: "100 ha 이상", n: 35, detected: 0.91, chance: 0.03 },
];

function korLanding(): Landing {
  const after = annualAfter();
  return {
    country: "KOR",
    data_version: korMeta.data_version,
    labels: korMeta.labels,
    stats: [
      { key: "burned_area_record", year: 2025, value: 105099, source: "KOSIS", unit: "ha" },
      { key: "case_month_ratio", month: "2025-03", value: 6.28, cells: 1093.0, rank: 1, n: 25 },
      { key: "risk_share", value: 0.64, months: [2, 3, 4] },
    ],
    annual: { years: YEARS, before: annualBefore(after), after },
    official_break: { source: "산림청 (KOSIS)", before: 2.67, after: 1.04, inconclusive: false },
    break_test: {
      before: { ratio: 0.92, ci95: [0.86, 0.98] },
      after: { ratio: 0.99, ci95: [0.92, 1.05] },
      jump_raw: 2.41,
    },
    detect_by_size: DETECT_BY_SIZE,
    detect_n: DETECT_BY_SIZE.reduce((sum, d) => sum + d.n, 0),
  };
}

let cached: Landing | null = null;

/** 목이 있는 나라면 응답을, 없으면 `null`을 준다. 시계열 계산이 무거워 처음 한 번만 만든다. */
export function mockLanding(country: Country): Landing | null {
  if (country !== "KOR") return null;
  cached ??= korLanding();
  return cached;
}
