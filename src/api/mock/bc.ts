/*
 * 브리티시컬럼비아 목 (`decisions.md` 10-5a). 숫자는 한국 목과 같은 값을 쓰고, 구조만 이 나라대로 넣는다.
 * - `labels`, `sources`, `time_basis`: 백엔드 `Country.java`의 값.
 * - 지역구 6곳: 이름은 실제 지역구지만 ID 숫자와 도형(사각형), `region_type`은 지어낸 값이다.
 *   ID는 백엔드 모양(`BC-RD-60`)을 따랐다.
 */
import { korMeta } from "./kor";
import { singleLevelCountry } from "./grid";
import type { CountryMock } from "./types";

const { regions, geo } = singleLevelCountry(
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
    },
    sources: ["NASA FIRMS", "BC Data Catalogue regional district (OGL–BC)", "BC Wildfire Service"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    external_validation: { ...korMeta.external_validation, source: "BC Wildfire Service" },
  },
  regions,
  geo,
  missingGeoLevels: [],
};
