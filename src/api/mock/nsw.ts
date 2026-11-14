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
    },
    sources: ["NASA FIRMS", "geoBoundaries (ABS, CC BY 4.0)", "NSW NPWS"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    external_validation: { ...korMeta.external_validation, source: "NSW NPWS" },
  },
  regions,
  geo,
  detail,
  missingGeoLevels: [],
};
