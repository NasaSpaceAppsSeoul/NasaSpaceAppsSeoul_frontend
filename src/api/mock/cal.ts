/*
 * 캘리포니아 목 (`decisions.md` 10-5a). 숫자는 한국 목과 같은 값을 쓰고, 구조만 이 나라대로 넣는다.
 * - `labels`, `sources`, `time_basis`, `data_end`: 백엔드 `Country.java`·분석 파일 B-1의 값.
 * - 카운티 6곳: 이름은 실제 카운티지만 ID 숫자와 도형(사각형), `region_type`은 지어낸 값이다.
 *   ID는 백엔드 모양(`52423323B…`)을 흉내 냈다.
 */
import { korMeta } from "./kor";
import { singleLevelCountry } from "./grid";
import type { CountryMock } from "./types";

const { regions, geo, detail } = singleLevelCountry(
  "CAL",
  { labelKo: "캘리포니아", nameEn: "California", box: [-124.4, 32.5, -114.1, 42.0] },
  [
    { id: "52423323B10000000000001", name: "Shasta", regionType: "sufficient" },
    { id: "52423323B10000000000002", name: "Butte", regionType: "sufficient" },
    { id: "52423323B10000000000003", name: "Alpine", regionType: "none" },
    { id: "52423323B10000000000004", name: "Fresno", regionType: "sparse" },
    { id: "52423323B10000000000005", name: "Los Angeles", regionType: "sufficient" },
    { id: "52423323B10000000000006", name: "San Diego", regionType: "sparse" },
  ],
);

export const cal: CountryMock = {
  meta: {
    ...korMeta,
    country: "CAL",
    data_end: "2026-11-09",
    labels: {
      country: "캘리포니아",
      short: "캘리포니아",
      lv1: "주",
      lv2: "카운티",
      single: true,
      official: "CAL FIRE",
      boundary: "geoBoundaries USA (미국 인구조사국, 퍼블릭 도메인)",
      bins: [3, 8, 18],
      season_start: 1,
    },
    sources: ["NASA FIRMS", "geoBoundaries USA (미국 인구조사국, 퍼블릭 도메인)", "CAL FIRE"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    external_validation: { ...korMeta.external_validation, source: "CAL FIRE" },
    // 서버 `/CAL/meta` 응답(2026-11-15, 백엔드 dfea737) 그대로
    validation: { break_test_ratio: 1.02, break_test_ci95: [0.98, 1.06], official_break: { before: 2.54, after: 1.25, inconclusive: false } },
    method_stats: {
      grid_sensitivity: [
        { "월별 R²": 0.946, "격자(도)": 0.1, "연간 오차 %": 7.3 },
        { "월별 R²": 0.966, "격자(도)": 0.05, "연간 오차 %": 6.8 },
        { "월별 R²": 0.979, "격자(도)": 0.02, "연간 오차 %": 7.2 },
        { "월별 R²": 0.979, "격자(도)": 0.01, "연간 오차 %": 7.4 },
      ],
      loocv_annual_error_pct: 7.4,
      calibration_error_pct: { terra_to_modis: 4.6, snpp_to_noaa20: 5.1, noaa21_to_noaa20: 1.5 },
      rank_corr: { annual_vs_count: 0.4, annual_vs_area: 0.93, big_fires_vs_cells: 0.58 },
    },
  },
  regions,
  geo,
  detail,
  missingGeoLevels: [],
};
