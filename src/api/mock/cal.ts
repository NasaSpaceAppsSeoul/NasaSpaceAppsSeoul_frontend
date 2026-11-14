/*
 * 캘리포니아 목 (`decisions.md` 10-5a). 숫자는 한국 목과 같은 값을 쓰고, 구조만 이 나라대로 넣는다.
 * - `labels`, `sources`, `time_basis`, `data_end`: 백엔드 `Country.java`·분석 파일 B-1의 값.
 * - 카운티 6곳: 이름은 실제 카운티지만 ID 숫자와 도형(사각형), `region_type`은 지어낸 값이다.
 *   ID는 백엔드 모양(`52423323B…`)을 흉내 냈다.
 */
import { korMeta } from "./kor";
import { singleLevelCountry } from "./grid";
import type { CountryMock } from "./types";

const { regions, geo } = singleLevelCountry(
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
    },
    sources: ["NASA FIRMS", "geoBoundaries USA (미국 인구조사국, 퍼블릭 도메인)", "CAL FIRE"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    external_validation: { ...korMeta.external_validation, source: "CAL FIRE" },
  },
  regions,
  geo,
  missingGeoLevels: [],
};
