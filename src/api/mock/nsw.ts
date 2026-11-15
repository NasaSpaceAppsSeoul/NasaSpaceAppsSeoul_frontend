/*
 * 뉴사우스웨일스 목 (`decisions.md` 10-5a, 9장). 숫자는 한국 목과 같은 값을 쓰고, 구조만 이 나라대로 넣는다.
 * - `labels`, `sources`, `time_basis`: 백엔드 `Country.java`(`abfd9fe`)의 값.
 * - 지방정부 6곳: 이름은 실제 지방정부지만 ID 숫자와 도형(사각형), `region_type`은 지어낸 값이다.
 *   ID는 서버 `/regions`의 모양(`25037944B…`)을 흉내 냈다.
 */
import { korMeta } from "./kor";
import { singleLevelCountry } from "./grid";
import type { CountryMock } from "./types";

const { regions, geo, detail } = singleLevelCountry(
  "NSW",
  { labelKo: "뉴사우스웨일스", nameEn: "New South Wales", box: [141.0, -37.5, 153.7, -28.2] },
  [
    { id: "25037944B10000000000001", name: "Clarence Valley", regionType: "sufficient" },
    { id: "25037944B10000000000002", name: "Armidale", regionType: "sparse" },
    { id: "25037944B10000000000003", name: "Broken Hill", regionType: "none" },
    { id: "25037944B10000000000004", name: "Blue Mountains", regionType: "sufficient" },
    { id: "25037944B10000000000005", name: "Shoalhaven", regionType: "sufficient" },
    { id: "25037944B10000000000006", name: "Bega Valley", regionType: "sparse" },
  ],
);

export const nsw: CountryMock = {
  meta: {
    ...korMeta,
    country: "NSW",
    data_end: "2026-11-14",
    labels: {
      country: "뉴사우스웨일스",
      short: "NSW",
      lv1: "주",
      lv2: "지방정부",
      single: true,
      official: "NSW NPWS",
      boundary: "geoBoundaries AUS (호주 통계청 ABS 2022 지방정부, CC BY 4.0)",
      bins: [3, 10, 31],
      season_start: 7,
    },
    sources: ["NASA FIRMS", "geoBoundaries (ABS, CC BY 4.0)", "NSW NPWS"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    external_validation: { ...korMeta.external_validation, source: "NSW NPWS" },
    // 서버 `/NSW/meta` 응답(2026-11-15, 백엔드 dfea737) 그대로
    validation: { break_test_ratio: 1.03, break_test_ci95: [0.98, 1.08], official_break: { before: 2.92, after: 1.05, inconclusive: false } },
    method_stats: {
      grid_sensitivity: [
        { "월별 R²": 0.802, "격자(도)": 0.1, "연간 오차 %": 10.0 },
        { "월별 R²": 0.766, "격자(도)": 0.05, "연간 오차 %": 10.2 },
        { "월별 R²": 0.795, "격자(도)": 0.02, "연간 오차 %": 10.0 },
        { "월별 R²": 0.839, "격자(도)": 0.01, "연간 오차 %": 9.5 },
      ],
      loocv_annual_error_pct: 9.5,
      calibration_error_pct: { terra_to_modis: 22.5, snpp_to_noaa20: 1.8, noaa21_to_noaa20: 1.2 },
      rank_corr: { annual_vs_count: 0.75, annual_vs_area: 0.9, big_fires_vs_cells: 0.6 },
    },
  },
  regions,
  geo,
  detail,
  missingGeoLevels: [],
};
