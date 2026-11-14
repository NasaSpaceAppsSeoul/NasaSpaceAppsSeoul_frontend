/*
 * 목 `/landing` (`H-landing.md`). 소개 화면은 한국 고정(`decisions.md` 2-7)이고, 캘리포니아·BC는 기법 페이지의 나라 탭 그림용이다
 * (`plans/method-page.md` 9절 ④).
 *
 * 백엔드 기대값(`api-test/spec_test.py` 758–777행): `stats` 세 개의 값, `official_break` 2.67→1.04,
 * `break_test` 0.92[0.86, 0.98]→0.99[0.92, 1.05], `detect_by_size`의 "100 ha 이상" n 35·감지율 0.91.
 * `case_month_ratio.cells` 1093.0과 "100 ha 이상"의 `chance` 0.03은 명세 예시 값이다.
 *
 * 지어낸 값: `annual.before`, `jump_raw`. `detect_by_size`는 팀 출력값(아래).
 * `annual.after`는 지어내지 않고 한국 나라 시계열 목의 월값을 백엔드와 같은 규칙으로 더한다
 * (`LandingService.java:47-57`: 해마다 합, 값이 없는 달은 건너뜀, 소수 한 자리, 자료 없는 해는 0).
 */
import type { Country } from "../../lib/country";
import type { Landing } from "../types";
import { bc } from "./bc";
import { cal } from "./cal";
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

// 크기별 감지율: 시안 `method_page.html` `R.KOR.det`(팀 출력값, 최종 노트북 ⑰ 출력과 같은 값)
const DETECT_BY_SIZE: Landing["detect_by_size"] = [
  { bin: "0.1 ha 미만", n: 2445, detected: 0.05, chance: 0.02 },
  { bin: "0.1~1", n: 1490, detected: 0.09, chance: 0.03 },
  { bin: "1~10", n: 364, detected: 0.3, chance: 0.03 },
  { bin: "10~100", n: 83, detected: 0.61, chance: 0.06 },
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
      jump_raw: 2.4,
    },
    detect_by_size: DETECT_BY_SIZE,
    detect_n: DETECT_BY_SIZE.reduce((sum, d) => sum + d.n, 0),
  };
}

/*
 * 캘리포니아·BC (`plans/method-page.md` 9절 ④). 값의 출처를 나눠 적는다.
 * - `annual`, `detect_by_size`의 감지율·우연 기준·건수: 시안 `design/extra/method_page.html`의 `R.CAL`·`R.BC`
 *   (팀 파이프라인 `output/CAL`·`output/BC` 값을 옮긴 것). 단계 이름은 백엔드가 한국어 다섯 이름으로 정렬하므로 같은 이름을 쓴다.
 * - `official_break`, `break_test`: 최종 노트북(`burnline_harmonization_{CAL,BC}.ipynb`, 2026-11-14) ⑦·⑰ 출력.
 *   `inconclusive`는 백엔드 규칙(after가 0.75~1.33 밖이면 true). `jump_raw`는 백엔드처럼 소수 한 자리.
 * - `stats`: 대표 달·배수·순위는 시안 값(CAL 2020-09 15.94배, BC 2023-05 22.03배), BC 피해면적 기록은 `H-landing.md` H-2.
 *   CAL 피해면적 기록은 확인한 값이 없어 `null`(지어내지 않음). 위험 시기는 시안 08절.
 * 9장에서 서버 응답으로 바꾼다.
 */
const DETECT_BINS = ["0.1 ha 미만", "0.1~1", "1~10", "10~100", "100 ha 이상"];
const detect = (rows: readonly (readonly [number, number, number])[]): Landing["detect_by_size"] =>
  rows.map(([n, detected, chance], i) => ({ bin: DETECT_BINS[i] ?? "", n, detected, chance }));

