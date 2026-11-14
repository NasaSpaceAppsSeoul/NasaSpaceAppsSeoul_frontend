/*
 * 목 `/landing` (`H-landing.md`). 소개 화면은 한국 고정(`decisions.md` 2-7)이고, 한국 밖 다섯 지역은 기법 페이지의 나라 탭 그림용이다
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
import { chl } from "./chl";
import { grc } from "./grc";
import { kor, korMeta } from "./kor";
import { nsw } from "./nsw";
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
 *
 * 그리스·칠레·NSW (9장): `annual`, `detect_by_size`, `official_break`, `break_test`, 위험 시기는 서버 `/landing` 응답
 * (2026-11-15, 백엔드 `abfd9fe` 서버, `.claude/reference/samples/*-landing.json`). 대표 달은 `LandingService.java`의 달
 * (GRC 2007-08·CHL 2023-02·NSW 2019-12)이고 배수·칸·순위도 그 응답 값이다.
 * 그리스는 공식 기록 단절 비율·감지율·위험 시기가 비어 온다(`null`, 빈 배열, `months: null`).
 */
const DETECT_BINS = ["0.1 ha 미만", "0.1~1", "1~10", "10~100", "100 ha 이상"];
const detect = (rows: readonly (readonly [number, number | null, number | null])[]): Landing["detect_by_size"] =>
  rows.map(([n, detected, chance], i) => ({ bin: DETECT_BINS[i] ?? "", n, detected, chance }));

type RegionCountry = Exclude<Country, "KOR">;
const REGION_META = { CAL: cal.meta, BC: bc.meta, GRC: grc.meta, CHL: chl.meta, NSW: nsw.meta } satisfies Record<RegionCountry, unknown>;

function regionLanding(country: RegionCountry): Landing {
  const meta = REGION_META[country];
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
  GRC: {
    before: [1638, 725, 1359, 1826, 1523, 1186, 4874, 2298, 1407, 754, 2265, 4199, 3899, 2975, 3064, 3655, 2949, 1833, 2478, 2452, 3309, 2313, 3665, 2022, 1899],
    after: [10323.5, 2342, 3672.1, 4957.7, 4316.9, 3172.2, 11642.9, 6218, 3513.3, 2005.8, 6126, 4460.2, 4129.8, 3163.1, 3281.4, 3902.5, 3170.4, 1978.3, 2617, 2580, 3606, 2506, 3706, 2284, 1928],
    detect: detect([]),
    official: { source: "그리스 소방청", before: null, after: null, inconclusive: false },
    breakTest: { before: { ratio: 0.98, ci95: [0.95, 1.02] }, after: { ratio: 1.01, ci95: [0.98, 1.04] }, jump_raw: 2.8 },
    stats: [
      { key: "burned_area_record", year: null, value: null, source: "그리스 소방청", unit: "ha" },
      { key: "case_month_ratio", month: "2007-08", value: 11.47, cells: 5091.9, rank: 1, n: 25 },
      { key: "risk_share", value: null, months: null },
    ],
  },
  CHL: {
    before: [834, 1203, 4083, 4786, 5197, 4204, 4704, 5328, 5403, 4629, 4363, 8934, 10682, 9942, 14334, 10226, 18091, 9983, 10186, 10905, 9777, 11290, 18873, 8608, 10541],
    after: [7902.7, 7224.7, 9801.6, 10883.2, 12244.2, 9892.7, 11174.9, 12367.8, 12363.7, 11319.9, 10030.2, 9921.4, 10743.8, 9863.6, 14212.8, 10260.7, 17684.8, 9858.9, 10241, 10985, 9987, 10972, 17847, 8804, 10483],
    detect: detect([[0, null, null], [0, null, null], [0, null, null], [0, null, null], [489, 0.97, 0.34]]),
    official: { source: "CONAF", before: 2.38, after: 0.96, inconclusive: false },
    breakTest: { before: { ratio: 1.02, ci95: [0.99, 1.06] }, after: { ratio: 1.02, ci95: [0.99, 1.06] }, jump_raw: 2.8 },
    stats: [
      { key: "burned_area_record", year: null, value: null, source: "CONAF", unit: "ha" },
      { key: "case_month_ratio", month: "2023-02", value: 15.43, cells: 9660, rank: 1, n: 25 },
      { key: "risk_share", value: 0.51, months: [3, 4, 5] },
    ],
  },
  NSW: {
    before: [5323, 17435, 18628, 13625, 11398, 17174, 7531, 5324, 9534, 4572, 13438, 25696, 36772, 29131, 24197, 29137, 40938, 36726, 124922, 40002, 24027, 15432, 34768, 22514, 25897],
    after: [39596.3, 69110.4, 48109.3, 36481.2, 30710.4, 45445.4, 21307.9, 14609.5, 25560.2, 11919.1, 35250.3, 26473.8, 37628, 29816.6, 24547.1, 29533.2, 41926.9, 36952.9, 128710, 41078, 24574, 16119, 34993, 22576, 26323],
    detect: detect([[441, 0.47, 0.32], [462, 0.54, 0.35], [576, 0.71, 0.43], [529, 0.8, 0.5], [659, 0.95, 0.59]]),
    official: { source: "NSW NPWS", before: 2.92, after: 1.05, inconclusive: false },
    breakTest: { before: { ratio: 1.02, ci95: [0.98, 1.07] }, after: { ratio: 1.03, ci95: [0.98, 1.08] }, jump_raw: 3.0 },
    stats: [
      { key: "burned_area_record", year: null, value: null, source: "NSW NPWS", unit: "ha" },
      { key: "case_month_ratio", month: "2019-12", value: 61.66, cells: 50656, rank: 1, n: 25 },
      { key: "risk_share", value: 0.55, months: [4, 5, 8, 9, 12] },
    ],
  },
} satisfies Record<RegionCountry, {
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
