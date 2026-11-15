/*
 * 그리스 목 (`decisions.md` 10-5a, 9장). 숫자는 한국 목과 같은 값을 쓰고, 구조만 이 나라대로 넣는다.
 * - `labels`, `sources`, `time_basis`: 백엔드 `Country.java`(`dfea737`, 상위 단계 이름 "광역" → "주")의 값.
 * - 시군 6곳: 이름은 실제 시군이지만 ID 숫자와 도형(사각형), `region_type`은 지어낸 값이다.
 *   ID는 서버 `/regions`의 모양(`53547021B…`)을 흉내 냈다.
 * - 백엔드는 주 단계가 있지만(`single: false`, 서버 자료 주 14·시군 325) 목 생성기는 한 단계만 만든다.
 *   주 행이 없는 목에 `single: false`를 주면 선택 줄·지도가 비므로 목은 `true`로 둔다. 두 단계 화면은 서버로 확인한다.
 */
import { korMeta } from "./kor";
import { singleLevelCountry } from "./grid";
import type { CountryMock } from "./types";

const { regions, geo, detail } = singleLevelCountry(
  "GRC",
  { labelKo: "그리스", nameEn: "Greece", box: [19.3, 34.8, 29.7, 41.8] },
  [
    { id: "53547021B10000000000001", name: "Alexandroupolis", regionType: "sufficient" },
    { id: "53547021B10000000000002", name: "Larisa", regionType: "sparse" },
    { id: "53547021B10000000000003", name: "Chalkida", regionType: "sufficient" },
    { id: "53547021B10000000000004", name: "Ilida", regionType: "sufficient" },
    { id: "53547021B10000000000005", name: "Marathonas", regionType: "sparse" },
    { id: "53547021B10000000000006", name: "Rodos", regionType: "none" },
  ],
);

export const grc: CountryMock = {
  meta: {
    ...korMeta,
    country: "GRC",
    data_end: "2026-11-14",
    labels: {
      country: "그리스",
      short: "그리스",
      lv1: "주",
      lv2: "시군",
      single: true,
      official: "그리스 소방청",
      boundary: "geoBoundaries GRC (EuroGeographics, CC BY 4.0)",
      bins: [1, 2, 3],
      season_start: 1,
    },
    sources: ["NASA FIRMS", "geoBoundaries (EuroGeographics, CC BY 4.0)", "그리스 소방청"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    // 서버 `/GRC/meta` 응답(2026-11-15 재적재 뒤) 그대로
    external_validation: {
      available: true,
      source: "그리스 소방청 산림 화재 기록 (Hellenic Fire Service, 2000~2024)",
      records: 238090,
      period: ["2001-01-01", "2024-12-31"],
    },
    // 서버 `/GRC/meta` 응답(2026-11-15, 백엔드 dfea737) 그대로
    validation: { break_test_ratio: 1.01, break_test_ci95: [0.98, 1.04], official_break: { before: 1.96, after: 0.71, inconclusive: true } },
    method_stats: {
      grid_sensitivity: [
        { "월별 R²": 0.961, "격자(도)": 0.1, "연간 오차 %": 4.3 },
        { "월별 R²": 0.961, "격자(도)": 0.05, "연간 오차 %": 4.2 },
        { "월별 R²": 0.961, "격자(도)": 0.02, "연간 오차 %": 5.4 },
        { "월별 R²": 0.967, "격자(도)": 0.01, "연간 오차 %": 6.4 },
      ],
      loocv_annual_error_pct: 6.4,
      calibration_error_pct: { terra_to_modis: 9.1, snpp_to_noaa20: 4.5, noaa21_to_noaa20: 14.0 },
      rank_corr: { annual_vs_count: 0.44, annual_vs_area: 0.53, big_fires_vs_cells: 0.69 },
    },
  },
  regions,
  geo,
  detail,
  missingGeoLevels: [],
};