function regionLanding(country: "CAL" | "BC"): Landing {
  const meta = country === "CAL" ? cal.meta : bc.meta;
  const r = REGION_LANDING[country];
  return {
    country,
    data_version: meta.data_version,
    labels: meta.labels,
    stats: r.stats,
    annual: { years: YEARS, before: r.before, after: r.after },
    official_break: r.official,
    break_test: r.breakTest,
    detect_by_size: r.detect,
    detect_n: r.detect.reduce((sum, d) => sum + d.n, 0),
  };
}

const REGION_LANDING = {
  CAL: {
    before: [2662, 5773, 8237, 4975, 3992, 8603, 9349, 16261, 6155, 2339, 2988, 11608, 13194, 11890, 18035, 11562, 23768, 24994, 8641, 63848, 51371, 9992, 12999, 12005, 11431],
    after: [10027.6, 13349.7, 16578.9, 9944.1, 7928.3, 16263.1, 18115.5, 28657.6, 11806.5, 4555.7, 5960.7, 12539.7, 13693.6, 12332.1, 18661.1, 12142.7, 24864.6, 24970.8, 8769, 64825, 52464, 11185, 13452, 14760, 11661],
    detect: detect([[58, 0.33, 0.28], [304, 0.41, 0.37], [1199, 0.62, 0.48], [1053, 0.68, 0.44], [637, 0.86, 0.45]]),
    official: { source: "CAL FIRE", before: 2.54, after: 1.25, inconclusive: false },
    breakTest: { before: { ratio: 1.0, ci95: [0.96, 1.04] }, after: { ratio: 1.02, ci95: [0.98, 1.06] }, jump_raw: 2.1 },
    stats: [
      { key: "burned_area_record", year: null, value: null, source: "CAL FIRE", unit: "ha" },
      { key: "case_month_ratio", month: "2020-09", value: 15.94, cells: 32941, rank: 1, n: 25 },
      { key: "risk_share", value: 0.6, months: [8, 9, 10] },
    ],
  },
  BC: {
    before: [1316, 2680, 10035, 6708, 4148, 4507, 4953, 4501, 8338, 12349, 3403, 7380, 9910, 22923, 17340, 9363, 58014, 72616, 8477, 5794, 43154, 12917, 76656, 15029, 15336],
    after: [5326.4, 6682, 23229.8, 14885.6, 9505, 10228, 10743.2, 10388.4, 19057.9, 28331.4, 8042.4, 7616.1, 10074.3, 23319.4, 17551.2, 9478.9, 58859.5, 72717.8, 8573, 6002, 44108, 13845, 73568, 16984, 15814],
    detect: detect([[6509, 0.62, 0.43], [2448, 0.69, 0.47], [1390, 0.76, 0.45], [738, 0.9, 0.48], [843, 0.93, 0.54]]),
    official: { source: "BC Wildfire Service", before: 4.99, after: 2.14, inconclusive: true },
    breakTest: { before: { ratio: 0.99, ci95: [0.96, 1.03] }, after: { ratio: 1.0, ci95: [0.97, 1.03] }, jump_raw: 2.4 },
    stats: [
      { key: "burned_area_record", year: 2023, value: 2896225, source: "BC Wildfire Service", unit: "ha" },
      { key: "case_month_ratio", month: "2023-05", value: 22.03, cells: 5772, rank: 1, n: 25 },
      { key: "risk_share", value: 0.51, months: [7, 8] },
    ],
  },
} satisfies Record<"CAL" | "BC", {
  before: number[];
  after: number[];
  detect: Landing["detect_by_size"];
  official: Landing["official_break"];
  breakTest: Landing["break_test"];
  stats: Landing["stats"];
}>;

const cached = new Map<Country, Landing>();

/** 목이 있는 나라면 응답을, 없으면 `null`을 준다. 한국은 시계열 계산이 무거워 처음 한 번만 만든다. */
export function mockLanding(country: Country): Landing | null {
  const hit = cached.get(country);
  if (hit !== undefined) return hit;
  const landing = country === "KOR" ? korLanding() : regionLanding(country);
  cached.set(country, landing);
  return landing;
}
