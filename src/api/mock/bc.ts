/*
 * 브리티시컬럼비아 목 (`decisions.md` 10-5a). 숫자는 한국 목과 같은 값을 쓰고, 구조만 이 나라대로 넣는다.
 * - `labels`, `sources`, `time_basis`: 백엔드 `Country.java`의 값.
 * - 지역구 6곳: 이름은 실제 지역구지만 ID 숫자와 도형(사각형), `region_type`은 지어낸 값이다.
 *   ID는 백엔드 모양(`BC-RD-60`)을 따랐다.
 */
import { korMeta } from "./kor";
import { singleLevelCountry } from "./grid";
import type { CountryMock } from "./types";

const { regions, geo, detail } = singleLevelCountry(
  "BC",
  { labelKo: "브리티시컬럼비아", nameEn: "British Columbia", box: [-139.1, 48.3, -114.0, 60.0] },
  [
    { id: "BC-RD-57", name: "Stikine", regionType: "none" },
    { id: "BC-RD-55", name: "Peace River", regionType: "sufficient" },
    { id: "BC-RD-41", name: "Cariboo", regionType: "sufficient" },
    { id: "BC-RD-33", name: "Thompson-Nicola", regionType: "sufficient" },
    { id: "BC-RD-09", name: "Fraser Valley", regionType: "sparse" },
    { id: "BC-RD-05", name: "Kootenay Boundary", regionType: "sparse" },
  ],
);

export const bc: CountryMock = {
  meta: {
    ...korMeta,
    country: "BC",
    labels: {
      country: "브리티시컬럼비아",
      short: "BC",
      lv1: "주",
      lv2: "지역구",
      single: true,
      official: "BC Wildfire Service",
      boundary: "BC Data Catalogue regional district (OGL–BC)",
      bins: [2, 8, 47],
      season_start: 1,
    },
    sources: ["NASA FIRMS", "BC Data Catalogue regional district (OGL–BC)", "BC Wildfire Service"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    external_validation: { ...korMeta.external_validation, source: "BC Wildfire Service" },
    // 서버 `/BC/meta` 응답(2026-11-15, 백엔드 dfea737) 그대로
    validation: { break_test_ratio: 1.0, break_test_ci95: [0.97, 1.03], official_break: { before: 4.99, after: 2.14, inconclusive: true } },
    method_stats: {
      grid_sensitivity: [
        { "월별 R²": 0.979, "격자(도)": 0.1, "연간 오차 %": 5.3 },
        { "월별 R²": 0.982, "격자(도)": 0.05, "연간 오차 %": 5.7 },
        { "월별 R²": 0.98, "격자(도)": 0.02, "연간 오차 %": 7.1 },
        { "월별 R²": 0.957, "격자(도)": 0.01, "연간 오차 %": 8.6 },
      ],
      loocv_annual_error_pct: 8.6,
      calibration_error_pct: { terra_to_modis: 2.6, snpp_to_noaa20: 4.7, noaa21_to_noaa20: 1.8 },
      rank_corr: { annual_vs_count: 0.58, annual_vs_area: 0.92, big_fires_vs_cells: 0.38 },
    },
  },
  regions,
  geo,
  detail,
  missingGeoLevels: [],
};
